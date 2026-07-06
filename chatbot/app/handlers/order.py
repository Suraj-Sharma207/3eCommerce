"""
Order status handler — uses Node.js API (zero Gemini tokens).

Fetches order data from the Node.js backend (which owns the data)
and formats it for display. Never stores order data in Qdrant.
"""

from app.services.node_client import get_user_orders
from app.schemas.chat import ChatSource
from app.utils.logging import get_logger

logger = get_logger(__name__)


async def handle_order_status(
    message: str,
    user_id: str = "",
    **kwargs,
) -> dict:
    """
    Handle order status inquiries by fetching from Node.js API.
    
    Returns:
        {response, products, sources, gemini_used}
    """
    if not user_id:
        return {
            "response": "🔒 Your order information is protected. Please sign in to your account to view your orders, tracking, and returns.",
            "products": [],
            "sources": [],
            "gemini_used": False,
            "action": "login",
        }

    orders = await get_user_orders(user_id, limit=5)

    if not orders:
        return {
            "response": (
                "I don't see any recent orders on your account. "
                "If you recently placed an order, it may take a few minutes to appear. "
                "Would you like to browse our products instead?"
            ),
            "products": [],
            "sources": [ChatSource(type="api", title="Orders API", score=None).model_dump()],
            "gemini_used": False,
        }

    # Format order information
    response = f"Here are your recent orders:\n\n"

    for order in orders:
        order_id = order.get("id", "")[:8]
        status = order.get("status") or "Processing"
        total = order.get("total") or 0.0
        created = order.get("createdAt", "")[:10]
        items = order.get("items", [])
        items_count = len(items)
        
        # Additional hydrated fields
        tracking_number = order.get("trackingNumber")
        courier = order.get("courierPartner")
        delivery_date = order.get("estimatedDelivery") or order.get("deliveredDate")
        payment_status = order.get("paymentStatus") or "Pending"
        
        # Status emoji
        status_emoji = {
            "PENDING": "🕐",
            "PROCESSING": "⚙️",
            "SHIPPED": "🚚",
            "DELIVERED": "✅",
            "CANCELLED": "❌",
        }.get(status.upper(), "📦")

        response += f"{status_emoji} **Order #{order_id}** — {status.capitalize()}\n"
        response += f"   **Total:** ${total:.2f} | **Payment:** {payment_status.capitalize()} | **Date:** {created}\n"
        
        # Delivery Info
        if tracking_number and courier:
            response += f"   **Tracking:** {tracking_number} via {courier}\n"
        elif status.upper() in ["SHIPPED", "DELIVERED"]:
            response += f"   **Tracking:** Tracking information is not available yet.\n"
            
        if delivery_date:
            response += f"   **Delivery:** {delivery_date[:10]}\n"
            
        # Products
        if items_count > 0:
            first_item = items[0]
            product = first_item.get("product", {})
            product_name = product.get("name") if product else "a product"
            if items_count > 1:
                response += f"   **Items:** {product_name} and {items_count - 1} other item(s)\n\n"
            else:
                response += f"   **Items:** {product_name}\n\n"
        else:
            response += "\n"

    response += "Would you like more details about a specific order?"

    logger.info(f"Order status: returned {len(orders)} orders")

    return {
        "response": response,
        "products": [],
        "sources": [ChatSource(type="database", title="Live Order Database (Node API)", score=1.0).model_dump()],
        "gemini_used": False,
        "quick_replies": ["Track my order", "Download Invoice", "Return an item"]
    }
