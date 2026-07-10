"""
Centralized configuration using Pydantic Settings.

Reads from environment variables (or .env file) and provides
typed, validated config to the entire application.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # ── Gemini ────────────────────────────────────────────────────────────────
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.5-flash"
    gemini_embedding_model: str = "models/gemini-embedding-2"

    # ── Qdrant ────────────────────────────────────────────────────────────────
    qdrant_url: str = "http://localhost:6333"
    qdrant_api_key: str = ""
    intent_collection_name: str = "intent_examples"

    # ── Redis ─────────────────────────────────────────────────────────────────
    redis_url: str = "redis://localhost:6379"

    # ── Node.js Backend ───────────────────────────────────────────────────────
    node_backend_url: str = "http://localhost:5000"
    express_api_base_url: str = "http://127.0.0.1:5000"

    # ── Service Auth ──────────────────────────────────────────────────────────
    chatbot_api_key: str = ""

    # ── Server ────────────────────────────────────────────────────────────────
    environment: str = "development"
    host: str = "0.0.0.0"
    port: int = 8000

    # ── AI Defaults ───────────────────────────────────────────────────────────
    similarity_threshold: float = 0.50
    semantic_similarity_threshold: float = 0.75
    conversation_memory_ttl: int = 1800  # 30 minutes in seconds
    conversation_history_length: int = 10
    max_search_results: int = 5

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        "extra": "ignore",
    }


@lru_cache()
def get_settings() -> Settings:
    """
    Returns a cached Settings instance.
    Call get_settings.cache_clear() to reload after env changes.
    """
    return Settings()

# Trigger reload
