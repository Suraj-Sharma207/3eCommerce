"""
Master API router.

Mounts health and chat routers.
"""

from fastapi import APIRouter
from app.api.health import router as health_router
from app.api.chat import router as chat_router

# Master router
api_router = APIRouter()

# Mount active sub-routers
api_router.include_router(health_router)
api_router.include_router(chat_router)
