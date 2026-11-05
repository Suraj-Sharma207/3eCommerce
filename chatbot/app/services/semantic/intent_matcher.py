import os
from loguru import logger
from qdrant_client import QdrantClient
try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    SentenceTransformer = None

from app.config import get_settings
from app.services.interfaces import BaseDetector
from app.models.schema import RequestContext, IdentityResult, OrderStatusResult, ProductSearchResult
from app.services.fast_path.faq import FAQDetector
from app.services.fast_path.order_status import OrderStatusDetector
from app.services.fast_path.product_search import ProductSearchDetector

class SemanticIntentResult:
    def __init__(self, is_match: bool, intent: str = None, confidence: float = 0.0):
        self.is_match = is_match
        self.intent = intent
        self.confidence = confidence

class SemanticIntentDetector(BaseDetector):
    """
    Semantic Intent Matcher using Qdrant + LangChain/Sentence-Transformers.
    Acts as a smart fallback before DefaultHandler.
    """
    
    def __init__(self, faq_detector: FAQDetector = None) -> None:
        self.settings = get_settings()
        self.faq_detector = faq_detector or FAQDetector()
        
        # Load embedding model once as a singleton for this instance
        if SentenceTransformer is not None:
            logger.info("Loading SentenceTransformer model 'all-MiniLM-L6-v2'...")
            try:
                self.model = SentenceTransformer('all-MiniLM-L6-v2')
                logger.info("SentenceTransformer model loaded successfully.")
            except Exception as e:
                logger.error(f"Failed to load SentenceTransformer model: {e}")
                self.model = None
        else:
            logger.warning("sentence_transformers package not installed. Skipping local embedding model.")
            self.model = None

        # Initialize Qdrant Client
        try:
            self.qdrant = QdrantClient(
                url=self.settings.qdrant_url, 
                api_key=self.settings.qdrant_api_key or None,
                timeout=3
            )
        except Exception as e:
            logger.error(f"Failed to initialize QdrantClient: {e}")
            self.qdrant = None
            
        self.collection_name = self.settings.intent_collection_name
        self.threshold = self.settings.semantic_similarity_threshold

    def detect(self, context: RequestContext) -> SemanticIntentResult:
        if not self.model or not self.qdrant:
            logger.error("SemanticIntentDetector dependencies not loaded. Returning no match.")
            return SemanticIntentResult(is_match=False)

        norm_msg = context.normalized_message
        if not norm_msg:
            return SemanticIntentResult(is_match=False)

        try:
            # Embed query
            query_vector = self.model.encode(norm_msg).tolist()
            
            # Search Qdrant
            hits = self.qdrant.search(
                collection_name=self.collection_name,
                query_vector=query_vector,
                limit=1
            )
            
            if not hits:
                return SemanticIntentResult(is_match=False)
                
            best_hit = hits[0]
            score = best_hit.score
            intent = best_hit.payload.get("intent")
            example = best_hit.payload.get("example")
            
            logger.info(f"[SemanticIntent] Query: '{norm_msg}' | Top Match: '{example}' | Intent: '{intent}' | Score: {score:.4f}")
            
            if score >= self.threshold:
                logger.info(f"Semantic matcher triggered! Routing to {intent} with score {score:.4f}")
                
                # Mutate context based on intent
                if intent == "identity":
                    context.identity_result = IdentityResult(is_identity=True)
                elif intent == "order_status":
                    # Fallback extraction to pull order_id if present
                    det = OrderStatusDetector()
                    res = det.detect(context)
                    res.is_order_status = True
                    context.order_status_result = res
                elif intent == "product_search":
                    # Fallback extraction to pull search_term, category, max_price
                    det = ProductSearchDetector()
                    res = det.detect(context)
                    res.is_product_search = True
                    context.product_search_result = res
                elif intent.startswith("faq_"):
                    # Extract the keyword mapped to the intent (e.g. 'faq_refund' -> 'refund')
                    keyword = intent.split("_", 1)[1] if "_" in intent else intent
                    matched_answer = None
                    for faq in self.faq_detector.faqs:
                        # Convert keywords to lower for matching
                        kw_list = [kw.lower() for kw in faq.get("keywords", [])]
                        # Check if the extracted keyword matches any word in the faq's keywords
                        if any(keyword in kw_item for kw_item in kw_list):
                            matched_answer = faq.get("answer")
                            break
                    
                    if matched_answer:
                        context.faq_answer = matched_answer
                    else:
                        context.faq_answer = "I found an answer, but something went wrong displaying it."
                        
                return SemanticIntentResult(is_match=True, intent=intent, confidence=score)
                
        except Exception as e:
            # Graceful error handling - log exception and fall through
            logger.error(f"Error during Qdrant query or embedding: {e}", exc_info=True)
            
        return SemanticIntentResult(is_match=False)
