import httpx
from loguru import logger
from app.config import get_settings
from app.models.schema import ChatResponse, RequestContext
from app.services.interfaces import BaseHandler

class OrderStatusHandler(BaseHandler):
    """Produces response payload for order status queries, loading orders if authenticated."""

    def __init__(self) -> None:
        self.settings = get_settings()

    def handle(self, context: RequestContext) -> ChatResponse:
        logger.info(f"[OrderStatusHandler] is_authenticated: {context.is_authenticated}, user_id: {context.user_id}")
        
        order_id = None
        if context.order_status_result:
            order_id = context.order_status_result.order_id
            
        if not context.is_authenticated:
            # Guest user: prompt to log in and set action to "open_login"
            return ChatResponse(
                reply="To check your order status, please log in first",
                type="order_status",
                action="open_login"
            )
            
        # Authenticated user: fetch their orders from the database
        orders = []
        if context.user_id:
            url = f"{self.settings.express_api_base_url}/api/chatbot/internal/orders"
            headers = {"X-Chatbot-API-Key": self.settings.chatbot_api_key}
            params = {"userId": context.user_id, "limit": 5}
            
            try:
                logger.info(f"Querying internal orders endpoint: {url} for user {context.user_id}")
                with httpx.Client(timeout=5.0) as client:
                    res = client.get(url, headers=headers, params=params)
                    
                if res.status_code == 200:
                    data = res.json()
                    if data.get("success"):
                        orders = data.get("data", {}).get("orders", [])
                        logger.info(f"Fetched {len(orders)} orders for user {context.user_id}")
                    else:
                        logger.error(f"Express internal orders reported failure: {data}")
                else:
                    logger.error(f"Express internal orders HTTP error {res.status_code}: {res.text}")
            except Exception as e:
                logger.error(f"Failed to query internal orders endpoint: {e}", exc_info=True)

        if orders:
            # We have orders! Return them in the 'orders' list field
            return ChatResponse(
                reply="You are logged in! Here are your order details:",
                type="order_status",
                orders=orders
            )
        else:
            # Fallback when no orders found or DB lookup failed
            return ChatResponse(
                reply="You are logged in! You can view your complete order history, track active shipments, and manage deliveries directly on your [Orders Dashboard](file:///c:/Users/Admin/Desktop/eCommerce/orders).",
                type="order_status"
            )
