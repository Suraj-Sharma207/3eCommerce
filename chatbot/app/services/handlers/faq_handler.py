from app.models.schema import ChatResponse, RequestContext
from app.services.interfaces import BaseHandler

class FAQHandler(BaseHandler):
    """Produces response payload for FAQ matches."""
    
    def handle(self, context: RequestContext) -> ChatResponse:
        prefixes = [
            "Here's what I found:\n",
            "Good question!\n",
            "I can help with that.\n",
            ""
        ]
        idx = context.message_count % len(prefixes)
        prefix = prefixes[idx]
        
        # We rely on context.faq_answer being populated by the detector's result
        answer = context.faq_answer or "I found an answer, but something went wrong displaying it."
        
        reply = f"{prefix}{answer}".strip()
        
        return ChatResponse(
            reply=reply,
            type="faq"
        )
