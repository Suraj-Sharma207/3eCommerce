"""
Chat endpoint — the main conversational interface.

Receives messages from the Node.js proxy (which has already
verified the user's JWT) and routes them through the orchestrator.
"""

from fastapi import APIRouter, Request, BackgroundTasks
from app.schemas.chat import ChatRequest, ChatResponse
from app.core.orchestrator import process_message
from app.utils.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(tags=["Chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, background_tasks: BackgroundTasks):
    """
    Process a chat message.
    
    The Node.js backend sends:
      - message: The user's text
      - conversation_id: Session ID (optional)
      - user_context: Pre-verified user info (optional)
    
    Python never validates JWT — user_context is trusted
    because it comes from the authenticated Node.js gateway.
    """
    # Extract user context if provided
    user_id = None
    user_name = None

    if request.user_context:
        user_id = request.user_context.user_id
        user_name = request.user_context.user_name

    logger.info(
        f"Chat request: user={user_name or 'anonymous'}, "
        f"message='{request.message[:50]}...'"
    )

    response = await process_message(
        message=request.message,
        conversation_id=request.conversation_id,
        user_id=user_id,
        user_name=user_name,
        background_tasks=background_tasks,
    )

    return response
