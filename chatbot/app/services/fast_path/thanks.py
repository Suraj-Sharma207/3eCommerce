import re
from loguru import logger
from rapidfuzz import fuzz
from app.models.schema import RequestContext, ThanksResult
from app.services.interfaces import BaseDetector

class ThanksDetector(BaseDetector):
    """Detects if a message is expressing thanks/gratitude."""
    
    def __init__(self):
        # We use repeated-letter-tolerant regex just like GreetingDetector
        # e.g., \bth+a+n+k+s*\b matches thanks, thhhaannnkkss, etc.
        self.thanks_patterns = [
            (re.compile(r'\bth+a*n+k+s*\b', re.IGNORECASE), "thanks"),
            (re.compile(r'\bth+a+n+k+\s+y+o+u+\b', re.IGNORECASE), "thank you"),
            (re.compile(r'\bth+a+n+k+\s+u+\b', re.IGNORECASE), "thank you"),
            (re.compile(r'\bt+h+x+\b', re.IGNORECASE), "thanks"),
            (re.compile(r'\bt+y+\b', re.IGNORECASE), "thank you"),
            (re.compile(r'\bt+y+s+m+\b', re.IGNORECASE), "thank you so much"),
            (re.compile(r'\ba+p+r+e+c+i+a+t+e+\s+i+t+\b', re.IGNORECASE), "appreciate it"),
            (re.compile(r'\bm+u+c+h+\s+a+p+r+e+c+i+a+t+e+d+\b', re.IGNORECASE), "much appreciated"),
            (re.compile(r'\bth+a+n+k+s*\s+a*\s*l+o+t+\b', re.IGNORECASE), "thanks a lot"),
            (re.compile(r'\bth+a+n+k+\s+y+o+u+\s+s+o+\s+m+u+c+h+\b', re.IGNORECASE), "thank you so much")
        ]
        
        # Exact phrases to fuzzy match against for typos (e.g. "thnks", "thank yu")
        self.fuzzy_phrases = {
            "thanks": "thanks",
            "thank you": "thank you",
            "thank u": "thank you",
            "appreciate it": "appreciate it",
            "much appreciated": "much appreciated",
            "thanks a lot": "thanks a lot",
            "thank you so much": "thank you so much"
        }

    def detect(self, context: RequestContext) -> ThanksResult:
        norm_msg = context.normalized_message
        
        # Fast exit for empty
        if not norm_msg:
            return ThanksResult(is_thanks=False)

        words = norm_msg.split()
        
        # If the message is too long, it's likely not just a thanks intent
        if len(words) > 6:
            return ThanksResult(is_thanks=False)

        # 1. Check against regex patterns (catches elongations)
        for pattern, canonical in self.thanks_patterns:
            if pattern.search(norm_msg):
                return ThanksResult(is_thanks=True, canonical_thanks=canonical)
                
        # 2. Check against fuzzy matching (catches typos like "thnks")
        for phrase, canonical in self.fuzzy_phrases.items():
            if fuzz.partial_ratio(phrase, norm_msg) >= 85.0:
                return ThanksResult(is_thanks=True, canonical_thanks=canonical)
        
        return ThanksResult(is_thanks=False)
