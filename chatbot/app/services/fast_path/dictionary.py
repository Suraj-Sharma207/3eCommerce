class DictionaryService:
    """Provides vocabulary lookup for the Fast Path pipeline."""
    
    # A basic set of common English words + conversational/e-commerce words.
    COMMON_WORDS = {
        # E-commerce / Domain
        "order", "status", "product", "pricing", "price", "cost", "catalog",
        "invoice", "payment", "checkout", "cart", "wishlist", "shipping",
        "delivery", "track", "tracking", "refund", "return", "exchange",
        "cancel", "support", "help", "contact", "email", "phone", "profile",
        "login", "register", "password", "otp", "customer", "admin", "dashboard",
        "analytics", "sales", "lead", "crm", "campaign", "workspace", "account",
        "settings", "notification",
        
        # Conversational / Greetings
        "hi", "hello", "hey", "yo", "morning", "evening", "afternoon", "night",
        "good", "bye", "goodbye", "thanks", "thank", "you", "please", "ok", 
        "okay", "yes", "no", "yeah", "nope", "yep", "sure", "sorry",
        
        # Questions / W-words
        "what", "where", "when", "why", "how", "who", "which", "is", "are", 
        "am", "do", "does", "did", "can", "could", "would", "should", "will",
        
        # Common Verbs
        "have", "has", "had", "get", "got", "make", "made", "know", "knew",
        "think", "thought", "take", "took", "see", "saw", "look", "want",
        "give", "gave", "use", "find", "found", "tell", "told", "ask", "work",
        "feel", "try", "leave", "call", "need", "show",
        
        # Common Nouns
        "time", "person", "year", "way", "day", "thing", "man", "world", "life",
        "hand", "part", "child", "eye", "woman", "place", "work", "week", "case",
        "point", "government", "company", "number", "group", "problem", "fact",
        
        # Pronouns, Prepositions, Conjunctions, Articles
        "the", "be", "to", "of", "and", "a", "in", "that", "have", "i", "it", 
        "for", "not", "on", "with", "he", "as", "you", "do", "at", "this", 
        "but", "his", "by", "from", "they", "we", "say", "her", "she", "or", 
        "an", "will", "my", "one", "all", "would", "there", "their", "what", 
        "so", "up", "out", "if", "about", "who", "get", "which", "go", "me",
        
        # Adjectives
        "good", "new", "first", "last", "long", "great", "little", "own",
        "other", "old", "right", "big", "high", "different", "small", "large",
        "next", "early", "young", "important", "few", "public", "bad", "same",
        "able",
        
        # Miscellaneous
        "like", "just", "some", "now", "also", "very", "much", "too", "even",
        "only", "well", "more", "then", "than", "here", "there", "any", "such",
        "because", "while", "though", "although", "once", "always", "never",
        "sometimes", "often", "usually"
    }

    @classmethod
    def is_valid_word(cls, word: str) -> bool:
        """Returns True if the word is found in the dictionary, handling simple plurals."""
        word = word.lower()
        if word in cls.COMMON_WORDS:
            return True
            
        # Support simple plural 's'
        if word.endswith('s') and word[:-1] in cls.COMMON_WORDS:
            return True
            
        return False
