from app.models.schema import ChatResponse, RequestContext
from app.services.interfaces import BaseHandler

class ThanksHandler(BaseHandler):
    """Produces response payload for Thanks matches."""
    
    def handle(self, context: RequestContext) -> ChatResponse:
        replies = [
            "You're very welcome! 😊 Let me know if there's anything else I can help with.",
            "You're welcome! Happy to help anytime you need.",
            "My pleasure! Feel free to reach out if you have more questions."
        ]
        
        idx = context.message_count % len(replies)
        
        return ChatResponse(
            reply=replies[idx],
            type="thanks"
        )
