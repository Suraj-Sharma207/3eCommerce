"""
Knowledge base management service.

Handles CRUD operations for admin-editable knowledge entries
(FAQs, buying guides, manuals, etc.) in Qdrant.

Knowledge Sources (auto-synced): Products — handled by product_sync.py
Knowledge Base (editable): FAQs, guides, documents — handled here
"""

from app.rag.embeddings import embed_text
from app.rag.vectorstore import upsert_point, delete_point, search_points, get_qdrant_client
from app.utils.logging import get_logger
from typing import Optional
import uuid

logger = get_logger(__name__)


def _get_collection_for_category(category: str) -> str:
    """Map a knowledge category to its Qdrant collection."""
    category_map = {
        "faq": "faqs",
        "shipping": "policies",
        "warranty": "policies",
        "return_policy": "policies",
        "returns": "policies",
        "buying_guide": "knowledge",
        "manual": "knowledge",
        "installation": "knowledge",
        "training": "knowledge",
        "guide": "knowledge",
    }
    return category_map.get(category.lower(), "knowledge")


async def add_knowledge_entry(
    title: str,
    content: str,
    category: str,
    tags: list[str] = [],
    entry_id: Optional[str] = None,
) -> str:
    """
    Add a knowledge entry to the appropriate Qdrant collection.
    Returns the entry ID.
    """
    entry_id = entry_id or str(uuid.uuid4())
    collection = _get_collection_for_category(category)

    # Build embedding text from title + content
    embedding_text = f"{title} | {content}"
    vector = await embed_text(embedding_text)

    payload = {
        "entry_id": entry_id,
        "title": title,
        "content": content,
        "category": category,
        "tags": tags,
        "type": "knowledge",
    }

    await upsert_point(collection, entry_id, vector, payload)
    logger.info(f"Added knowledge entry '{title}' to collection '{collection}'")

    return entry_id


async def update_knowledge_entry(
    entry_id: str,
    title: str,
    content: str,
    category: str,
    tags: list[str] = [],
) -> bool:
    """Update an existing knowledge entry (re-embeds the content)."""
    try:
        # Delete old entry (category might have changed)
        await delete_knowledge_entry(entry_id, category)
        # Re-create with updated content
        await add_knowledge_entry(title, content, category, tags, entry_id)
        return True
    except Exception as e:
        logger.error(f"Failed to update knowledge entry {entry_id}: {e}")
        return False


async def delete_knowledge_entry(entry_id: str, category: str) -> bool:
    """Delete a knowledge entry from Qdrant."""
    collection = _get_collection_for_category(category)
    try:
        await delete_point(collection, entry_id)
        logger.info(f"Deleted knowledge entry {entry_id} from '{collection}'")
        return True
    except Exception as e:
        logger.error(f"Failed to delete knowledge entry {entry_id}: {e}")
        return False


async def list_knowledge_entries(
    category: Optional[str] = None,
    limit: int = 50,
) -> list[dict]:
    """
    List knowledge entries from Qdrant.
    If category is specified, only lists entries from that collection.
    """
    collections = (
        [_get_collection_for_category(category)]
        if category
        else ["faqs", "policies", "knowledge"]
    )

    entries = []
    client = get_qdrant_client()

    for collection_name in collections:
        try:
            # Scroll through all points in the collection
            records, _offset = client.scroll(
                collection_name=collection_name,
                limit=limit,
                with_payload=True,
                with_vectors=False,
            )
            for record in records:
                entry = record.payload or {}
                entry["id"] = str(record.id)
                entry["collection"] = collection_name
                entries.append(entry)
        except Exception as e:
            logger.error(f"Failed to list entries from '{collection_name}': {e}")

    return entries
