"""
Policy & FAQ handler — uses Qdrant knowledge base (zero Gemini tokens).

Retrieves answers from the FAQs, policies, and knowledge collections.
Only falls back to Gemini if no relevant knowledge is found.
"""

from app.rag.retriever import retrieve_all_knowledge
from app.schemas.chat import ChatSource
from app.utils.logging import get_logger
from app.services.node_client import get_public_settings

logger = get_logger(__name__)


async def handle_policy_faq(
    message: str,
    **kwargs,
) -> dict:
    """
    Answer policy and FAQ questions from the knowledge base.
    Uses Qdrant retrieval — zero Gemini tokens when knowledge exists.
    Intercepts shipping queries to pull live data.
    
    Returns:
        {response, products, sources, gemini_used}
    """
    msg_lower = message.lower()
    if "shipping" in msg_lower or "delivery" in msg_lower:
        settings = await get_public_settings()
        shipping = settings.get("shipping", {})
        
        if shipping:
            # Build live shipping response
            free_thresh = shipping.get("freeShippingThreshold", 0)
            cost = shipping.get("standardShippingCost", 0)
            estimate = shipping.get("estimatedDeliveryDays", "3-5")
            
            response = f"**Shipping Information**\n\n"
            response += f"• **Standard Shipping:** ${cost} (Arrives in {estimate} days)\n"
            if free_thresh > 0:
                response += f"• **Free Shipping:** Available on all orders over ${free_thresh}\n"
            
            return {
                "response": response,
                "products": [],
                "sources": [ChatSource(type="database", title="Live Store Settings (Node API)", score=1.0).model_dump()],
                "gemini_used": False,
            }

    results = await retrieve_all_knowledge(message, limit=3)

    if not results:
        return {
            "response": (
                "I don't have specific information about that in our knowledge base yet. "
                "For detailed policy questions, please contact our customer support team. "
                "Is there anything else I can help you with?"
            ),
            "products": [],
            "sources": [],
            "gemini_used": False,
        }

    # Build response from the top matching knowledge entry
    top_result = results[0]
    payload = top_result.get("payload", {})
    score = top_result.get("score", 0)

    title = payload.get("title", "")
    content = payload.get("content", "")
    category = payload.get("category", "")

    # Build sources list
    sources = []
    for r in results:
        p = r.get("payload", {})
        sources.append(ChatSource(
            type=p.get("category", "knowledge"),
            title=p.get("title", ""),
            score=round(r.get("score", 0), 3),
        ))

    # Format the response
    if category in ("faq",):
        response = f"**{title}**\n\n{content}"
    else:
        response = f"Here's what I found about that:\n\n{content}"

    # If score is low, add a caveat
    if score < 0.8:
        response += (
            "\n\n---\n*If this doesn't fully answer your question, "
            "please contact our support team for more details.*"
        )

    logger.info(f"Policy/FAQ handler: top score {score:.3f}")

    return {
        "response": response,
        "products": [],
        "sources": [s.model_dump() for s in sources],
        "gemini_used": False,
    }
