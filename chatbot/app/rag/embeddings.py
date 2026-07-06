"""
Embedding model wrapper using Google Gemini.

Converts text into vector embeddings for semantic search.
Uses the text-embedding-004 model (768 dimensions).
"""

from langchain_google_genai import GoogleGenerativeAIEmbeddings
from app.config import get_settings
from app.utils.logging import get_logger

logger = get_logger(__name__)

# Singleton embedding model instance
_embedding_model = None


def get_embedding_model() -> GoogleGenerativeAIEmbeddings:
    """
    Returns a singleton Gemini embedding model.
    Uses text-embedding-004 which produces 768-dimensional vectors.
    """
    global _embedding_model

    if _embedding_model is None:
        settings = get_settings()
        _embedding_model = GoogleGenerativeAIEmbeddings(
            model=settings.gemini_embedding_model,
            google_api_key=settings.gemini_api_key,
        )
        logger.info(f"Initialized embedding model: {settings.gemini_embedding_model}")

    return _embedding_model


async def embed_text(text: str) -> list[float]:
    """Generate an embedding vector for a single text string."""
    model = get_embedding_model()
    vector = await model.aembed_query(text)
    return vector


async def embed_texts(texts: list[str]) -> list[list[float]]:
    """Generate embedding vectors for multiple text strings."""
    model = get_embedding_model()
    vectors = await model.aembed_documents(texts)
    return vectors
