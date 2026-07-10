import re
from typing import Optional
from rapidfuzz import fuzz
from app.services.interfaces import BaseDetector
from app.models.schema import RequestContext, IdentityResult

class IdentityDetector(BaseDetector):
    """Detects if the user is asking about the bot's identity."""

    def __init__(self) -> None:
        self.exact_matches = [
            "who are you",
            "who r u",
            "who u are",
            "who you are",
            "who are u",
            "who ru",
            "tell me about you",
            "tell me about yourself",
            "describe yourself",
            "what are you",
            "are you a bot",
            "are you human",
            "are you real",
            "whats your name",
            "what is your name",
            "your name",
            "what can you do",
            "what do you do",
            "how can you help",
            "how can you help me",
            "tell me about your services"
        ]
        
        # Regex patterns for flexible/fuzzy phrasing of capability questions
        # Matches forms like: 
        # - "which type of services do you provides/provide/offer"
        # - "what services do you offer/provide"
        # - "what can you help with" / "what can you help me with"
        self.capability_patterns = [
            re.compile(r"\bwhat\s+services\s+do\s+you\s+(offer|provide|provides)\b", re.IGNORECASE),
            re.compile(r"\bwhich\s+(type\s+of\s+)?services\s+do\s+you\s+(offer|provide|provides)\b", re.IGNORECASE),
            re.compile(r"\bwhat\s+can\s+you\s+help\s+(me\s+)?with\b", re.IGNORECASE)
        ]
        
    def detect(self, context: RequestContext) -> IdentityResult:
        norm_msg = context.normalized_message
        
        # Remove punctuation for matching
        clean_msg = re.sub(r"[^\w\s]", "", norm_msg).strip()
        
        # 1. Regex/Pattern checks for capability queries
        for pattern in self.capability_patterns:
            if pattern.search(clean_msg):
                return IdentityResult(is_identity=True)

        # 2. Word-boundary matching
        for phrase in self.exact_matches:
            if re.search(rf"\b{re.escape(phrase)}\b", clean_msg):
                return IdentityResult(is_identity=True)
                
        # 3. Fuzzy Matching
        for phrase in self.exact_matches:
            # Prevent dilution/truncation matches (e.g. 'tell me about' matching 'tell me about you')
            # by restricting fuzzy matching to strings of similar length
            if len(phrase) >= 10 and abs(len(clean_msg) - len(phrase)) > 2:
                continue
            if fuzz.ratio(clean_msg, phrase) >= 85.0:
                return IdentityResult(is_identity=True)
                
        return IdentityResult(is_identity=False)
