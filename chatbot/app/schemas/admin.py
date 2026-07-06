"""
Admin endpoint schemas for AI management.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# ── Prompt Management ─────────────────────────────────────────────────────────

class PromptEntry(BaseModel):
    """A single editable prompt."""
    key: str  # "system", "greeting", "fallback", "shopping", "safety_rules"
    name: str
    content: str
    description: str = ""


class PromptUpdateRequest(BaseModel):
    """Request to update a specific prompt."""
    key: str
    content: str


# ── AI Settings ───────────────────────────────────────────────────────────────

class AISettings(BaseModel):
    """Configurable AI settings."""
    similarity_threshold: float = Field(0.75, ge=0.0, le=1.0)
    conversation_memory_ttl: int = Field(1800, ge=60, le=86400)
    conversation_history_length: int = Field(10, ge=1, le=50)
    streaming_enabled: bool = False
    voice_enabled: bool = False  # Future
    image_search_enabled: bool = False  # Future
    gemini_model: str = "gemini-3.5-flash"
    max_search_results: int = Field(5, ge=1, le=20)


# ── Knowledge Management ─────────────────────────────────────────────────────

class KnowledgeEntry(BaseModel):
    """A knowledge base entry (FAQ, guide, document)."""
    id: Optional[str] = None
    title: str
    content: str
    category: str  # "faq", "buying_guide", "manual", "installation", "training"
    tags: List[str] = []
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class KnowledgeCreateRequest(BaseModel):
    """Request to create a knowledge entry."""
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    category: str
    tags: List[str] = []


# ── Conversation Log ─────────────────────────────────────────────────────────

class ConversationLogEntry(BaseModel):
    """A single conversation exchange for admin review."""
    id: str
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    question: str
    intent: str
    response: str
    gemini_used: bool = False
    response_time_ms: int = 0
    sources: List[str] = []
    timestamp: str


# ── Analytics ─────────────────────────────────────────────────────────────────

class AnalyticsOverview(BaseModel):
    """AI Analytics dashboard data."""
    total_conversations: int = 0
    total_messages: int = 0
    avg_response_time_ms: float = 0
    gemini_usage_count: int = 0
    gemini_usage_percentage: float = 0
    cache_hit_rate: float = 0
    top_intents: Dict[str, int] = {}
    top_searched_products: List[Dict[str, Any]] = []
    unknown_questions: List[str] = []


# ── Playground ────────────────────────────────────────────────────────────────

class PlaygroundRequest(BaseModel):
    """Admin playground test request."""
    message: str = Field(..., min_length=1, max_length=2000)
    user_context: Optional[Dict] = None


class PlaygroundResponse(BaseModel):
    """Detailed playground response with debug info."""
    response: str
    intent: str
    knowledge_source: Optional[str] = None
    similarity_score: Optional[float] = None
    gemini_used: bool = False
    response_time_ms: int = 0
    sources: List[Dict] = []
    memory_context: List[str] = []


# ── Collection Stats ──────────────────────────────────────────────────────────

class CollectionStats(BaseModel):
    """Qdrant collection statistics."""
    name: str
    points_count: int = 0
    status: str = "unknown"
    last_synced: Optional[str] = None
