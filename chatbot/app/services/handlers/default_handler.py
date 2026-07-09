from app.models.schema import ChatResponse, RequestContext
from app.services.interfaces import BaseHandler

class DefaultHandler(BaseHandler):
    """Produces fallback/default responses for unrecognized intents or non-fast-path messages."""
    
    def handle(self, context: RequestContext) -> ChatResponse:
        replies = [
            "I'm still learning and can't help with that just yet. Product search and knowledge retrieval will be available soon.",
            "That's a bit beyond what I can handle right now, but I'm working on it."
        ]
        idx = context.message_count % len(replies)
        return ChatResponse(
            reply=replies[idx],
            type="default"
        )
