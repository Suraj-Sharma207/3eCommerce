import re

class MessageNormalizer:
    """Centralized service for normalizing chat messages."""
    
    @staticmethod
    def normalize(message: str) -> str:
        """
        Normalizes a raw message by:
        1. Converting to lowercase.
        2. Removing punctuation (keeping only alphanumerics and spaces).
        3. Collapsing multiple spaces.
        4. Trimming leading/trailing spaces.
        5. Normalizing repeated letters (reducing 3+ repeats to 2).
        """
        if not message:
            return ""
            
        # 1. Lowercase
        normalized = message.lower()
        
        # 2. Remove punctuation that does not affect meaning
        # Keep alphanumeric characters and whitespace
        normalized = re.sub(r'[^\w\s]', '', normalized)
        
        # 3 & 4. Collapse multiple spaces and trim
        normalized = re.sub(r'\s+', ' ', normalized).strip()
        
        # 5. Normalize repeated characters: cap repeats to 2 (only for letters)
        # Example: "helloooo" -> "helloo"
        normalized = re.sub(r'([a-zA-Z])\1{2,}', r'\1\1', normalized)
        
        return normalized
