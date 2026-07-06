"""
Greeting handler — zero Gemini tokens.

Returns predefined greeting responses with randomization.
"""

import random
from app.utils.prompts import GREETING_RESPONSES
from app.utils.logging import get_logger
from app.schemas.state import ConversationState

logger = get_logger(__name__)


async def handle_greeting(
    message: str,
    user_name: str = "",
    **kwargs,
) -> dict:
    """
    Handle greeting intents with predefined responses.
    Personalizes with user name when available, and handles session memory.
    
    Returns:
        {response, products, sources, gemini_used, quick_replies}
    """
    state: ConversationState = kwargs.get("state")
    
    logger.debug("--- Greeting Handler: Debug State ---")
    logger.debug(f"Conversation Loaded: {bool(state)}")
    if state:
        logger.debug(f"Greeting Count: {state.greeting_count}")
        logger.debug(f"Current Topic: {state.current_topic}")
        logger.debug(f"Conversation Stage: {state.shopping_stage.value if state.shopping_stage else None}")
        logger.debug(f"Last Intent: {state.last_intent}")
    logger.debug("-------------------------------------")

    if state:
        # Determine if session is "active" (they have done something or already been greeted)
        is_active_session = state.last_intent is not None or state.greeting_count > 0 or state.current_topic is not None
        
        state.greeting_count += 1
        
        if is_active_session:
            if state.current_topic:
                response = f"👋 Welcome back! Are you still looking for a {state.current_topic}?"
            elif state.last_intent == "ORDER_STATUS":
                response = "👋 Hi again! Are you still looking for help with your recent orders?"
            elif state.last_intent == "CART_WISHLIST":
                response = "👋 Hi again! Did you want to review your cart or wishlist?"
            else:
                response = "👋 Hi again! What else can I help you with today?"
            
            return {
                "response": response,
                "products": [],
                "sources": [],
                "gemini_used": False,
                "quick_replies": ["Yes, please", "Something else", "View my orders"],
            }
            
    response = random.choice(GREETING_RESPONSES)

    # Personalize if we know the user's name
    if user_name:
        response = response.replace("!", f", {user_name}!", 1)

    logger.info("Handled greeting (zero tokens)")

    return {
        "response": response,
        "products": [],
        "sources": [],
        "gemini_used": False,
    }

async def handle_closing(
    message: str,
    user_name: str = "",
    **kwargs,
) -> dict:
    """
    Handle closing intents (thanks, bye).
    """
    state: ConversationState = kwargs.get("state")
    if state:
        # Reset the pending question since the user closed the conversation
        state.pending_question = None
        state.current_topic = None

    response = "You're welcome! Let me know if you need help with anything else. Have a great day!"
    
    return {
        "response": response,
        "products": [],
        "sources": [],
        "gemini_used": False,
        "quick_replies": ["View products", "Check orders"],
    }
