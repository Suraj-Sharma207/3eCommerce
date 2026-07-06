"""
Common schemas shared across the application.
"""

from pydantic import BaseModel
from typing import Optional


class UserContext(BaseModel):
    """
    User context passed from Node.js after JWT verification.
    Python never validates JWT — this is pre-verified by the gateway.
    """
    user_id: str
    user_name: str
    user_email: Optional[str] = None
    user_role: str = "CUSTOMER"


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = "healthy"
    service: str = "ai-chatbot"
    version: str = "1.0.0"
    qdrant_connected: bool = False
    redis_connected: bool = False


class ErrorResponse(BaseModel):
    """Standard error response."""
    success: bool = False
    message: str
    detail: Optional[str] = None
