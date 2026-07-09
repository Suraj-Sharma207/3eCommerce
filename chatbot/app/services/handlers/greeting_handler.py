import random
from app.models.schema import ChatResponse, RequestContext
from app.services.interfaces import BaseHandler

class GreetingHandler(BaseHandler):
    """Produces context-aware response payload for greeting messages based on conversation status."""
    
    def handle(self, context: RequestContext) -> ChatResponse:
        current_greeting = (context.canonical_greeting or "hello").capitalize()
        status = context.conversation_status
        
        # Determine emoji
        emoji = "👋"
        if context.normalized_message == "good morning":
            emoji = "☀️"
        elif context.normalized_message == "good evening":
            emoji = "🌙"
            
        # Determine the follow-up phrase based on status
        if status == "IDLE":
            follow_ups = [
                "I hope you're doing well.\nHow can I assist you today?",
                "It's nice to have you back.\nWhat can I help you with today?",
                "How may I assist you today?"
            ]
            # Use message count for deterministic selection
            idx = context.message_count % len(follow_ups)
            if idx == 2:
                reply_text = f"Welcome back. {emoji}\n{follow_ups[idx]}"
            else:
                reply_text = f"Welcome back! {emoji}\n{follow_ups[idx]}"
                
        elif status == "ACTIVE":
            follow_ups = [
                f"Thanks for the greeting again, {current_greeting}! {emoji}\nHow can I help you further?",
                f"Thanks for greeting me again, {current_greeting}! {emoji}\nWhat can I do for you now?",
                f"Appreciate the greeting again, {current_greeting}! {emoji}\nHow may I assist you further?"
            ]
            idx = context.message_count % len(follow_ups)
            reply_text = follow_ups[idx]
                
        else: # NEW or fallback
            if getattr(context, 'conversation_started', False):
                follow_ups = [
                    "Thanks for the greeting!\nHow can I help you?",
                    f"Glad you said {current_greeting}!\nWhat can I help you with?"
                ]
            else:
                follow_ups = [
                    "Welcome.\nHow can I assist you today?",
                    "I'm here to help.\nWhat can I do for you today?"
                ]
            idx = context.message_count % len(follow_ups)
            reply_text = f"{current_greeting}! {emoji}\n{follow_ups[idx]}"
            
        return ChatResponse(
            reply=reply_text,
            type="greeting"
        )
