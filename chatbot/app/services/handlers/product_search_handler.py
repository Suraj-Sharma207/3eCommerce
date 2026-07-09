import httpx
from loguru import logger
from app.config import get_settings
from app.models.schema import ChatResponse, RequestContext, PendingState
from app.services.interfaces import BaseHandler

class ProductSearchHandler(BaseHandler):
    """Handles product search queries by calling the Express products API, supporting clarification loops."""

    def __init__(self) -> None:
        self.settings = get_settings()

    def handle(self, context: RequestContext) -> ChatResponse:
        result = context.product_search_result
        if not result:
            return ChatResponse(
                reply="I'm sorry, I couldn't process your search request.",
                type="product_search"
            )

        # 1. Budget Clarification Flow (if no budget constraint is supplied yet)
        if result.max_price is None:
            # We need to ask the user for their budget
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

        # 2. Budget is present, execute API call
        params = {"limit": 5}
        if result.search_term:
            params["search"] = result.search_term
        if result.category:
            params["category"] = result.category
        if result.max_price is not None:
            params["maxPrice"] = int(result.max_price)

        url = f"{self.settings.express_api_base_url}/api/products"
        logger.info(f"Querying Express API: {url} with params: {params}")

        try:
            with httpx.Client(timeout=5.0) as client:
                response = client.get(url, params=params)
                
            if response.status_code != 200:
                logger.error(f"Express API returned status code {response.status_code}: {response.text}")
                return ChatResponse(
                    reply="I'm having trouble connecting to the product catalog right now. Please try again later.",
                    type="product_search"
                )

            res_data = response.json()
            if not res_data.get("success"):
                logger.error(f"Express API reported failure: {res_data}")
                return ChatResponse(
                    reply="I'm having trouble retrieving products at the moment.",
                    type="product_search"
                )

            # Extract products from standardized successResponse payload
            data_payload = res_data.get("data") or {}
            products_raw = data_payload.get("products") or []

            fallback_used = False
            category_fallback_used = False
            if not products_raw and result.max_price is not None:
                logger.info("First search returned zero results. Retrying query without budget constraint.")
                fallback_params = {"limit": 5}
                if result.search_term:
                    fallback_params["search"] = result.search_term
                if result.category:
                    fallback_params["category"] = result.category
                
                try:
                    with httpx.Client(timeout=5.0) as client:
                        fallback_res = client.get(url, params=fallback_params)
                    if fallback_res.status_code == 200:
                        fallback_data = fallback_res.json()
                        if fallback_data.get("success"):
                            fallback_payload = fallback_data.get("data") or {}
                            products_raw = fallback_payload.get("products") or []
                            if products_raw:
                                fallback_used = True
                                logger.info(f"Fallback search succeeded, found {len(products_raw)} products.")
                except Exception as fallback_err:
                    logger.error(f"Error fetching fallback results: {fallback_err}")

            # Category-only fallback if search_term + category returned no results
            if not products_raw and result.search_term and result.category:
                logger.info(f"Search for '{result.search_term}' in '{result.category}' returned zero results. Retrying with category only.")
                category_params = {"limit": 5, "category": result.category}
                try:
                    with httpx.Client(timeout=5.0) as client:
                        category_res = client.get(url, params=category_params)
                    if category_res.status_code == 200:
                        category_data = category_res.json()
                        if category_data.get("success"):
                            category_payload = category_data.get("data") or {}
                            products_raw = category_payload.get("products") or []
                            if products_raw:
                                category_fallback_used = True
                                logger.info(f"Category-only fallback search succeeded, found {len(products_raw)} products.")
                except Exception as cat_err:
                    logger.error(f"Error fetching category-only fallback: {cat_err}")

            if not products_raw:
                search_detail = ""
                if result.category:
                    search_detail += f" in **{result.category}**"
                if result.max_price is not None:
                    search_detail += f" under **₹{int(result.max_price):,}**"
                    
                return ChatResponse(
                    reply=f"I couldn't find any products matching those criteria{search_detail}. Would you like to try a different search?",
                    type="product_search",
                    category=result.category
                )

            # Determine response text based on whether fallback was utilized
            if category_fallback_used:
                reply = f"We don't have any **{result.search_term}** in our **{result.category}** collection, but here are some **{result.category}** options you might like:"
            elif fallback_used:
                target_term = result.search_term or result.category or "items"
                reply = f"We don't have any {target_term} under **₹{int(result.max_price):,}**, but here are some options you might like:"
            else:
                reply = "Here are a few options I found for you:"

            # Map products to structured objects for horizontal scroll render
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
