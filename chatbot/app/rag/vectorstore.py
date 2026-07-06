"""
Qdrant vector store client.

Manages collections and provides CRUD operations for vector points.
Collections:
  - products: Auto-synced from PostgreSQL via webhook
  - faqs: Admin-managed FAQ entries
  - policies: Shipping, warranty, return policies
  - knowledge: Buying guides, manuals, training documents
"""

from qdrant_client import QdrantClient, models
from qdrant_client.http.exceptions import UnexpectedResponse
from app.config import get_settings
from app.utils.logging import get_logger
from typing import Optional

logger = get_logger(__name__)

# Embedding dimension for Gemini gemini-embedding-2
EMBEDDING_DIM = 3072

# Collection definitions
COLLECTIONS = {
    "products": "Auto-synced product catalog from PostgreSQL",
    "faqs": "Admin-managed frequently asked questions",
    "policies": "Store policies (shipping, warranty, returns)",
    "knowledge": "Guides, manuals, and training documents",
}

# Singleton client
_client: Optional[QdrantClient] = None


def get_qdrant_client() -> QdrantClient:
    """Returns a singleton Qdrant client instance."""
    global _client

    if _client is None:
        settings = get_settings()
        
        # If no explicit Qdrant cloud/docker is used, fallback to local memory
        if "localhost" in settings.qdrant_url or "127.0.0.1" in settings.qdrant_url:
            logger.info("Using in-memory Qdrant to prevent file locks (no Docker detected)")
            _client = QdrantClient(location=":memory:")
        else:
            _client = QdrantClient(
                url=settings.qdrant_url,
                api_key=settings.qdrant_api_key or None,
                timeout=10,
            )
            logger.info(f"Connected to Qdrant at {settings.qdrant_url}")

    return _client


async def ensure_collections() -> None:
    """
    Create all required collections if they don't exist.
    Called during application startup.
    """
    client = get_qdrant_client()

    for name, description in COLLECTIONS.items():
        try:
            client.get_collection(name)
            logger.info(f"Collection '{name}' already exists")
        except (UnexpectedResponse, Exception):
            client.create_collection(
                collection_name=name,
                vectors_config=models.VectorParams(
                    size=EMBEDDING_DIM,
                    distance=models.Distance.COSINE,
                ),
            )
            logger.info(f"Created collection '{name}': {description}")


async def upsert_point(
    collection: str,
    point_id: str,
    vector: list[float],
    payload: dict,
) -> None:
    """Insert or update a single vector point."""
    client = get_qdrant_client()
    client.upsert(
        collection_name=collection,
        points=[
            models.PointStruct(
                id=point_id,
                vector=vector,
                payload=payload,
            )
        ],
    )


async def delete_point(collection: str, point_id: str) -> None:
    """Delete a single vector point by ID."""
    client = get_qdrant_client()
    client.delete(
        collection_name=collection,
        points_selector=models.PointIdsList(points=[point_id]),
    )


async def search_points(
    collection: str,
    query_vector: list[float],
    limit: int = 5,
    score_threshold: Optional[float] = None,
) -> list[dict]:
    """
    Search for similar vectors in a collection.
    Returns list of {id, score, payload} dicts.
    """
    client = get_qdrant_client()

    results = client.query_points(
        collection_name=collection,
        query=query_vector,
        limit=limit,
        score_threshold=score_threshold,
    ).points

    return [
        {
            "id": str(point.id),
            "score": point.score,
            "payload": point.payload,
        }
        for point in results
    ]


async def get_collection_info(collection: str) -> dict:
    """Get collection statistics."""
    try:
        client = get_qdrant_client()
        info = client.get_collection(collection)
        return {
            "name": collection,
            "points_count": info.points_count,
            "status": info.status.value if info.status else "unknown",
        }
    except Exception as e:
        logger.error(f"Failed to get collection info for '{collection}': {e}")
        return {"name": collection, "points_count": 0, "status": "error"}


async def check_connection() -> bool:
    """Check if Qdrant is reachable."""
    try:
        client = get_qdrant_client()
        client.get_collections()
        return True
    except Exception:
        return False
