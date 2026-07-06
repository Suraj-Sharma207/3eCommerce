"""
Product sync webhook endpoint.

Called by the Node.js backend whenever a product is created,
updated, or deleted. Triggers embedding generation and Qdrant sync.

Authentication: X-Chatbot-API-Key header (shared secret).
"""

from fastapi import APIRouter, Header, HTTPException
from app.schemas.sync import (
    ProductSyncPayload,
    SyncResponse,
    BulkSyncResponse,
)
from app.services.product_sync import sync_product, bulk_sync_products
from app.config import get_settings
from app.utils.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/sync", tags=["Sync"])


def _verify_api_key(api_key: str) -> None:
    """Verify the shared API key from Node.js."""
    settings = get_settings()
    if settings.chatbot_api_key and api_key != settings.chatbot_api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")


@router.post("/product", response_model=SyncResponse)
async def sync_product_webhook(
    payload: ProductSyncPayload,
    x_chatbot_api_key: str = Header("", alias="X-Chatbot-API-Key"),
):
    """
    Product sync webhook.
    
    Called by Node.js after product Create/Update/Delete.
    Generates embedding and upserts/deletes in Qdrant.
    """
    _verify_api_key(x_chatbot_api_key)

    product_id = payload.product.get("id", "unknown")
    logger.info(f"Product sync webhook: {payload.action} → {product_id}")

    success = await sync_product(payload.action, payload.product)

    return SyncResponse(
        success=success,
        action=payload.action,
        product_id=product_id,
        message=f"Product {payload.action} {'succeeded' if success else 'failed'}",
    )


@router.post("/bulk", response_model=BulkSyncResponse)
async def bulk_sync(
    x_chatbot_api_key: str = Header("", alias="X-Chatbot-API-Key"),
):
    """
    Bulk sync all products from PostgreSQL to Qdrant.
    Used for initial setup or manual re-sync from admin panel.
    """
    _verify_api_key(x_chatbot_api_key)

    logger.info("Bulk product sync triggered")
    result = await bulk_sync_products()

    return BulkSyncResponse(
        success=True,
        total_synced=result["total_synced"],
        total_failed=result["total_failed"],
        message=f"Bulk sync complete: {result['total_synced']} synced, {result['total_failed']} failed",
    )
