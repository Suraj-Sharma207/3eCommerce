from app.models.schema import ChatResponse, RequestContext
from app.services.interfaces import BaseHandler

class IdentityHandler(BaseHandler):
    """Handles questions regarding the bot's identity."""

    def __init__(self) -> None:
        self.replies = [
            "I'm Priyal's virtual assistant. I can help you find furniture, check your order status, or answer questions about our store. What can I help you with?",
            "I'm the AI assistant here at Priyal! I can help with product search, order status, and general questions. How can I help?",
            "I'm Priyal's shopping assistant — think of me as your guide to finding the right furniture. What are you looking for today?",
            "I am Priyal's virtual assistant! My services include helping you discover our amazing furniture catalog, checking on your order statuses, and answering any queries you might have about shopping with us."
        ]

    def handle(self, context: RequestContext) -> ChatResponse:
        reply_index = context.message_count % len(self.replies)
        reply = self.replies[reply_index]
        
        return ChatResponse(
            reply=reply,
            type="identity"
        )
