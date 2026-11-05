import time
import uuid
from loguru import logger
from app.models.schema import ChatResponse, ChatRequest, RequestContext
from app.services.fast_path.greeting import GreetingDetector
from app.services.fast_path.gibberish import GibberishDetector
from app.services.fast_path.faq import FAQDetector
from app.services.fast_path.thanks import ThanksDetector
from app.services.fast_path.normalizer import MessageNormalizer
from app.services.fast_path.order_status import OrderStatusDetector
from app.services.fast_path.product_search import ProductSearchDetector
from app.services.fast_path.identity import IdentityDetector
from app.services.handlers.greeting_handler import GreetingHandler
from app.services.handlers.gibberish_handler import GibberishHandler
from app.services.handlers.default_handler import DefaultHandler
from app.services.handlers.faq_handler import FAQHandler
from app.services.handlers.thanks_handler import ThanksHandler
from app.services.handlers.order_status_handler import OrderStatusHandler
from app.services.handlers.product_search_handler import ProductSearchHandler
from app.services.handlers.identity_handler import IdentityHandler
from app.services.semantic.intent_matcher import SemanticIntentDetector

class ChatbotService:
    """
    Coordinates the Fast Path Router, routing user messages to detectors and handlers.
    """
    
    def __init__(
        self,
        greeting_detector: GreetingDetector | None = None,
        thanks_detector: ThanksDetector | None = None,
        identity_detector: IdentityDetector | None = None,
        order_status_detector: OrderStatusDetector | None = None,
        product_search_detector: ProductSearchDetector | None = None,
        gibberish_detector: GibberishDetector | None = None,
        faq_detector: FAQDetector | None = None,
        greeting_handler: GreetingHandler | None = None,
        thanks_handler: ThanksHandler | None = None,
        identity_handler: IdentityHandler | None = None,
        order_status_handler: OrderStatusHandler | None = None,
        product_search_handler: ProductSearchHandler | None = None,
        gibberish_handler: GibberishHandler | None = None,
        faq_handler: FAQHandler | None = None,
        default_handler: DefaultHandler | None = None,
        semantic_intent_detector: SemanticIntentDetector | None = None,
    ) -> None:
        self.greeting_detector = greeting_detector or GreetingDetector()
        self.thanks_detector = thanks_detector or ThanksDetector()
        self.identity_detector = identity_detector or IdentityDetector()
        self.order_status_detector = order_status_detector or OrderStatusDetector()
        self.product_search_detector = product_search_detector or ProductSearchDetector()
        self.gibberish_detector = gibberish_detector or GibberishDetector()
        self.faq_detector = faq_detector or FAQDetector()
        self.greeting_handler = greeting_handler or GreetingHandler()
        self.thanks_handler = thanks_handler or ThanksHandler()
        self.identity_handler = identity_handler or IdentityHandler()
        self.order_status_handler = order_status_handler or OrderStatusHandler()
        self.product_search_handler = product_search_handler or ProductSearchHandler()
        self.gibberish_handler = gibberish_handler or GibberishHandler()
        self.faq_handler = faq_handler or FAQHandler()
        self.default_handler = default_handler or DefaultHandler()
        self.semantic_intent_detector = semantic_intent_detector or SemanticIntentDetector(faq_detector=self.faq_detector)
        self.normalizer = MessageNormalizer()
        
    def _create_context(self, request: ChatRequest) -> RequestContext:
        """Constructs the unified RequestContext from the incoming ChatRequest."""
        meta = request.metadata
        ctx = RequestContext(
            raw_message=request.message,
            normalized_message=self.normalizer.normalize(request.message),
            conversation_id=str(uuid.uuid4()),  # To be passed from frontend later
            session_id=str(uuid.uuid4()),      # To be passed from frontend later
            message_count=meta.messageCount if meta else 0,
            conversation_started=meta.conversationStarted if meta else False,
            conversation_status=meta.conversationStatus if meta else "NEW",
            greeting_count=meta.greetingCount if meta else 0,
            last_greeting=meta.lastGreeting if meta else None,
            last_detected_intent=meta.lastDetectedIntent if meta else None,
            last_handler=meta.lastHandler if meta else None,
            last_user_message_at=meta.lastUserMessageAt if meta else 0.0,
            last_bot_message_at=meta.lastBotMessageAt if meta else 0.0,
            last_interaction_at=meta.lastInteractionAt if meta else 0.0,
            session_started_at=meta.sessionStartedAt if meta else 0.0,
            conversation_started_at=meta.conversationStartedAt if meta else None,
            timestamp=time.time(),
            is_authenticated=meta.is_authenticated if meta else False,
            user_id=meta.user_id if meta else None,
            pending_state=meta.pendingState if meta else None
        )
        logger.info(f"Created context with pending_state: {ctx.pending_state}")
        return ctx
        
    def process_message(self, request: ChatRequest) -> ChatResponse:
        """
        Orchestration flow:
        1. Create context and normalize message exactly once.
        2. Route through detectors sequentially (Greeting -> Gibberish)
        3. Handover to matching handler, defaulting to DefaultHandler.
        """
        # Step 1: Create Context & Normalize
        context = self._create_context(request)
        
        logger.info(f"Raw Message: {repr(context.raw_message)}")
        logger.info(f"Normalized: {repr(context.normalized_message)}")
        
        # Intercept budget clarification state
        if context.pending_state and context.pending_state.awaiting == "budget":
            import re
            from app.models.schema import ProductSearchResult
            logger.info(f"Awaiting budget clarification. Previously stored: search_term={context.pending_state.search_term}, category={context.pending_state.category}")
            
            raw_msg = context.raw_message
            price_keywords_pattern = re.compile(
                r"\b(?:under|below|less\s+than|within|budget\s+of|around|max)\s*₹?\s*(\d+(?:\.\d+)?)\s*(k|K)?\b",
                re.IGNORECASE
            )
            price_match = price_keywords_pattern.search(raw_msg)
            
            max_price = None
            if price_match:
                val = float(price_match.group(1))
                if price_match.group(2):
                    max_price = val * 1000
                else:
                    max_price = val
            else:
                digits_match = re.search(r"(\d+(?:\.\d+)?)\s*(k|K)?\b", raw_msg)
                if digits_match:
                    val = float(digits_match.group(1))
                    if digits_match.group(2):
                        max_price = val * 1000
                    else:
                        max_price = val
                        
            if max_price is not None and max_price > 10000000:
                max_price = 10000000.0  # Cap extremely large numbers safely
                
            context.product_search_result = ProductSearchResult(
                is_product_search=True,
                search_term=context.pending_state.search_term,
                category=context.pending_state.category,
                max_price=max_price
            )
            
            logger.info(f"Budget parsed: {max_price}. Routing straight to ProductSearchHandler.")
            res = self.product_search_handler.handle(context)
            if res.type != "product_search_clarify" and not res.pending_state:
                res.pending_state = None  # Clear pending state once handled successfully
            return res

        # Intercept new search confirmation state (e.g. user answered "yes" to "Would you like to try a different search?")
        if context.pending_state and context.pending_state.awaiting == "new_search_confirmation":
            logger.info("Handling new_search_confirmation state.")
            norm_text = context.normalized_message.strip().lower()
            affirmative = {"yes", "yeah", "yep", "sure", "ok", "okay", "yup", "definitely", "please", "yes please", "of course", "right"}
            negative = {"no", "nope", "nah", "not now", "no thanks", "no thank you", "cancel"}

            if any(norm_text == a or norm_text.startswith(f"{a} ") for a in affirmative):
                return ChatResponse(
                    reply="Sure! What product, style, or furniture item are you looking for? (You can also specify a category like Living Room or Dining Room).",
                    type="product_search",
                    pending_state=None
                )
            elif any(norm_text == n or norm_text.startswith(f"{n} ") for n in negative):
                return ChatResponse(
                    reply="No problem! Let me know if you need help with anything else, or feel free to explore our collection above.",
                    type="general",
                    pending_state=None
                )
            else:
                context.pending_state = None
        
        # Step 2: Greeting Detection
        greeting_result = self.greeting_detector.detect(context)
        is_greeting = getattr(greeting_result, "is_greeting", greeting_result)
        logger.info(f"Greeting: {is_greeting}")
        
        if is_greeting:
            context.canonical_greeting = getattr(greeting_result, "canonical_greeting", None)
            logger.info("Selected Handler: GreetingHandler")
            return self.greeting_handler.handle(context)
            
        # Step 2.5: Thanks Detection
        thanks_result = self.thanks_detector.detect(context)
        is_thanks = getattr(thanks_result, "is_thanks", thanks_result)
        logger.info(f"Thanks: {is_thanks}")
        
        if is_thanks:
            context.canonical_thanks = getattr(thanks_result, "canonical_thanks", None)
            logger.info("Selected Handler: ThanksHandler")
            return self.thanks_handler.handle(context)

        # Step 2.6: Identity Detection
        identity_result = self.identity_detector.detect(context)
        is_identity = getattr(identity_result, "is_identity", identity_result)
        logger.info(f"Identity: {is_identity}")

        if is_identity:
            context.identity_result = identity_result
            logger.info("Selected Handler: IdentityHandler")
            return self.identity_handler.handle(context)
            
        # Step 2.7: Order Status Detection
        order_status_result = self.order_status_detector.detect(context)
        is_order_status = getattr(order_status_result, "is_order_status", False)
        logger.info(f"OrderStatus: {is_order_status}")
        
        if is_order_status:
            context.order_status_result = order_status_result
            logger.info("Selected Handler: OrderStatusHandler")
            return self.order_status_handler.handle(context)
            
        # Step 2.9: Product Search Detection
        product_search_result = self.product_search_detector.detect(context)
        is_product_search = getattr(product_search_result, "is_product_search", False)
        logger.info(f"ProductSearch: {is_product_search}")
        
        if is_product_search:
            context.product_search_result = product_search_result
            logger.info("Selected Handler: ProductSearchHandler")
            return self.product_search_handler.handle(context)
            
        # Step 3: Gibberish Detection
        gibberish_result = self.gibberish_detector.detect(context)
        is_gibberish = getattr(gibberish_result, "is_gibberish", gibberish_result)
        logger.info(f"Gibberish: {is_gibberish}")
        
        if is_gibberish:
            logger.info("Selected Handler: GibberishHandler")
            return self.gibberish_handler.handle(context)
            
        # Step 3.5: FAQ Detection
        faq_result = self.faq_detector.detect(context)
        is_faq = getattr(faq_result, "is_faq", faq_result)
        logger.info(f"FAQ: {is_faq}")
        
        if is_faq:
            context.faq_answer = getattr(faq_result, "answer", None)
            logger.info("Selected Handler: FAQHandler")
            return self.faq_handler.handle(context)
            
        # Step 3.6: Semantic Intent Matching (Fallback before DefaultHandler)
        semantic_result = self.semantic_intent_detector.detect(context)
        is_semantic_match = getattr(semantic_result, "is_match", False)
        logger.info(f"Semantic Match: {is_semantic_match}")
        
        if is_semantic_match:
            intent = getattr(semantic_result, "intent", None)
            logger.info(f"Selected Handler based on semantic intent: {intent}")
            if intent == "identity":
                return self.identity_handler.handle(context)
            elif intent == "order_status":
                return self.order_status_handler.handle(context)
            elif intent == "product_search":
                return self.product_search_handler.handle(context)
            elif intent and intent.startswith("faq_"):
                return self.faq_handler.handle(context)
            
        # Step 4: Everything Else
        logger.info("Selected Handler: DefaultHandler")
        return self.default_handler.handle(context)
