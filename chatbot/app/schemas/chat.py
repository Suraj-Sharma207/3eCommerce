"""
Chat endpoint schemas.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from .common import UserContext
from app.models.schema import ChatMessage, ConversationMetadata, PendingState


class ChatRequest(BaseModel):
    """Incoming chat message from the frontend (via Node.js proxy)."""
    message: str = Field(..., min_length=1, max_length=2000)
    conversation_id: Optional[str] = None
    user_context: Optional[UserContext] = None
    history: Optional[List[ChatMessage]] = []
    metadata: Optional[ConversationMetadata] = None


class ProductCard(BaseModel):
    """Product data formatted for display in chat."""
    id: str
    name: str
    brand: str
    category: str
    price: float
    final_price: float
    discount_percentage: float = 0
    image_url: Optional[str] = None
    slug: Optional[str] = None
    in_stock: bool = True
    similarity_score: Optional[float] = None


class ChatSource(BaseModel):
    """Source reference for transparency in responses."""
    type: str  # "product", "faq", "policy", "knowledge"
    title: str
    score: Optional[float] = None


class ChatResponse(BaseModel):
    """Response sent back to the frontend."""
    response: str
    reply: str
    intent: str
    type: str
    conversation_id: str
    products: List[ProductCard] = []
    sources: List[ChatSource] = []
    gemini_used: bool = False
    response_time_ms: int = 0
    quick_replies: Optional[List[str]] = None
    action: Optional[str] = None
    orders: Optional[List[dict]] = None
    pending_state: Optional[PendingState] = None
    category: Optional[str] = None

