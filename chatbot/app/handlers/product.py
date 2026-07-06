"""
Product search handler — uses Qdrant (zero Gemini tokens).

Searches the products collection in Qdrant using semantic similarity.
Returns product cards with images, prices, and availability.
"""

from app.rag.retriever import retrieve_products
from app.schemas.chat import ProductCard, ChatSource
from app.utils.logging import get_logger
from app.schemas.state import ConversationState, ShoppingStage
from app.utils.extractor import extract_preferences, MATERIALS, COLORS, CAPACITIES
from app.services.llm import generate_response
from app.services.hydration import hydrate_products
import re

logger = get_logger(__name__)

def matches_budget(price: float, budget_str: str) -> bool:
    if not budget_str or budget_str == "Any": return True
    s = budget_str.lower().replace('₹', '').replace(',', '').replace('k', '000')
    nums = re.findall(r'\d+', s)
    if "under" in s or "below" in s or "<" in s:
        if nums: return price <= float(nums[0])
    elif "above" in s or ">" in s:
        if nums: return price >= float(nums[0])
    elif "-" in s:
        if len(nums) == 2:
            return float(nums[0]) <= price <= float(nums[1])
    return True

async def handle_product_search(
    message: str,
    **kwargs,
) -> dict:
    state: ConversationState = kwargs.get("state")
    history: str = kwargs.get("history", "")
    gemini_used = False
    
    if state:
        new_prefs = extract_preferences(message)
        
        # Handle "any" logic
        if new_prefs.pop('any', False) and state.pending_question:
            setattr(state, state.pending_question, "Any")
            state.pending_question = None
            
        for k, v in new_prefs.items():
            setattr(state, k, v)
            if state.pending_question == k:
                state.pending_question = None
        
        if new_prefs.get('category'):
            state.current_topic = new_prefs['category']

        if state.shopping_stage in [ShoppingStage.GREETING, ShoppingStage.DISCOVERY]:
            state.shopping_stage = ShoppingStage.COLLECTING_PREFERENCES

    # 1. Search Qdrant with basic topic/preferences
    search_query = message
    if state:
        prefs_str = " ".join([v for v in [state.category, state.material, state.color, state.capacity] if v and v != "Any"])
        if prefs_str and prefs_str not in message:
            search_query += " " + prefs_str

    results = await retrieve_products(search_query, limit=15)
    
    if not results:
        return {
            "response": "I couldn't find any products matching your search. Try different keywords.",
            "products": [], "sources": [], "gemini_used": False,
        }

    hydrated_dicts, sources = await hydrate_products(results)
    
    # 2. Apply Budget Filter
    filtered_products = hydrated_dicts
    if state and state.budget and state.budget != "Any":
        filtered_products = [p for p in hydrated_dicts if matches_budget(p.get("final_price", 0), state.budget)]

    response_text = ""
    quick_replies = []
    
    # 3. Handle Zero Results after Budget
    if not filtered_products:
        response_text = f"I couldn't find an exact match for {state.current_topic or 'that'} within your budget, but I found some great alternatives:\n\n"
        filtered_products = hydrated_dicts[:3] # Fallback to top 3 regardless of budget
        if state:
            state.budget = None # Clear budget to allow exploring alternatives
            state.pending_question = None
    
    # 4. Determine next question dynamically
    elif state:
        prices = [p.get("final_price", 0) for p in filtered_products]
        min_p, max_p = min(prices), max(prices)
        
        # Determine available attributes in remaining products
        available_materials = set()
        available_colors = set()
        for p in filtered_products:
            desc = (p.get('description', '') + ' ' + p.get('name', '')).lower()
            for m in MATERIALS:
                if m in desc: available_materials.add(m.capitalize())
            for c in COLORS:
                if c in desc: available_colors.add(c.capitalize())
        
        # Ask Budget
        if not state.budget and (max_p - min_p) > 2000:
            state.pending_question = 'budget'
            mid1 = min_p + (max_p - min_p) * 0.33
            mid2 = min_p + (max_p - min_p) * 0.66
            quick_replies = [f"Under ₹{int(mid1/1000)}k", f"₹{int(mid1/1000)}k - {int(mid2/1000)}k", f"Above ₹{int(mid2/1000)}k", "Any"]
            response_text = f"I have several options for {state.current_topic or 'that'}. What is your budget?"
            filtered_products = [] # Don't show products yet
            
        # Ask Material
        elif not state.material and len(available_materials) > 1:
            state.pending_question = 'material'
            quick_replies = list(available_materials)[:4] + ["Any"]
            response_text = f"What kind of material do you prefer for your {state.current_topic or 'item'}?"
            filtered_products = []
            
        # Ask Color
        elif not state.color and len(available_colors) > 1:
            state.pending_question = 'color'
            quick_replies = list(available_colors)[:4] + ["Any"]
            response_text = f"Do you have a color preference?"
            filtered_products = []
            
        else:
            state.pending_question = None
            state.shopping_stage = ShoppingStage.RECOMMENDING

    # 5. Format output
    products_out = []
    if filtered_products:
        # Cap to top 3 for display
        for h in filtered_products[:3]:
            products_out.append(ProductCard(
                id=h["id"], name=h["name"], brand=h["brand"], category=h["category"],
                price=h["price"], final_price=h["final_price"], discount_percentage=h["discount_percentage"],
                image_url=h["primary_image"], slug=h["id"], in_stock=h["in_stock"], similarity_score=1.0,
            ))
            
        if not response_text:
            response_text = f"I found {len(products_out)} product{'s' if len(products_out) > 1 else ''} matching your preferences:\n\n"
            for i, p in enumerate(products_out, 1):
                stock_text = "✅ In Stock" if p.in_stock else "❌ Out of Stock"
                response_text += f"**{i}. {p.name}** by {p.brand}\n   ${p.final_price:.2f} | {stock_text}\n\n"
            quick_replies = ["View more details"]

        if state:
            state.last_products = [p.model_dump() for p in products_out]

    return {
        "response": response_text.strip(),
        "products": [p.model_dump() for p in products_out],
        "sources": [s for s in sources][:len(products_out)],
        "gemini_used": gemini_used,
        "quick_replies": quick_replies
    }
