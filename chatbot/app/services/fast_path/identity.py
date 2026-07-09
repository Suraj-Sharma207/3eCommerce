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
            "what are you",
            "are you a bot",
            "are you human",
            "are you real",
            "whats your name",
            "what is your name",
            "your name"
        ]
        
    def detect(self, context: RequestContext) -> IdentityResult:
        norm_msg = context.normalized_message
        
        # Remove punctuation for matching
        clean_msg = re.sub(r"[^\w\s]", "", norm_msg).strip()
        
        # 1. Exact or Regex matching
        for phrase in self.exact_matches:
            if phrase in clean_msg:
                return IdentityResult(is_identity=True)
                
        # 2. Fuzzy Matching
        for phrase in self.exact_matches:
            if fuzz.ratio(clean_msg, phrase) >= 85.0:
                return IdentityResult(is_identity=True)
                
        return IdentityResult(is_identity=False)
