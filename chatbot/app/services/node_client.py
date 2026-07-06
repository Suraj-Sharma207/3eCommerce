"""
HTTP client for calling Node.js backend APIs.

Python NEVER calls the database directly. All user-specific data
(orders, cart, wishlist, profile) is fetched from the Node.js
backend, which handles authentication and authorization.
"""

import httpx
from app.config import get_settings
from app.utils.logging import get_logger
from typing import Optional

logger = get_logger(__name__)

# Shared httpx client for connection pooling
_client: Optional[httpx.AsyncClient] = None


def get_http_client() -> httpx.AsyncClient:
    """Returns a shared async HTTP client."""
    global _client

    if _client is None:
        settings = get_settings()
        _client = httpx.AsyncClient(
            base_url=settings.node_backend_url,
            timeout=10.0,
            headers={
                "Content-Type": "application/json",
                "X-Chatbot-API-Key": settings.chatbot_api_key,
                "Origin": "http://localhost:5173",
            },
        )
        logger.info(f"HTTP client initialized for {settings.node_backend_url}")

    return _client


async def close_http_client() -> None:
    """Close the HTTP client. Called during shutdown."""
    global _client
    if _client:
        await _client.aclose()
        _client = None


async def get_user_orders(
    user_id: str,
    limit: int = 5,
) -> list[dict]:
    """
    Fetch recent orders for a user from the Node.js backend.
    The backend handles authorization — we just pass the user_id.
    """
    client = get_http_client()
    try:
        response = await client.get(
            "/api/chatbot/internal/orders",
            params={"userId": user_id, "limit": limit},
        )
        response.raise_for_status()
        data = response.json()
        return data.get("data", {}).get("orders", [])
    except Exception as e:
        logger.error(f"Failed to fetch orders for user {user_id}: {e}")
        return []


async def get_user_cart(user_id: str) -> dict:
    """Fetch cart contents for a user."""
    client = get_http_client()
    try:
        response = await client.get(
            "/api/chatbot/internal/cart",
            params={"userId": user_id},
        )
        response.raise_for_status()
        data = response.json()
        return data.get("data", {})
    except Exception as e:
        logger.error(f"Failed to fetch cart for user {user_id}: {e}")
        return {}


async def get_user_wishlist(user_id: str) -> list[dict]:
    """Fetch wishlist for a user."""
    client = get_http_client()
    try:
        response = await client.get(
            "/api/chatbot/internal/wishlist",
            params={"userId": user_id},
        )
        response.raise_for_status()
        data = response.json()
        return data.get("data", {}).get("items", [])
    except Exception as e:
        logger.error(f"Failed to fetch wishlist for user {user_id}: {e}")
        return []


async def get_all_products(
    page: int = 1,
    limit: int = 50,
) -> list[dict]:
    """
    Fetch products from the Node.js backend for bulk sync.
    Used during initial product embedding sync.
    """
    client = get_http_client()
    try:
        response = await client.get(
            "/api/products",
            params={"page": page, "limit": limit},
        )
        response.raise_for_status()
        data = response.json()
        return data.get("data", {}).get("products", [])
    except Exception as e:
        logger.error(f"Failed to fetch products (page {page}): {e}")
        return []


async def get_product_by_id(product_id: str) -> Optional[dict]:
    """Fetch a single product by ID."""
    client = get_http_client()
    try:
        response = await client.get(f"/api/products/{product_id}")
        response.raise_for_status()
        data = response.json()
        return data.get("data", {}).get("product", None)
    except Exception as e:
        logger.error(f"Failed to fetch product {product_id}: {e}")
        return None

async def get_products_bulk(product_ids: list[str]) -> list[dict]:
    """Fetch multiple products from the Node.js backend to hydrate Qdrant results."""
    if not product_ids:
        return []
    client = get_http_client()
    try:
        response = await client.post(
            "/api/chatbot/internal/products/bulk",
            json={"productIds": product_ids},
        )
        response.raise_for_status()
        data = response.json()
        return data.get("data", {}).get("products", [])
    except Exception as e:
        logger.error(f"Failed to fetch bulk products: {e}")
        return []

async def get_public_settings() -> dict:
    """Fetch live public settings (store, shipping, payment) from the backend."""
    client = get_http_client()
    try:
        response = await client.get("/api/settings/public")
        response.raise_for_status()
        data = response.json()
        return data.get("data", {})
    except Exception as e:
        logger.error(f"Failed to fetch public settings: {e}")
        return {}
