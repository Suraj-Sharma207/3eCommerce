"""
Cart & Wishlist handler — uses Node.js API (zero Gemini tokens).

Fetches cart and wishlist data from the Node.js backend.
Never stores user-specific data in Qdrant.
"""

from app.services.node_client import get_user_cart, get_user_wishlist
from app.schemas.chat import ChatSource
from app.utils.logging import get_logger

logger = get_logger(__name__)


async def handle_cart_wishlist(
    message: str,
    user_id: str = "",
    **kwargs,
) -> dict:
    """
    Handle cart and wishlist inquiries.
    
    Returns:
        {response, products, sources, gemini_used}
    """
    if not user_id:
        return {
            "response": "Your cart and wishlist are protected. Please sign in to your account to view them.",
            "products": [],
            "sources": [],
            "gemini_used": False,
            "action": "login",
        }

    msg_lower = message.lower()

    # Determine if user is asking about cart or wishlist
    if "wishlist" in msg_lower or "wish list" in msg_lower or "saved" in msg_lower or "favorite" in msg_lower:
        return await _handle_wishlist(user_id)
    else:
        return await _handle_cart(user_id)


async def _handle_cart(user_id: str) -> dict:
    """Format cart contents."""
    cart = await get_user_cart(user_id)
    items = cart.get("items", [])

    if not items:
        return {
            "response": (
                "Your cart is empty! 🛒\n\n"
                "Would you like me to help you find some products?"
            ),
            "products": [],
            "sources": [ChatSource(type="api", title="Cart API", score=None).model_dump()],
            "gemini_used": False,
        }

    cart_subtotal = cart.get("subtotal", 0)
    
    # Normally tax/shipping is on checkout, but if provided by cart:
    tax = cart.get("tax", 0)
    shipping = cart.get("shipping", 0)
    grand_total = cart_subtotal + tax + shipping

    response = f"Here's what's in your cart ({len(items)} item{'s' if len(items) != 1 else ''}):\n\n"

    for item in items:
        product = item.get("product", {})
        name = product.get("name", "Unknown")
        price = product.get("finalPrice", product.get("price", 0))
        qty = item.get("quantity", 1)
        item_total = item.get("totalPrice", price * qty)

        response += f"• **{name}** × {qty} — ${item_total:.2f}\n"

    response += f"\n**Subtotal:** ${cart_subtotal:.2f}\n"
    if tax > 0:
        response += f"**Tax:** ${tax:.2f}\n"
    if shipping > 0:
        response += f"**Shipping:** ${shipping:.2f}\n"
        
    response += f"**Total: ${grand_total:.2f}**\n\n"
    response += "Ready to checkout, or would you like to keep shopping?"

    logger.info(f"Cart handler: {len(items)} items")

    return {
        "response": response,
        "products": [],
        "sources": [ChatSource(type="database", title="Live Cart (Node API)", score=1.0).model_dump()],
        "gemini_used": False,
        "quick_replies": ["Checkout", "Keep shopping", "Clear cart"]
    }


async def _handle_wishlist(user_id: str) -> dict:
    """Format wishlist contents."""
    items = await get_user_wishlist(user_id)

    if not items:
        return {
            "response": (
                "Your wishlist is empty! ❤️\n\n"
                "Browse our products and save your favorites for later."
            ),
            "products": [],
            "sources": [ChatSource(type="api", title="Wishlist API", score=None).model_dump()],
            "gemini_used": False,
        }

    response = f"Your wishlist has {len(items)} item{'s' if len(items) != 1 else ''}:\n\n"

    for item in items:
        product = item.get("product", {})
        name = product.get("name", "Unknown")
        price = product.get("finalPrice", product.get("price", 0))
        in_stock = product.get("stock", 0) > 0
        stock_text = "✅ In Stock" if in_stock else "❌ Out of Stock"

        response += f"• **{name}** — ${price:.2f} | {stock_text}\n"

    response += "\nWould you like to add any of these to your cart?"

    logger.info(f"Wishlist handler: {len(items)} items")

    return {
        "response": response,
        "products": [],
        "sources": [ChatSource(type="database", title="Live Wishlist (Node API)", score=1.0).model_dump()],
        "gemini_used": False,
        "quick_replies": ["Move all to cart"]
    }
