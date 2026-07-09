import time
from fastapi import APIRouter, BackgroundTasks
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chatbot import ChatbotService
from app.models.schema import ChatRequest as CBChatRequest, ConversationMetadata as CBMetadata
from app.utils.logging import get_logger

logger = get_logger(__name__)
router = APIRouter(tags=["Chat"])
chatbot_service = ChatbotService()


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, background_tasks: BackgroundTasks):
    """
    Process a chat message using the clean CB foundation chatbot service.
    Acts as a compatibility layer matching the original request/response contract.
    """
    start_time = time.time()
    user_name = request.user_context.user_name if request.user_context else "anonymous"

    logger.info(
        f"Chat request: user={user_name}, "
        f"message='{request.message[:50]}...'"
    )

    # Map to CB ChatRequest model
    cb_history = []
    if request.history:
        # Convert schemas.chat ChatMessage to models.schema ChatMessage
        from app.models.schema import ChatMessage as CBChatMessage
        cb_history = [
            CBChatMessage(role=msg.role, content=msg.content)
            for msg in request.history
        ]

    cb_metadata = request.metadata or CBMetadata(
        conversationStarted=True,
        conversationStatus="ACTIVE",
    )

    # Populate verified user context if available
    if request.user_context:
        cb_metadata.is_authenticated = True
        cb_metadata.user_id = request.user_context.user_id
    elif getattr(cb_metadata, "isAuthenticated", False):
        cb_metadata.is_authenticated = True
        cb_metadata.user_id = getattr(cb_metadata, "userId", None)

    cb_request = CBChatRequest(
        message=request.message,
        history=cb_history,
        metadata=cb_metadata
    )

    # Run the clean CB chatbot service
    cb_response = chatbot_service.process_message(cb_request)

    response_time_ms = int((time.time() - start_time) * 1000)

    # Map back to eCommerce ChatResponse schema (satisfying both frontend formats)
    return ChatResponse(
        response=cb_response.reply,
        reply=cb_response.reply,
        intent=cb_response.type,
        type=cb_response.type,
        conversation_id=request.conversation_id or "default-session",
        products=getattr(cb_response, "products", []) or [],
        sources=[],
        gemini_used=False,
        response_time_ms=response_time_ms,
        quick_replies=None,
        action=getattr(cb_response, "action", None),
        orders=getattr(cb_response, "orders", None),
        pending_state=getattr(cb_response, "pending_state", None),
        category=getattr(cb_response, "category", None)
    )
