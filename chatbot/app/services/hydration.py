"""
Hydration service to merge semantic search results (Qdrant) with live database records (Node API).
"""

from app.services.node_client import get_products_bulk
from app.utils.logging import get_logger

logger = get_logger(__name__)

async def hydrate_products(qdrant_results: list[dict]) -> tuple[list[dict], list[dict]]:
    """
    Takes Qdrant vector search results and hydrates them with live data from the backend.
    
    Returns:
        tuple of (hydrated_products, sources)
    """
    if not qdrant_results:
        return [], []

    # Extract IDs
    product_ids = []
    for r in qdrant_results:
        payload = r.get("payload", {})
        if "product_id" in payload:
            product_ids.append(payload["product_id"])

    # Fetch live data
    live_products_list = await get_products_bulk(product_ids)
    
    # Map for easy access
    live_product_map = {p["id"]: p for p in live_products_list if "id" in p}

    hydrated_products = []
    sources = []

    for r in qdrant_results:
        payload = r.get("payload", {})
        pid = payload.get("product_id")
        
        # Only include if it exists in the live DB
        if pid in live_product_map:
            live_data = live_product_map[pid]
            
            # Combine semantic similarity score with live data
            hydrated = {
                "id": pid,
                "name": live_data.get("name", ""),
                "brand": live_data.get("brand", "Unknown"),
                "category": live_data.get("category", ""),
                "description": live_data.get("description", ""),
                "price": live_data.get("price", 0.0),
                "discount_percentage": live_data.get("discountPercentage", 0.0),
                "stock": live_data.get("stock", 0),
                "in_stock": live_data.get("active", True) and live_data.get("stock", 0) > 0,
                "primary_image": live_data.get("images", [{}])[0].get("url", "") if live_data.get("images") else "",
                "final_price": live_data.get("finalPrice") or (
                    live_data.get("price", 0) * (1 - live_data.get("discountPercentage", 0) / 100)
                ),
            }
            hydrated_products.append(hydrated)
            
            sources.append({
                "type": "database",
                "title": f"Live Product: {hydrated['name']}",
                "score": round(r.get("score", 0), 3)
            })
            
    logger.info(f"Hydrated {len(hydrated_products)} live products out of {len(qdrant_results)} semantic matches.")
    
    return hydrated_products, sources
