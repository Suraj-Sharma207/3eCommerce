"""
Hybrid retriever for the RAG pipeline.

Searches across Qdrant collections and returns ranked results.
Designed for future LangGraph integration as a retriever node.
"""

from app.rag.embeddings import embed_text
from app.rag.vectorstore import search_points
from app.config import get_settings
from app.utils.logging import get_logger
from typing import Optional

logger = get_logger(__name__)


async def retrieve_products(
    query: str,
    limit: int = 5,
    score_threshold: Optional[float] = None,
) -> list[dict]:
    """
    Search the products collection for relevant products.
    Returns list of product payloads with similarity scores.
    """
    settings = get_settings()
    threshold = score_threshold or settings.similarity_threshold

    query_vector = await embed_text(query)
    results = await search_points(
        collection="products",
        query_vector=query_vector,
        limit=limit,
        score_threshold=threshold,
    )

    logger.info(f"Product search for '{query[:50]}...' returned {len(results)} results")
    return results


async def retrieve_faqs(
    query: str,
    limit: int = 3,
    score_threshold: Optional[float] = None,
) -> list[dict]:
    """Search the FAQs collection."""
    settings = get_settings()
    threshold = score_threshold or settings.similarity_threshold

    query_vector = await embed_text(query)
    results = await search_points(
        collection="faqs",
        query_vector=query_vector,
        limit=limit,
        score_threshold=threshold,
    )

    logger.info(f"FAQ search for '{query[:50]}...' returned {len(results)} results")
    return results


async def retrieve_policies(
    query: str,
    limit: int = 3,
    score_threshold: Optional[float] = None,
) -> list[dict]:
    """Search the policies collection (shipping, warranty, returns)."""
    settings = get_settings()
    threshold = score_threshold or settings.similarity_threshold

    query_vector = await embed_text(query)
    results = await search_points(
        collection="policies",
        query_vector=query_vector,
        limit=limit,
        score_threshold=threshold,
    )

    logger.info(f"Policy search for '{query[:50]}...' returned {len(results)} results")
    return results


async def retrieve_knowledge(
    query: str,
    limit: int = 3,
    score_threshold: Optional[float] = None,
) -> list[dict]:
    """Search the knowledge base (guides, manuals, training docs)."""
    settings = get_settings()
    threshold = score_threshold or settings.similarity_threshold

    query_vector = await embed_text(query)
    results = await search_points(
        collection="knowledge",
        query_vector=query_vector,
        limit=limit,
        score_threshold=threshold,
    )

    logger.info(f"Knowledge search for '{query[:50]}...' returned {len(results)} results")
    return results


async def retrieve_all_knowledge(
    query: str,
    limit: int = 3,
    score_threshold: Optional[float] = None,
) -> list[dict]:
    """
    Search across FAQs, policies, and knowledge collections.
    Merges and re-ranks results by score.
    Used for general knowledge queries.
    """
    faqs = await retrieve_faqs(query, limit, score_threshold)
    policies = await retrieve_policies(query, limit, score_threshold)
    knowledge = await retrieve_knowledge(query, limit, score_threshold)

    # Merge and sort by score (descending)
    all_results = faqs + policies + knowledge
    all_results.sort(key=lambda x: x.get("score", 0), reverse=True)

    return all_results[:limit]
