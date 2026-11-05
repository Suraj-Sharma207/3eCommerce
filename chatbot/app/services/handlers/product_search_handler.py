import httpx
from typing import Optional
from loguru import logger
from app.config import get_settings
from app.models.schema import ChatResponse, RequestContext, PendingState
from app.services.interfaces import BaseHandler
from app.services.fast_path.product_search import FURNITURE_NOUNS

# Increased fetch limit to ensure we have enough items for post-filtering
PRODUCT_SEARCH_FETCH_LIMIT = 50

class ProductSearchHandler(BaseHandler):
    """Handles product search queries by calling the Express products API, supporting clarification loops."""

    def __init__(self) -> None:
        self.settings = get_settings()

    def _extract_base_noun_and_modifiers(self, search_term: str) -> tuple[Optional[str], list[str]]:
        if not search_term:
            return None, []
        words = search_term.lower().split()
        noun = None
        modifiers = []
        for w in words:
            singular = w[:-1] if (w.endswith("s") and len(w) > 3) else w
            if w in FURNITURE_NOUNS or singular in FURNITURE_NOUNS:
                noun = singular
            else:
                modifiers.append(w)
                if w == "wooden":
                    modifiers.append("wood")
                elif w == "wood":
                    modifiers.append("wooden")
                elif w == "leather":
                    modifiers.append("leatherette")
        return noun, modifiers

    def _filter_category_substring_matches(self, products_raw: list, search_term: str) -> list:
        """
        Filters out products that only matched because the search_term is a substring 
        of the category (e.g. searching 'bed' matching 'Bedroom' category), unless
        the user was explicitly searching for a category name.
        """
        if not products_raw or not search_term:
            return products_raw
            
        term = search_term.lower()
        categories = ["living room", "bedroom", "dining room", "office", "outdoor", "kitchen", "decor", "lighting"]
        term_clean = term.replace(" ", "")
        is_category_search = any(term_clean == c.replace(" ", "") for c in categories)
        
        if is_category_search:
            return products_raw
            
        import re
        words = term.split()
        category_overlap = any(
            any(w in c.lower() for c in categories)
            for w in words if len(w) > 2
        )
        
        # If none of the search words overlap with category names, Express didn't match via category substring
        if not category_overlap:
            return products_raw

        base_noun, _ = self._extract_base_noun_and_modifiers(search_term)
        keywords = set(words)
        if base_noun:
            keywords.add(base_noun)
            keywords.add(f"{base_noun}s")
        if "wooden" in keywords:
            keywords.add("wood")
        if "wood" in keywords:
            keywords.add("wooden")

        patterns = [re.compile(r'\b' + re.escape(k) + r'\b', re.IGNORECASE) for k in keywords if len(k) > 2]
        if not patterns:
            return products_raw

        filtered = []
        for p in products_raw:
            name = (p.get("name") or "")
            desc = (p.get("description") or "")
            brand = (p.get("brand") or "")
            text = f"{name} {desc} {brand}"
            if any(pat.search(text) for pat in patterns):
                filtered.append(p)
                
        return filtered if filtered else products_raw

    def _fetch_products(self, client: httpx.Client, url: str, params: dict) -> list:
        try:
            logger.info(f"Querying Express API: {url} with params: {params}")
            res = client.get(url, params=params)
            if res.status_code == 200:
                data = res.json()
                if data.get("success"):
                    payload = data.get("data") or {}
                    return payload.get("products") or []
            else:
                logger.warning(f"Express API returned status {res.status_code}: {res.text}")
        except Exception as e:
            logger.error(f"Error querying Express API with params {params}: {e}")
        return []

    def handle(self, context: RequestContext) -> ChatResponse:
        result = context.product_search_result
        if not result:
            return ChatResponse(
                reply="I'm sorry, I couldn't process your search request.",
                type="product_search"
            )

        # 1. Budget Clarification Flow (if no budget constraint is supplied yet)
        # Skip if user explicitly wants all items (e.g. "show me all sofas", "which you have")
        if result.max_price is None and not result.no_budget_required:
            target_term = result.search_term or result.category or "items"
            reply = f"Sure! What's your budget for the {target_term}?"
            
            logger.info(f"ProductSearch budget clarification triggered for: {target_term}")
            return ChatResponse(
                reply=reply,
                type="product_search_clarify",
                pending_state=PendingState(
                    awaiting="budget",
                    search_term=result.search_term,
                    category=result.category
                )
            )

        # 2. Execute API calls with intelligent multi-stage relaxation
        url = f"{self.settings.express_api_base_url}/api/products"
        base_noun, modifiers = self._extract_base_noun_and_modifiers(result.search_term or "")

        try:
            with httpx.Client(timeout=5.0) as client:
                # Step 2a: Initial search with exact search_term and budget constraint (if provided)
                params = {"limit": PRODUCT_SEARCH_FETCH_LIMIT}
                if result.search_term:
                    params["search"] = result.search_term
                if result.category:
                    params["category"] = result.category
                if result.max_price is not None:
                    params["maxPrice"] = int(result.max_price)

                products_raw = self._fetch_products(client, url, params)
                products_raw = self._filter_category_substring_matches(products_raw, result.search_term)

                fallback_used = False
                relaxed_term_used = False
                category_fallback_used = False

                # Step 2b: If no products found and budget was specified, retry without budget constraint
                if not products_raw and result.max_price is not None and result.search_term:
                    logger.info("Search with budget returned 0 results. Retrying without budget constraint.")
                    fallback_params = {"limit": PRODUCT_SEARCH_FETCH_LIMIT, "search": result.search_term}
                    if result.category:
                        fallback_params["category"] = result.category
                    raw = self._fetch_products(client, url, fallback_params)
                    raw = self._filter_category_substring_matches(raw, result.search_term)
                    if raw:
                        products_raw = raw
                        fallback_used = True
                        logger.info(f"Fallback without budget succeeded, found {len(products_raw)} products.")

                # Step 2c: If still no products and search_term is compound (e.g. "wooden table"), relax to base noun ("table")
                if not products_raw and base_noun and result.search_term and base_noun.lower() != result.search_term.lower():
                    logger.info(f"Retrying with relaxed base noun: '{base_noun}'")
                    
                    # Try base noun with budget first if budget was provided
                    if result.max_price is not None:
                        noun_params = {"limit": PRODUCT_SEARCH_FETCH_LIMIT, "search": base_noun, "maxPrice": int(result.max_price)}
                        if result.category:
                            noun_params["category"] = result.category
                        raw = self._fetch_products(client, url, noun_params)
                        raw = self._filter_category_substring_matches(raw, base_noun)
                        
                        # Check if any products match requested modifiers (e.g. "wood")
                        has_modifier_match = False
                        if raw and modifiers:
                            for p in raw:
                                p_text = f"{p.get('name', '')} {p.get('description', '')}".lower()
                                if any(m in p_text for m in modifiers):
                                    has_modifier_match = True
                                    break
                                    
                        # If matches found or modifier matched, use it
                        if raw and (has_modifier_match or not modifiers):
                            products_raw = raw
                            relaxed_term_used = True
                            logger.info(f"Relaxed search to '{base_noun}' with budget succeeded with {len(products_raw)} products.")

                    # If still no products or modifier was not met under budget, try base noun without budget constraint
                    if not products_raw:
                        noun_params_all = {"limit": PRODUCT_SEARCH_FETCH_LIMIT, "search": base_noun}
                        if result.category:
                            noun_params_all["category"] = result.category
                        raw = self._fetch_products(client, url, noun_params_all)
                        raw = self._filter_category_substring_matches(raw, base_noun)
                        if raw:
                            products_raw = raw
                            relaxed_term_used = True
                            if result.max_price is not None:
                                fallback_used = True
                            logger.info(f"Relaxed search to '{base_noun}' without budget succeeded with {len(products_raw)} products.")

                # Step 2d: Category-only fallback if search_term + category returned zero results
                if not products_raw and result.category:
                    logger.info(f"Search returned zero results. Retrying with category only: '{result.category}'")
                    cat_params = {"limit": 50, "category": result.category}
                    raw = self._fetch_products(client, url, cat_params)
                    if raw:
                        products_raw = raw
                        category_fallback_used = True
                        logger.info(f"Category-only fallback succeeded with {len(products_raw)} products.")

                # Step 2e: Score and prioritize products that match requested modifiers (e.g. "wood" / "wooden")
                if products_raw and modifiers:
                    def score_product(p):
                        name = (p.get("name") or "").lower()
                        desc = (p.get("description") or "").lower()
                        score = 0
                        for mod in modifiers:
                            if mod in name:
                                score += 10
                            elif mod in desc:
                                score += 5
                        return score
                    products_raw.sort(key=score_product, reverse=True)

                # Step 3: Handle zero products found - set pending_state so "yes" doesn't fail
                if not products_raw:
                    search_detail = ""
                    if result.category:
                        search_detail += f" in **{result.category}**"
                    if result.max_price is not None:
                        search_detail += f" under **₹{int(result.max_price):,}**"
                        
                    return ChatResponse(
                        reply=f"I couldn't find any products matching those criteria{search_detail}. Would you like to try a different search?",
                        type="product_search",
                        category=result.category,
                        pending_state=PendingState(
                            awaiting="new_search_confirmation",
                            search_term=result.search_term,
                            category=result.category
                        )
                    )

                # Step 4: Determine response text
                target_term = result.search_term or result.category or "items"
                if fallback_used and relaxed_term_used:
                    reply = f"We don't have any **{target_term}** under **₹{int(result.max_price):,}**, but here are some **{base_noun or 'furniture'}** options you might like:"
                elif fallback_used:
                    reply = f"We don't have any {target_term} under **₹{int(result.max_price):,}**, but here are some options you might like:"
                elif relaxed_term_used:
                    reply = f"We couldn't find an exact match for **{target_term}**, but here are some **{base_noun}** options:"
                elif category_fallback_used:
                    reply = f"We don't have any **{target_term}** in our **{result.category}** collection, but here are some **{result.category}** options you might like:"
                else:
                    reply = "Here are a few options I found for you:"

                # Step 5: Map products to structured objects for horizontal scroll render
                products_structured = []
                for prod in products_raw[:5]:
                    primary_image = None
                    if prod.get("images") and len(prod.get("images")) > 0:
                        primary_image = prod.get("images")[0].get("url")
                        
                    image_url = prod.get("thumbnail") or primary_image or None
                    price = prod.get("price") or 0
                    final_price = prod.get("finalPrice") or price or 0
                    brand = prod.get("brand") or "FurnitureCo"
                    in_stock = prod.get("inStock") if prod.get("inStock") is not None else True
                    
                    products_structured.append({
                        "id": prod.get("id"),
                        "name": prod.get("name", "Product"),
                        "brand": brand,
                        "category": prod.get("category", ""),
                        "price": float(price),
                        "final_price": float(final_price),
                        "discount_percentage": float(prod.get("discountPercentage") or 0),
                        "image_url": image_url,
                        "slug": prod.get("slug", ""),
                        "in_stock": bool(in_stock)
                    })

                logger.info(f"Returning {len(products_structured)} structured products to frontend")
                return ChatResponse(
                    reply=reply,
                    type="product_results",
                    products=products_structured,
                    category=result.category
                )

        except httpx.TimeoutException as e:
            logger.error(f"Timeout connecting to Express product catalog API: {e}")
            return ChatResponse(
                reply="The product catalog search timed out. Please try again in a few moments.",
                type="product_search"
            )
        except Exception as e:
            logger.error(f"Unexpected connection error querying Express API: {e}", exc_info=True)
            return ChatResponse(
                reply="I'm unable to reach the product catalog at the moment. Please check your connection or try again later.",
                type="product_search"
            )
