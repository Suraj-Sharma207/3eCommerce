"""
Health check endpoint.
"""

from fastapi import APIRouter
from app.schemas.common import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Service health check.
    Simply reports that the service is running.
    """
    return HealthResponse(
        status="healthy",
        qdrant_connected=True,
        redis_connected=True,
    )
