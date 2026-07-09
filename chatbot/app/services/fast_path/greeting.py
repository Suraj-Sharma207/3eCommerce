import re
from app.services.interfaces import BaseDetector
from app.models.schema import RequestContext, GreetingResult

class GreetingDetector(BaseDetector):
    """Detects and normalizes various greeting formats using regex."""
    
    def __init__(self) -> None:
        # Ordered by strictness/specificity
        self.mapping_rules = [
            (r'\bg[o]+d\s+m[o]*r[n]*[i]*[n]*g\b|\bgm\b|\bmorning\b', "good morning"),
            (r'\bg[o]+d\s+ev[e]*ning\b|\bgud\s+evening\b|\bevening\b', "good evening"),
            (r'\bg[o]+d\s+n[i]+ght\b|\bg[o]+d\s+nite\b|\bgn\b|\bnight\b', "good night"),
            (r'\bh+e+l+o+\b|\bh+e+l+o+\s+t+h+e+r+e+\b', "hello"),
            (r'\bh+i+e*\b|\bh+i+\s+t+h+e+r+e+\b', "hi"),
            (r'\bh+e+y+\b|\bh+e+y+\s+t+h+e+r+e+\b', "hey")
        ]
        
    def detect(self, context: RequestContext) -> GreetingResult:
        """Analyzes input and returns mapped canonical greeting."""
        msg = context.normalized_message
        
        for pattern, canonical in self.mapping_rules:
            if re.search(pattern, msg):
                return GreetingResult(
                    is_greeting=True,
                    canonical_greeting=canonical
                )
                
        return GreetingResult(is_greeting=False)
