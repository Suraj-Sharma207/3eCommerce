"""
Master API router.

Mounts all sub-routers to create the complete API surface.
"""

from fastapi import APIRouter
from app.api.health import router as health_router
from app.api.chat import router as chat_router
from app.api.sync import router as sync_router
from app.api.admin import router as admin_router
from app.api.playground import router as playground_router

# Master router
api_router = APIRouter()

# Mount sub-routers
api_router.include_router(health_router)
api_router.include_router(chat_router)
api_router.include_router(sync_router)
api_router.include_router(admin_router)
api_router.include_router(playground_router)
