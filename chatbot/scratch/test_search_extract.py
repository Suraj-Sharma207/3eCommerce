from app.services.fast_path.product_search import ProductSearchDetector
from unittest.mock import MagicMock

detector = ProductSearchDetector()

tests = [
    "i want to buy office table",
    "i want to my table for my office",
    "i want a table for my office",
    "show me bedroom furniture",
    "budget of 30000 for a dining table",
    "looking for outdoor chairs under 500"
]

for t in tests:
    ctx = MagicMock()
    ctx.raw_message = t
    ctx.normalized_message = t.lower()
    res = detector.detect(ctx)
    print(f"'{t}' => search_term: '{res.search_term}', category: '{res.category}', max_price: {res.max_price}")
