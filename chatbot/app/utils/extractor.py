import re
from typing import Dict, Any

CATEGORIES = ["sofa", "chair", "table", "bed", "lamp", "desk", "shelf", "cabinet", "wardrobe", "rug", "mirror", "plant", "vase"]
MATERIALS = ["leather", "fabric", "wood", "metal", "glass", "plastic", "cotton", "velvet", "marble", "ceramic"]
COLORS = ["black", "white", "brown", "grey", "gray", "red", "blue", "green", "yellow", "beige", "gold", "silver"]
CAPACITIES = ["1 seater", "2 seater", "3 seater", "l shape", "single", "double", "queen", "king"]

def extract_preferences(text: str) -> Dict[str, Any]:
    """Extracts shopping preferences from text using local parsing."""
    text_lower = text.lower()
    prefs = {}

    # Handle "Any" or "No preference"
    if re.search(r'^\s*(any|no preference|whatever|doesn\'?t matter|skip|none)\s*$', text_lower):
        prefs['any'] = True
        return prefs
    
    # Extract Budget
    # Match dynamic ranges like "₹30k - 59k" or "30k - 59k"
    range_match = re.search(r'₹?\s*(\d+)[k]?\s*-\s*₹?\s*(\d+)[k]?', text_lower)
    if range_match:
        # Reformat nicely
        prefs['budget'] = f"₹{range_match.group(1)}k - {range_match.group(2)}k"
    else:
        # Match "Above ₹59k"
        above_match = re.search(r'(above|over|>)\s*(?:rs\.?|inr|\$|₹)?\s*(\d+)[k]?', text_lower)
        if above_match:
            prefs['budget'] = f"Above ₹{above_match.group(2)}k"
        else:
            # Fallback to existing "under" regex
            budget_match = re.search(r'(under|below|<|budget|max|maximum)\s*(?:of\s*)?(?:rs\.?|inr|\$|₹)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(k|thousand)?', text_lower)
            if budget_match:
                amount = float(budget_match.group(2).replace(',', ''))
                if budget_match.group(3):
                    amount *= 1000
                prefs['budget'] = f"Under ₹{amount:,.0f}"

    # Extract Category
    for cat in CATEGORIES:
        if re.search(r'\b' + cat + r's?\b', text_lower):
            prefs['category'] = cat
            break

    # Extract Material
    for mat in MATERIALS:
        if re.search(r'\b' + mat + r'\b', text_lower):
            prefs['material'] = mat
            break

    # Extract Color
    for color in COLORS:
        if re.search(r'\b' + color + r'\b', text_lower):
            prefs['color'] = color
            break

    # Extract Capacity
    for cap in CAPACITIES:
        if re.search(r'\b' + cap.replace(' ', r'\s*') + r'\b', text_lower):
            prefs['capacity'] = cap
            break

    return prefs
