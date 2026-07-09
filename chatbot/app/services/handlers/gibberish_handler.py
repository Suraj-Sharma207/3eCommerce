from app.models.schema import ChatResponse, RequestContext
from app.services.interfaces import BaseHandler

class GibberishHandler(BaseHandler):
    """Produces response payload for detected gibberish messages."""
    
    def handle(self, context: RequestContext) -> ChatResponse:
        replies = [
            "Hmm, that doesn't look like a valid message. Could you try typing that again?",
            "I couldn't make sense of that input. Mind rephrasing with actual words?"
        ]
        idx = context.message_count % len(replies)
        return ChatResponse(
            reply=replies[idx],
            type="gibberish"
        )
