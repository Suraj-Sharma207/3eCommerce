"""
Product sync webhook schemas.
"""

from pydantic import BaseModel
from typing import Optional, List


class ProductSyncPayload(BaseModel):
    """
    Product data sent from Node.js after a Create/Update/Delete operation.
    This triggers embedding generation and Qdrant upsert/delete.
    """
    action: str  # "create", "update", "delete"
    product: dict  # Full product object from Prisma


class BulkSyncRequest(BaseModel):
    """Request to sync all products from the database."""
    pass  # No body needed — triggers full re-sync


class SyncResponse(BaseModel):
    """Response after a sync operation."""
    success: bool = True
    action: str
    product_id: Optional[str] = None
    message: str = ""


class BulkSyncResponse(BaseModel):
    """Response after a bulk sync operation."""
    success: bool = True
    total_synced: int = 0
    total_failed: int = 0
    message: str = ""
