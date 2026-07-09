import re
from typing import Optional
from rapidfuzz import fuzz
from app.services.interfaces import BaseDetector
from app.models.schema import RequestContext, ProductSearchResult

class ProductSearchDetector(BaseDetector):
    """Detects product search intent, extracts search terms, categories, and price constraints."""

    CATEGORIES = ["Living Room", "Bedroom", "Dining Room", "Office", "Outdoor", "Kitchen", "Decor", "Lighting"]

    def __init__(self) -> None:
        # Search intent phrases
        self.search_triggers = [
            r"do you have",
            r"looking for",
            r"show me",
            r"search for",
            r"find me",
            r"want to buy",
            r"need a",
            r"can i buy",
            r"got any"
        ]
        
        # Furniture-related nouns to ensure context
        self.furniture_nouns = [
            "sofa", "sofas", "couch", "couches", "table", "tables", "chair", "chairs", "bed", "beds", "lamp", "lamps", "desk", "desks", 
            "dresser", "dressers", "cabinet", "cabinets", "wardrobe", "wardrobes", "recliner", "recliners", "stool", "stools", "bench", "benches",
            "bookcase", "bookcases", "shelf", "shelves", "furniture", "appliance", "appliances", "mirror", "mirrors", "vase", "vases"
        ]
        
        # Price constraint patterns (capturing digits directly following price keywords)
        self.price_pattern = re.compile(
            r"\b(?:under|below|less\s+than|within|budget\s+of|around|max)\s*₹?\s*(\d+)\b",
            re.IGNORECASE
        )

    def detect(self, context: RequestContext) -> ProductSearchResult:
        raw_msg = context.raw_message
        norm_msg = context.normalized_message
        words = norm_msg.split()
        
        # 1. Intent Detection
        # Check if any search triggers match
        has_trigger = any(re.search(trigger, norm_msg) for trigger in self.search_triggers)
        
        # Check if any furniture nouns match
        has_noun = any(noun in words for noun in self.furniture_nouns)
        
        # Check if any category is explicitly named
        matched_category = None
        for category in self.CATEGORIES:
            cat_words = category.lower().split()
            if len(cat_words) > 1:
                # Multi-word category (e.g. Living Room)
                if category.lower() in norm_msg:
                    matched_category = category
                    break
            else:
                # Single-word category (e.g. Bedroom)
                # Ensure we only match explicit category mentions (e.g. "bedroom", not "bed")
                if any(word == category.lower() or fuzz.ratio(word, category.lower()) >= 90.0 for word in words):
                    matched_category = category
                    break
                    
        is_search = has_trigger or has_noun or (matched_category is not None)
        
        if not is_search:
            return ProductSearchResult(is_product_search=False)
            
        # 2. Extract Search Term
        search_term = norm_msg

        # Clean up price constraints from search term so they don't corrupt product matching
        price_match = self.price_pattern.search(search_term)
        if price_match:
            search_term = search_term.replace(price_match.group(0), "").strip()

        # Remove trailing context like "for my office", "in living room", etc. if category was matched
        if matched_category:
            # We want to remove the category word and any preposition/articles before it
            cat_words = matched_category.lower().split()
            cat_phrase = " ".join(cat_words)
            cat_pattern = r"\b(?:for|in|to)\s+(?:my|the|a)?\s*" + re.escape(cat_phrase) + r"\b"
            if re.search(cat_pattern, search_term):
                search_term = re.sub(cat_pattern, "", search_term).strip()
            else:
                # Just remove the exact category words
                for w in cat_words:
                    search_term = re.sub(rf"\b{re.escape(w)}\b", "", search_term).strip()

        # Try to identify a core furniture noun/phrase
        found_noun = None
        search_words = search_term.split()
        for i, word in enumerate(search_words):
            if word in self.furniture_nouns:
                found_noun = word
                # Check if the word before is a modifier (e.g. 'office' chair, 'dining' table)
                filler_words = {"i", "want", "to", "my", "buy", "show", "me", "find", "get", "looking", "for", "need", "search", "can", "please", "some", "a", "an", "the", "with", "and"}
                if i > 0 and search_words[i-1] not in filler_words:
                    found_noun = f"{search_words[i-1]} {word}"
                break
                
        if found_noun:
            search_term = found_noun
        else:
            # Fallback for when no known furniture noun is present
            for trigger in self.search_triggers:
                match = re.search(trigger, search_term)
                if match:
                    search_term = search_term[match.end():].strip()
                    
            filler_words = {"i", "want", "to", "my", "buy", "show", "me", "find", "get", "looking", "for", "need", "search", "can", "please", "some", "a", "an", "the"}
            while True:
                words_list = search_term.split()
                if not words_list:
                    break
                if words_list[0].lower() in filler_words:
                    search_term = " ".join(words_list[1:])
                elif words_list[-1].lower() in filler_words:
                    search_term = " ".join(words_list[:-1])
                else:
                    break

        # Clean up punctuation and extra spaces
        search_term = re.sub(r"[^\w\s-]", "", search_term).strip()
        search_term = re.sub(r"\s+", " ", search_term)
        
        if not search_term:
            search_term = None
            
        # 3. Extract Price Constraints (max_price only when following keyword)
        max_price = None
        if price_match:
            try:
                max_price = float(price_match.group(1))
            except ValueError:
                pass
                
        return ProductSearchResult(
            is_product_search=True,
            search_term=search_term,
            category=matched_category,
            min_price=None,
            max_price=max_price
        )
