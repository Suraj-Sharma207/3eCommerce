"""
Admin endpoints for managing AI settings, prompts, and knowledge base.

Protected by X-Chatbot-API-Key (called from Node.js admin routes).
"""

from fastapi import APIRouter, Header, HTTPException, Query
from app.schemas.admin import (
    KnowledgeEntry,
    KnowledgeCreateRequest,
    AnalyticsOverview,
    CollectionStats,
)
from app.services.knowledge import (
    add_knowledge_entry,
    update_knowledge_entry,
    delete_knowledge_entry,
    list_knowledge_entries,
)
from app.services.conversation_log import (
    get_conversation_logs,
    get_analytics,
)
from app.rag.vectorstore import get_collection_info
from app.config import get_settings
from app.utils.logging import get_logger
from typing import List

logger = get_logger(__name__)

router = APIRouter(prefix="/admin", tags=["Admin"])


def _verify_api_key(api_key: str) -> None:
    """Verify the shared API key from Node.js."""
    settings = get_settings()
    if settings.chatbot_api_key and api_key != settings.chatbot_api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")


# ── Knowledge Base Management ────────────────────────────────────────────────

@router.post("/knowledge", response_model=dict)
async def create_knowledge(
    request: KnowledgeCreateRequest,
    x_chatbot_api_key: str = Header("", alias="X-Chatbot-API-Key"),
):
    """Add a new entry to the knowledge base."""
    _verify_api_key(x_chatbot_api_key)
    
    entry_id = await add_knowledge_entry(
        title=request.title,
        content=request.content,
        category=request.category,
        tags=request.tags,
    )
    return {"success": True, "id": entry_id}


@router.put("/knowledge/{entry_id}", response_model=dict)
async def update_knowledge(
    entry_id: str,
    request: KnowledgeCreateRequest,
    x_chatbot_api_key: str = Header("", alias="X-Chatbot-API-Key"),
):
    """Update an existing knowledge entry."""
    _verify_api_key(x_chatbot_api_key)
    
    success = await update_knowledge_entry(
        entry_id=entry_id,
        title=request.title,
        content=request.content,
        category=request.category,
        tags=request.tags,
    )
    return {"success": success}


@router.delete("/knowledge/{category}/{entry_id}", response_model=dict)
async def delete_knowledge(
    category: str,
    entry_id: str,
    x_chatbot_api_key: str = Header("", alias="X-Chatbot-API-Key"),
):
    """Delete a knowledge entry."""
    _verify_api_key(x_chatbot_api_key)
    
    success = await delete_knowledge_entry(entry_id, category)
    return {"success": success}


@router.get("/knowledge", response_model=List[dict])
async def list_knowledge(
    category: str = None,
    limit: int = Query(50, ge=1, le=200),
    x_chatbot_api_key: str = Header("", alias="X-Chatbot-API-Key"),
):
    """List knowledge base entries."""
    _verify_api_key(x_chatbot_api_key)
    
    return await list_knowledge_entries(category, limit)


# ── Analytics & Logs ────────────────────────────────────────────────────────

@router.get("/analytics", response_model=AnalyticsOverview)
async def get_ai_analytics(
    x_chatbot_api_key: str = Header("", alias="X-Chatbot-API-Key"),
):
    """Get AI analytics and usage stats."""
    _verify_api_key(x_chatbot_api_key)
    return await get_analytics()


@router.get("/conversations", response_model=List[dict])
async def list_conversations(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    x_chatbot_api_key: str = Header("", alias="X-Chatbot-API-Key"),
):
    """Get conversation logs for review."""
    _verify_api_key(x_chatbot_api_key)
    return await get_conversation_logs(limit, offset)


# ── Collection Stats ────────────────────────────────────────────────────────

@router.get("/collections", response_model=List[CollectionStats])
async def get_collections_stats(
    x_chatbot_api_key: str = Header("", alias="X-Chatbot-API-Key"),
):
    """Get stats for all Qdrant collections."""
    _verify_api_key(x_chatbot_api_key)
    
    collections = ["products", "faqs", "policies", "knowledge"]
    stats = []
    
    for coll in collections:
        info = await get_collection_info(coll)
        stats.append(CollectionStats(**info))
        
    return stats
