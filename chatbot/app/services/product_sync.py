"""
Product sync service.

Handles the conversion of product data into embeddings and 
their storage in Qdrant. Called by the webhook when products 
are created, updated, or deleted in the Node.js backend.

Products are the ONLY auto-synced knowledge source.
User data is NEVER stored in Qdrant.
"""

from app.rag.embeddings import embed_text
from app.rag.vectorstore import upsert_point, delete_point
from app.services.node_client import get_all_products
from app.utils.logging import get_logger

logger = get_logger(__name__)


def _build_embedding_text(product: dict) -> str:
    """
    Build a rich text representation of a product for embedding.
    Includes all searchable fields to maximize retrieval quality.
    """
    parts = [
        product.get("name", ""),
        product.get("brand", ""),
        product.get("category", ""),
        product.get("description", ""),
    ]
    # Add price context for queries like "affordable chairs"
    price = product.get("finalPrice") or product.get("price", 0)
    if price:
        parts.append(f"Price: ${price:.2f}")

    discount = product.get("discountPercentage", 0)
    if discount and discount > 0:
        parts.append(f"{discount}% off")

    return " | ".join(filter(None, parts))


def _build_payload(product: dict) -> dict:
    """
    Build the Qdrant payload (metadata stored alongside the vector).
    This data is returned in search results for display.
    """
    # Get primary image URL
    image_url = None
    images = product.get("images", [])
    if images:
        primary = next((img for img in images if img.get("isPrimary")), None)
        image_url = (primary or images[0]).get("url") if (primary or images) else None

    return {
        "product_id": product.get("id", ""),
        "name": product.get("name", ""),
        "brand": product.get("brand", ""),
        "category": product.get("category", ""),
        "description": product.get("description", "")[:500],  # Truncate long descriptions
        "price": product.get("price", 0),
        "final_price": product.get("finalPrice", 0),
        "discount_percentage": product.get("discountPercentage", 0),
        "stock": product.get("stock", 0),
        "in_stock": product.get("stock", 0) > 0,
        "slug": product.get("slug", ""),
        "image_url": image_url,
        "featured": product.get("featured", False),
        "rating": product.get("rating", 0),
    }


async def sync_product(action: str, product: dict) -> bool:
    """
    Sync a single product to Qdrant.
    
    Actions:
      - create/update: Generate embedding and upsert
      - delete: Remove from Qdrant
    """
    product_id = product.get("id", "")
    if not product_id:
        logger.error("Product sync failed: no product ID")
        return False

    try:
        if action == "delete":
            await delete_point("products", product_id)
            logger.info(f"Deleted product from Qdrant: {product_id}")
            return True

        # Create or Update — generate embedding and upsert
        embedding_text = _build_embedding_text(product)
        vector = await embed_text(embedding_text)
        payload = _build_payload(product)

        await upsert_point("products", product_id, vector, payload)
        logger.info(f"Synced product to Qdrant: {product.get('name', product_id)} ({action})")
        return True

    except Exception as e:
        logger.error(f"Product sync failed for {product_id}: {e}")
        return False


async def bulk_sync_products() -> dict:
    """
    Sync ALL products from the Node.js backend to Qdrant.
    Used for initial setup or manual re-sync from admin panel.
    
    Fetches products page by page from the Node API.
    """
    total_synced = 0
    total_failed = 0
    page = 1

    logger.info("Starting bulk product sync...")

    while True:
        products = await get_all_products(page=page, limit=50)

        if not products:
            break

        for product in products:
            success = await sync_product("create", product)
            if success:
                total_synced += 1
            else:
                total_failed += 1

        page += 1

    logger.info(f"Bulk sync complete: {total_synced} synced, {total_failed} failed")

    return {
        "total_synced": total_synced,
        "total_failed": total_failed,
    }
