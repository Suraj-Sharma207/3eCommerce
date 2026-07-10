from app.models.schema import RequestContext
from app.services.fast_path.product_search import ProductSearchDetector
from app.services.fast_path.normalizer import MessageNormalizer
import time

norm = MessageNormalizer()
det = ProductSearchDetector()

raw = "i wan to buy bed"
ctx = RequestContext(
    raw_message=raw,
    normalized_message=norm.normalize(raw),
    conversation_id="1", session_id="1", message_count=1,
    conversation_started=True, conversation_status="NEW",
    greeting_count=0, last_greeting=None, last_detected_intent=None, last_handler=None,
    last_user_message_at=0, last_bot_message_at=0, last_interaction_at=0, session_started_at=0,
    conversation_started_at=0, timestamp=time.time()
)
res = det.detect(ctx)
print("Search Term:", res.search_term)
print("Category:", res.category)
