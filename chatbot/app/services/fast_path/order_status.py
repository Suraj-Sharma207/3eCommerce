import re
from typing import Optional
from rapidfuzz import fuzz
from app.services.interfaces import BaseDetector
from app.models.schema import RequestContext, OrderStatusResult

class OrderStatusDetector(BaseDetector):
    """Detects order status and tracking queries from user messages."""

    def __init__(self) -> None:
        # Regex patterns covering general queries
        self.tracking_keywords = [
            r"track\b",
            r"order\b.*\bstatus\b",
            r"status\b.*\border\b",
            r"where\b.*\border\b",
            r"my\s+order\b",
            r"my\s+orders\b",
            r"delivery\b.*\border\b"
        ]
        
        # Specific phrases for typo-tolerant fuzzy matching
        self.fuzzy_phrases = [
            "where is my order",
            "track my order",
            "show my order",
            "show my orders",
            "my orders",
            "order history",
            "list my orders",
            "view my orders",
            "check my orders",
            "order status",
            "delivery status"
        ]
        
        self.order_id_pattern = re.compile(r"#?(\d{4,6})\b")

    def detect(self, context: RequestContext) -> OrderStatusResult:
        norm_msg = context.normalized_message
        
        # 1. Regex check
        is_order_query = any(re.search(pattern, norm_msg) for pattern in self.tracking_keywords)
        
        # 2. Fuzzy match check
        if not is_order_query:
            for phrase in self.fuzzy_phrases:
                if fuzz.partial_ratio(phrase, norm_msg) >= 85.0:
                    is_order_query = True
                    break
        
        # 3. Order ID extraction
        order_id_match = self.order_id_pattern.search(context.raw_message)
        order_id = None
        
        if order_id_match:
            matched_text = order_id_match.group(0)
            order_id = order_id_match.group(1)
            # Only treat as order query if we matched order keywords OR the number starts with #
            if matched_text.startswith("#"):
                is_order_query = True
            
        return OrderStatusResult(
            is_order_status=is_order_query,
            order_id=order_id
        )
