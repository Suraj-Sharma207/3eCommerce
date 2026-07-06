"""
Central orchestrator — the brain of the chatbot.

Routes classified intents to the appropriate handler,
manages conversation memory, and logs conversations.

This module is designed as a single pipeline that can be
refactored into a LangGraph StateGraph later.

Flow:
  1. Load conversation memory from Redis
  2. Classify intent (rule-based → LLM fallback)
  3. Route to handler
  4. Save memory
  5. Log conversation
  6. Return response
"""

import time
import uuid
from app.core.intent import classify
from app.core.memory import (
    get_conversation_history,
    save_message,
    format_history,
    get_conversation_state,
    save_conversation_state,
)
from app.handlers.greeting import handle_greeting, handle_closing
from app.handlers.product import handle_product_search
from app.handlers.order import handle_order_status
from app.handlers.cart import handle_cart_wishlist
from app.handlers.policy import handle_policy_faq
from app.handlers.recommendation import handle_recommendation
from app.handlers.fallback import handle_fallback
from app.services.conversation_log import log_conversation
from app.schemas.chat import ChatResponse
from app.utils.logging import get_logger
from typing import Optional
from app.schemas.state import ConversationState

logger = get_logger(__name__)

# Intent → Handler mapping
# This structure maps directly to future LangGraph nodes
HANDLER_MAP = {
    "GREETING": handle_greeting,
    "CLOSING": handle_closing,
    "PRODUCT_SEARCH": handle_product_search,
    "PRODUCT_RECOMMENDATION": handle_recommendation,
    "ORDER_STATUS": handle_order_status,
    "CART_WISHLIST": handle_cart_wishlist,
    "POLICY_FAQ": handle_policy_faq,
    "GENERAL": handle_policy_faq,
    "GENERAL_KNOWLEDGE": handle_fallback,
    "ABUSIVE": handle_fallback,
    "FRUSTRATION": handle_fallback,
    "SPAM": handle_fallback,
    "GIBBERISH": handle_fallback,
    "EMOJI": handle_fallback,
}


from fastapi import BackgroundTasks

async def process_message(
    message: str,
    conversation_id: Optional[str] = None,
    user_id: Optional[str] = None,
    user_name: Optional[str] = None,
    background_tasks: Optional[BackgroundTasks] = None,
) -> ChatResponse:
    """
    Process a user message through the full pipeline.
    
    This is the main entry point for all chat interactions.
    
    Args:
        message: The user's message text
        conversation_id: Session ID for memory (auto-generated if None)
        user_id: Pre-verified user ID from Node.js (optional)
        user_name: User's display name (optional)
    
    Returns:
        ChatResponse with response text, products, sources, and metadata
    """
    if not conversation_id:
        conversation_id = str(uuid.uuid4())
    start_time = time.time()

    # ── Step 1: Load conversation context ─────────────────────────────────
    import asyncio
    history_messages, state = await asyncio.gather(
        get_conversation_history(conversation_id),
        get_conversation_state(conversation_id)
    )

    history_text = format_history(history_messages)
    state.authenticated = bool(user_id)
    
    if not message or not message.strip():
        # Empty message
        return ChatResponse(
            response="",
            conversation_id=conversation_id,
            intent="EMPTY",
            products=[],
            sources=[],
            gemini_used=False,
            response_time_ms=0
        )

    # ── Step 2: Classify intent ───────────────────────────────────────────
    intent, intent_gemini_used = await classify(message, state=state)
    logger.info(f"Message: '{message[:50]}...' → Intent: {intent}")

    # ── Step 3: Route to handler ──────────────────────────────────────────
    handler = HANDLER_MAP.get(intent, handle_fallback)

    try:
        result = await handler(
            message=message,
            user_id=user_id or "",
            user_name=user_name or "",
            history=history_text,
            state=state,
            intent=intent,
        )
    except Exception as e:
        logger.error(f"Error in handler {handler.__name__}: {e}")
        result = await handle_fallback(
            message=message,
            user_id=user_id or "",
            user_name=user_name or "",
            history=history_text,
            state=state,
            intent=intent,
        )

    # ── Step 4: Save conversation memory & state ──────────────────────────
    state.last_intent = intent
    
    if background_tasks:
        background_tasks.add_task(save_message, conversation_id, "user", message)
        background_tasks.add_task(save_message, conversation_id, "assistant", result["response"])
        background_tasks.add_task(save_conversation_state, state)
    else:
        await save_message(conversation_id, "user", message)
        await save_message(conversation_id, "assistant", result["response"])
        await save_conversation_state(state)

    # ── Step 5: Calculate response time ───────────────────────────────────
    response_time_ms = int((time.time() - start_time) * 1000)

    # Track if Gemini was used (either in intent classification or handler)
    gemini_used = intent_gemini_used or result.get("gemini_used", False)

    # ── Step 6: Log conversation (non-blocking) ──────────────────────────
    source_titles = [s.get("title", "") for s in result.get("sources", [])]
    
    if background_tasks:
        background_tasks.add_task(
            log_conversation,
            conversation_id=conversation_id,
            user_id=user_id,
            user_name=user_name,
            question=message,
            intent=intent,
            response=result["response"],
            gemini_used=gemini_used,
            response_time_ms=response_time_ms,
            sources=source_titles,
        )
    else:
        await log_conversation(
            conversation_id=conversation_id,
            user_id=user_id,
            user_name=user_name,
            question=message,
            intent=intent,
            response=result["response"],
            gemini_used=gemini_used,
            response_time_ms=response_time_ms,
            sources=source_titles,
        )

    # ── Step 7: Build response ────────────────────────────────────────────
    return ChatResponse(
        response=result["response"],
        conversation_id=conversation_id,
        intent=intent,
        products=result.get("products", []),
        sources=result.get("sources", []),
        gemini_used=gemini_used,
        response_time_ms=response_time_ms,
        quick_replies=result.get("quick_replies"),
        action=result.get("action"),
    )
