"""
FastAPI dependencies.

Currently lightweight, but provides a structure for future DI.
"""

from fastapi import Header, HTTPException
from app.config import get_settings


def verify_node_gateway(
    x_chatbot_api_key: str = Header(..., alias="X-Chatbot-API-Key"),
):
    """
    Dependency to verify that requests are coming from the Node.js gateway.
    Ensures that the Python service is not accessed directly.
    """
    settings = get_settings()
    if settings.chatbot_api_key and x_chatbot_api_key != settings.chatbot_api_key:
        raise HTTPException(status_code=401, detail="Unauthorized gateway access")
    
    return True
