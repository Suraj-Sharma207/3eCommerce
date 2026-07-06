"""
Recommendation handler — the ONLY handler that uses Gemini tokens.

Uses Qdrant to find candidate products, then Gemini to reason
about which products best match the customer's needs and explain why.
"""

from app.rag.retriever import retrieve_products
from app.services.llm import generate_response
from app.schemas.chat import ProductCard, ChatSource
from app.utils.prompts import SHOPPING_PROMPT, SYSTEM_PROMPT
from app.utils.logging import get_logger

logger = get_logger(__name__)


async def handle_recommendation(
    message: str,
    history: str = "",
    **kwargs,
) -> dict:
    """
    Handle product recommendation requests.
    This is the ONLY handler that uses Gemini for reasoning.
    
    Flow:
      1. Retrieve candidate products from Qdrant
      2. Pass candidates + user query to Gemini for reasoning
      3. Return Gemini's recommendation with product cards
    
    Returns:
        {response, products, sources, gemini_used}
    """
    # Step 1: Find candidate products
    results = await retrieve_products(message, limit=6, score_threshold=0.5)

    if not results:
        return {
            "response": (
                "I'd love to recommend something, but I couldn't find products "
                "matching your criteria. Could you tell me more about what "
                "you're looking for? For example:\n\n"
                "• What room is it for?\n"
                "• What's your budget range?\n"
                "• Any style preferences?"
            ),
            "products": [],
            "sources": [],
            "gemini_used": False,
        }

    # Step 2: Format product data for Gemini
    product_descriptions = []
    products = []
    sources = []

    for result in results:
        payload = result.get("payload", {})
        score = result.get("score", 0)

        desc = (
            f"- {payload.get('name', '')} by {payload.get('brand', '')}\n"
            f"  Category: {payload.get('category', '')}\n"
            f"  Price: ${payload.get('final_price', 0):.2f}"
        )
        if payload.get("discount_percentage", 0) > 0:
            desc += f" ({payload['discount_percentage']:.0f}% off)"
        desc += f"\n  {'In Stock' if payload.get('in_stock') else 'Out of Stock'}"
        desc += f"\n  Rating: {payload.get('rating', 0)}/5"
        desc += f"\n  Description: {payload.get('description', '')[:200]}"

        product_descriptions.append(desc)

        products.append(ProductCard(
            id=payload.get("product_id", ""),
            name=payload.get("name", "Unknown"),
            brand=payload.get("brand", ""),
            category=payload.get("category", ""),
            price=payload.get("price", 0),
            final_price=payload.get("final_price", 0),
            discount_percentage=payload.get("discount_percentage", 0),
            image_url=payload.get("image_url"),
            slug=payload.get("slug"),
            in_stock=payload.get("in_stock", True),
            similarity_score=round(score, 3),
        ))

        sources.append(ChatSource(
            type="product",
            title=payload.get("name", ""),
            score=round(score, 3),
        ))

    # Step 3: Ask Gemini to reason and recommend
    products_text = "\n\n".join(product_descriptions)
    prompt = SHOPPING_PROMPT.format(query=message, products=products_text)

    response = await generate_response(
        system_prompt=SYSTEM_PROMPT,
        user_message=prompt,
        history=history,
    )

    logger.info(f"Recommendation handler: {len(products)} candidates, Gemini used")

    return {
        "response": response,
        "products": [p.model_dump() for p in products],
        "sources": [s.model_dump() for s in sources],
        "gemini_used": True,
    }
