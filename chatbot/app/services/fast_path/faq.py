import json
from pathlib import Path
from rapidfuzz import fuzz
from app.models.schema import RequestContext, FAQResult
from app.services.interfaces import BaseDetector

class FAQDetector(BaseDetector):
    """Detects if a message is a Frequently Asked Question."""
    
    def __init__(self):
        faq_path = Path(__file__).parent.parent.parent / "data" / "faq.json"
        self.faqs = []
        try:
            if faq_path.exists():
                with open(faq_path, "r", encoding="utf-8") as f:
                    self.faqs = json.load(f)
        except Exception as e:
            print(f"Failed to load FAQs: {e}")
            
    def _match_question(self, normalized_message: str) -> FAQResult:
        """
        Matches the message against the knowledge base.
        Structured to easily swap out for an embedding-based approach later.
        
        # Future scaling:
        # A ProductSearchDetector or OrderStatusDetector would plug in following the identical pattern:
        # 1. Take normalized_message
        # 2. Extract entities or embeddings
        # 3. Match against a data source
        # 4. Return structured Result (e.g., ProductSearchResult)
        """
        best_match = None
        highest_score = 0.0
        
        # Stop words to ignore for aggregate scoring
        stop_words = {
            "i", "want", "to", "my", "a", "the", "what", "are", "your", "how", "do", "can", "you", "me", 
            "for", "is", "of", "in", "on", "with", "it", "this", "that", "please", "help", "have", "need", 
            "about", "their", "any", "there", "they", "them", "these", "those", "whats", "tell", "show", 
            "give", "know", "info", "information", "an", "our", "us", "yours", "mine", "he", "she", "we"
        }
        
        # Product-related nouns and category names to ignore so they don't dilute the score (e.g. "on tv", "on this sofa")
        product_nouns = {
            "tv", "television", "sofa", "sofas", "couch", "couches", "table", "tables", "chair", "chairs", 
            "bed", "beds", "lamp", "lamps", "desk", "desks", "dresser", "dressers", "cabinet", "cabinets", 
            "wardrobe", "wardrobes", "recliner", "recliners", "stool", "stools", "bench", "benches",
            "bookcase", "bookcases", "shelf", "shelves", "furniture", "appliance", "appliances", 
            "mirror", "mirrors", "vase", "vases", "living", "room", "bedroom", "dining", "office", 
            "outdoor", "kitchen", "decor", "lighting", "item", "items", "product", "products", "one"
        }
        
        # Split message into words for word-level matching
        raw_words = normalized_message.split()
        meaningful_words = [w for w in raw_words if w not in stop_words and w not in product_nouns]
        
        # If the user only typed stop words, avoid div by zero
        if not meaningful_words:
            return FAQResult(is_faq=False)
        
        for faq in self.faqs:
            keywords = [kw.lower() for kw in faq.get("keywords", [])]
            
            matched_keywords = set()
            for kw in keywords:
                # Distinguish typo correction from topic similarity (use 90.0)
                if len(kw.split()) == 1:
                    if any(fuzz.ratio(word, kw) >= 90.0 for word in raw_words):
                        matched_keywords.add(kw)
                else:
                    if fuzz.partial_ratio(kw, normalized_message) >= 90.0:
                        matched_keywords.add(kw)
            
            if not matched_keywords:
                continue
                
            # Calculate how many distinct words from the keywords actually matched
            matched_kw_words = set()
            for kw in matched_keywords:
                matched_kw_words.update(kw.split())
                
            num_matched_words = len(matched_kw_words)
            
            # Require at least 2 distinct keyword word hits if the message contains > 1 meaningful word
            if len(meaningful_words) > 1 and num_matched_words < 2:
                continue
            
            # Aggregate score (words matched / meaningful words) must be >= 0.75
            aggregate_score = num_matched_words / len(meaningful_words)
            
            if aggregate_score >= 0.75:
                if aggregate_score > highest_score:
                    highest_score = aggregate_score
                    best_match = faq
                
        if best_match and highest_score > 0:
            return FAQResult(
                is_faq=True,
                matched_question=best_match.get("question"),
                answer=best_match.get("answer"),
                confidence=float(highest_score)
            )
            
        return FAQResult(is_faq=False)

    def detect(self, context: RequestContext) -> FAQResult:
        if not context.normalized_message:
            return FAQResult(is_faq=False)
            
        return self._match_question(context.normalized_message)
