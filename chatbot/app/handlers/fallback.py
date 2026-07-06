"""
Fallback handler — politely declines unrelated queries.

Uses zero Gemini tokens. Returns a predefined response that
redirects the user toward shopping-related topics.
"""

from app.utils.prompts import FALLBACK_RESPONSE
from app.utils.logging import get_logger

logger = get_logger(__name__)


async def handle_fallback(
    message: str,
    **kwargs,
) -> dict:
    """
    Handle unrelated or general queries with a polite decline.
    Zero Gemini tokens.
    
    Returns:
        {response, products, sources, gemini_used}
    """
    intent = kwargs.get("intent", "UNRELATED")
    
    if intent == "GIBBERISH":
        response = "I couldn't understand your message.\nCould you rephrase it?\nI can help with products, orders, shipping and returns."
    elif intent == "ABUSIVE":
        response = "I'm here to help with shopping and support.\nIf something isn't working, let me know and I'll do my best to help."
    elif intent == "GENERAL_KNOWLEDGE":
        response = "I'm an AI Shopping Assistant, so I only support shopping-related topics like products, orders, and store policies."
    elif intent == "SPAM":
        response = "I couldn't understand that message.\nCould you ask a shopping-related question?"
    elif intent == "EMOJI":
        response = "😊\nHello!\nHow can I help you today?"
    elif intent == "FRUSTRATION":
        response = "I understand this is frustrating. I'm here to help! Would you like me to connect you with our support team or help you find a specific product?"
    else:
        response = FALLBACK_RESPONSE

    logger.info(f"Fallback handler: intent {intent} handled (zero tokens)")

    return {
        "response": response,
        "products": [],
        "sources": [],
        "gemini_used": False,
    }
