"""
Admin Playground endpoint.

Allows admins to test the AI assistant and see detailed debug info
(intent, score, Gemini usage, response time) without polluting
the production conversation logs.
"""

from fastapi import APIRouter, Header, HTTPException
import time
from app.schemas.admin import PlaygroundRequest, PlaygroundResponse
from app.core.intent import classify
from app.core.orchestrator import HANDLER_MAP
from app.handlers.fallback import handle_fallback
from app.config import get_settings
from app.utils.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/admin", tags=["Playground"])


def _verify_api_key(api_key: str) -> None:
    settings = get_settings()
    if settings.chatbot_api_key and api_key != settings.chatbot_api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")


@router.post("/playground", response_model=PlaygroundResponse)
async def playground_test(
    request: PlaygroundRequest,
    x_chatbot_api_key: str = Header("", alias="X-Chatbot-API-Key"),
):
    """
    Test the AI pipeline with full debug output.
    Bypasses conversation logging and memory.
    """
    _verify_api_key(x_chatbot_api_key)
    start_time = time.time()
    
    # Extract mock user context
    user_id = request.user_context.get("user_id", "") if request.user_context else ""
    user_name = request.user_context.get("user_name", "Admin") if request.user_context else "Admin"
    
    # 1. Classify
    intent, intent_gemini_used = await classify(request.message)
    
    # 2. Route
    handler = HANDLER_MAP.get(intent, handle_fallback)
    result = await handler(
        message=request.message,
        user_id=user_id,
        user_name=user_name,
        history="[Playground Mode: No History]",
    )
    
    # 3. Analyze results
    gemini_used = intent_gemini_used or result.get("gemini_used", False)
    response_time = int((time.time() - start_time) * 1000)
    sources = result.get("sources", [])
    
    # Find the top similarity score if available
    top_score = sources[0].get("score") if sources and sources[0].get("score") is not None else None
    knowledge_source = sources[0].get("title") if sources else None
    
    return PlaygroundResponse(
        response=result["response"],
        intent=intent,
        knowledge_source=knowledge_source,
        similarity_score=top_score,
        gemini_used=gemini_used,
        response_time_ms=response_time,
        sources=sources,
        memory_context=["Playground mode does not use memory"],
    )
