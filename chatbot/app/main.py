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
from app.rag.vectorstore import ensure_collections
from app.services.node_client import close_http_client
from app.services.conversation_log import close_redis as close_log_redis
from app.core.memory import close_memory_redis
from app.schemas.common import ErrorResponse

# Initialize logging before app startup
setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan manager for FastAPI.
    Handles startup (DB connections) and shutdown (cleanup) events.
    """
    settings = get_settings()
    logger.info(f"Starting AI Shopping Assistant in {settings.environment} mode")
    
    # Ensure Qdrant collections exist
    try:
        await ensure_collections()
        logger.info("Qdrant collections verified")
    except Exception as e:
        logger.error(f"Failed to verify Qdrant collections: {e}")

    yield  # Application runs here

    logger.info("Shutting down AI Shopping Assistant")
    # Clean up connections
    await close_http_client()
    await close_log_redis()
    await close_memory_redis()


def create_app() -> FastAPI:
    """Factory function to create the FastAPI application."""
    settings = get_settings()
    
    # Disable docs in production
    is_prod = settings.environment.lower() == "production"
    
    app = FastAPI(
        title="AI Shopping Assistant",
        description="Domain-specific RAG chatbot for eCommerce",
        version="1.0.0",
        lifespan=lifespan,
        docs_url=None if is_prod else "/docs",
        redoc_url=None if is_prod else "/redoc",
        openapi_url=None if is_prod else "/openapi.json",
        responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    )

    # CORS configuration — only allow Node.js backend
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Node.js backend URL might vary, restrict via API key instead
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["*"],
    )

    # Mount API router
    app.include_router(api_router)

    return app


# Create the application instance for Uvicorn
app = create_app()
