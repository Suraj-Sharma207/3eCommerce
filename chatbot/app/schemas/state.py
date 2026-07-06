from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum


class ShoppingStage(str, Enum):
    GREETING = "GREETING"
    DISCOVERY = "DISCOVERY"
    COLLECTING_PREFERENCES = "COLLECTING_PREFERENCES"
    SEARCHING = "SEARCHING"
    RECOMMENDING = "RECOMMENDING"
    COMPARING = "COMPARING"
    DECISION = "DECISION"
    ADD_TO_CART = "ADD_TO_CART"
    CHECKOUT = "CHECKOUT"
    POST_PURCHASE_SUPPORT = "POST_PURCHASE_SUPPORT"


class ConversationState(BaseModel):
    """Tracks the state of a shopping conversation."""
    conversation_id: str
    shopping_stage: ShoppingStage = ShoppingStage.GREETING
    current_topic: Optional[str] = None
    
    # User Preferences
    last_intent: Optional[str] = None
    pending_question: Optional[str] = None
    
    # User Preferences
    budget: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    material: Optional[str] = None
    color: Optional[str] = None
    size: Optional[str] = None
    capacity: Optional[str] = None
    price_range: Optional[str] = None
    
    # Products
    selected_products: List[str] = Field(default_factory=list)
    comparison_products: List[str] = Field(default_factory=list)
    last_products: List[dict] = Field(default_factory=list)
    recommended_products: List[dict] = Field(default_factory=list)
    
    # Meta
    authenticated: bool = False
    greeting_count: int = 0
    last_activity: float = 0.0
