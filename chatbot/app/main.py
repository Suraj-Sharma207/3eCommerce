"""
FastAPI application entry point.

Manages application lifespan, CORS, and router mounting.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import get_settings
from app.utils.logging import setup_logging, get_logger
from app.api.router import api_router
from app.schemas.common import ErrorResponse

# Initialize logging before app startup
setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan manager for FastAPI.
    Handles startup and shutdown.
    """
    settings = get_settings()
    logger.info(f"Starting AI Chatbot Service in {settings.environment} mode")
    yield
    logger.info("Shutting down AI Chatbot Service")


def create_app() -> FastAPI:
    """Factory function to create the FastAPI application."""
    settings = get_settings()
    is_prod = settings.environment.lower() == "production"
    
    app = FastAPI(
        title="AI Chatbot Service",
        description="Clean baseline chatbot service using CB fast-path router",
        version="1.0.0",
        lifespan=lifespan,
        docs_url=None if is_prod else "/docs",
        redoc_url=None if is_prod else "/redoc",
        openapi_url=None if is_prod else "/openapi.json",
        responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    )

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["*"],
    )

    # Mount API router
    app.include_router(api_router)

    return app


# Create the application instance for Uvicorn
app = create_app()
