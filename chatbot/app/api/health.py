"""
Health check endpoint.
"""

from fastapi import APIRouter
from app.schemas.common import HealthResponse
from app.rag.vectorstore import check_connection as check_qdrant
from app.services.conversation_log import check_redis_connection

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Service health check.
    Reports connectivity to Qdrant and Redis.
    """
    qdrant_ok = await check_qdrant()
    redis_ok = await check_redis_connection()

    return HealthResponse(
        status="healthy" if (qdrant_ok and redis_ok) else "degraded",
        qdrant_connected=qdrant_ok,
        redis_connected=redis_ok,
    )
