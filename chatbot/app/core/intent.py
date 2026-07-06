"""
Intent classifier — two-tier classification system.

Tier 1 (Rule-based): Fast keyword matching for common patterns.
         → Zero Gemini tokens used.
         
Tier 2 (LLM-based): Gemini classification for ambiguous queries.
         → Only used when rule-based fails.

This design minimizes token usage while maintaining accuracy.
Each intent maps to a specific handler in the handlers/ package.
"""

import re
from app.services.llm import classify_intent as llm_classify
from app.utils.prompts import INTENT_CLASSIFICATION_PROMPT
from app.utils.logging import get_logger
from app.schemas.state import ConversationState, ShoppingStage

logger = get_logger(__name__)


# ── Keyword Patterns ──────────────────────────────────────────────────────────
# Each pattern maps to an intent. First match wins.
# Patterns are checked case-insensitively.

GREETING_PATTERNS = [
    r"^(hi+|hello+|hey+|howdy+|hola+|greetings|good\s*(morning|afternoon|evening|day)|what'?s\s*up|yo+)[\s!?.]*$",
    r"^(hi+|hello+|hey+)\s+(there|buddy|friend)[\s!?.]*$",
]

CLOSING_PATTERNS = [
    r"^(thanks+|thank\s+you|thx|tysm|ty)[\s!?.]*$",
    r"^(bye+|goodbye|see\s+ya|cya|catch\s+you\s+later)[\s!?.]*$",
]

PRODUCT_SEARCH_PATTERNS = [
    r"(show|find|search|looking\s+for|do\s+you\s+have|any|browse|want|need)\s+.*(product|item|chair|table|sofa|desk|bed|lamp|shelf|cabinet|furniture|couch)",
    r"(product|item|chair|table|sofa|desk|bed|lamp|shelf|cabinet|furniture|couch)s?\s+(under|below|above|around|for|in)",
    r"(what|which)\s+.*(product|item|chair|table|sofa|desk|bed|lamp|shelf|cabinet|furniture)s?\s+",
    r"(cheap|affordable|expensive|luxury|budget|premium)\s+.*(product|item|furniture)",
    r"(show|list|display)\s+(me\s+)?(all|some|your)\s+",
]

RECOMMENDATION_PATTERNS = [
    r"(recommend|suggest|suggestion|what\s+should|what\s+do\s+you\s+(recommend|suggest))",
    r"(best|top|popular|trending)\s+(product|item|furniture|pick|choice|seller)",
    r"(help\s+me\s+(choose|pick|decide|find))",
    r"(what('?s|\s+is)\s+(good|great|nice|best)\s+for)",
    r"(i\s+need\s+help\s+(choosing|picking|deciding))",
]

ORDER_PATTERNS = [
    r"(order|orders|delivery|deliver|track|tracking|shipment|shipped|shipping\s+status)",
    r"(where\s+is\s+my\s+(order|package|delivery))",
    r"(when\s+will\s+(my|the)\s+(order|package)\s+(arrive|come|be\s+delivered))",
    r"(order\s*(status|history|detail))",
    r"(my\s+recent\s+order)",
]

CART_WISHLIST_PATTERNS = [
    r"(cart|shopping\s+cart|basket|bag)",
    r"(wishlist|wish\s+list|saved\s+items|favorites|favourite)",
    r"(what('?s|\s+is)\s+in\s+my\s+(cart|wishlist|bag))",
    r"(how\s+many\s+items?\s+in\s+my\s+(cart|bag))",
]

POLICY_FAQ_PATTERNS = [
    r"(shipping|return|refund|exchange|warranty|guarantee|policy|policies)",
    r"(how\s+(do|can|to)\s+(i\s+)?(return|exchange|refund))",
    r"(free\s+shipping|delivery\s+(time|cost|fee|charge))",
    r"(payment\s+(method|option|way))",
    r"(do\s+you\s+(accept|take|offer)\s+)",
    r"(how\s+long\s+(does|will)\s+(shipping|delivery)\s+take)",
    r"(cancel|cancellation)",
    r"(faq|frequently\s+asked|question)",
    r"(store\s+(hours?|location|address|contact))",
    r"(customer\s+(service|support|care))",
]

# ── Fallback specific patterns ──────────────────────────────────────────────
ABUSIVE_PATTERNS = [
    r"(fuck|shit|bitch|idiot|stupid\s+bot|dumb|asshole|cunt)"
]

FRUSTRATION_PATTERNS = [
    r"(useless|nothing\s+works|angry|frustrated|hate\s+this|terrible|bad\s+experience|annoying)"
]

GENERAL_KNOWLEDGE_PATTERNS = [
    r"(weather|news|sports|politics|recipe|cook|movie|music|game)",
    r"(who\s+is|capital\s+of|population\s+of|explain|how\s+to\s+(build|make|code))",
    r"(write\s+(me\s+)?(a|an)\s+(poem|essay|story|code|script))",
    r"(tell\s+me\s+a\s+joke|meaning\s+of\s+life)",
]

import emoji
def _is_emoji_only(text: str) -> bool:
    """Check if the text contains only emojis and whitespace."""
    stripped = text.replace(" ", "")
    if not stripped:
        return False
    # Check if every character is an emoji
    return all(char in emoji.EMOJI_DATA for char in stripped)

def _is_spam_or_gibberish(text: str) -> str:
    """Return 'SPAM' or 'GIBBERISH' or None"""
    stripped = text.strip()
    # Repeated characters (e.g., aaaaaa, 111111)
    if re.match(r"^(.)\1{4,}$", stripped):
        return "SPAM"
    # Random consonant clusters or keyboard smashes
    if re.match(r"^([a-zA-Z0-9])\1*$", stripped) and len(stripped) > 5:
         return "GIBBERISH"
    if re.match(r"^(asdf|qwer|zxcv|sakj)", stripped, re.IGNORECASE):
        return "GIBBERISH"
    return None


def _match_patterns(text: str, patterns: list[str]) -> bool:
    """Check if text matches any of the given regex patterns."""
    for pattern in patterns:
        if re.search(pattern, text, re.IGNORECASE):
            return True
    return False


async def classify(message: str, state: ConversationState = None) -> tuple[str, bool]:
    """
    Classify the intent of a user message.
    
    Returns:
        (intent: str, gemini_used: bool)
        
    Intent is one of:
        GREETING, PRODUCT_SEARCH, PRODUCT_RECOMMENDATION,
        ORDER_STATUS, CART_WISHLIST, POLICY_FAQ, GENERAL, UNRELATED
    """
    text = message.strip()
    
    # Empty message check (handled by orchestrator but just in case)
    if not text:
        return "EMPTY", False

    # Check Emoji only
    if _is_emoji_only(text):
        return "EMOJI", False
        
    spam_check = _is_spam_or_gibberish(text)
    if spam_check:
        return spam_check, False

    # ── Tier 0: State-based bias ──────────────────────────────────────────
    if state and state.shopping_stage in [ShoppingStage.COLLECTING_PREFERENCES, ShoppingStage.SEARCHING]:
        # If user is in the middle of a search flow, short messages are likely preference updates
        if len(text.split()) < 5:
            logger.info(f"Intent: PRODUCT_SEARCH (state-biased)")
            return "PRODUCT_SEARCH", False

    # ── Tier 1: Rule-based (zero tokens) ──────────────────────────────────
    
    if _match_patterns(text, GREETING_PATTERNS):
        logger.info(f"Intent: GREETING (rule-based)")
        return "GREETING", False

    if _match_patterns(text, CLOSING_PATTERNS):
        logger.info(f"Intent: CLOSING (rule-based)")
        return "CLOSING", False

    if _match_patterns(text, ABUSIVE_PATTERNS):
        return "ABUSIVE", False
        
    if _match_patterns(text, FRUSTRATION_PATTERNS):
        return "FRUSTRATION", False

    if _match_patterns(text, GENERAL_KNOWLEDGE_PATTERNS):
        return "GENERAL_KNOWLEDGE", False

    if _match_patterns(text, ORDER_PATTERNS):
        logger.info(f"Intent: ORDER_STATUS (rule-based)")
        return "ORDER_STATUS", False

    if _match_patterns(text, CART_WISHLIST_PATTERNS):
        logger.info(f"Intent: CART_WISHLIST (rule-based)")
        return "CART_WISHLIST", False

    if _match_patterns(text, POLICY_FAQ_PATTERNS):
        logger.info(f"Intent: POLICY_FAQ (rule-based)")
        return "POLICY_FAQ", False

    if _match_patterns(text, RECOMMENDATION_PATTERNS):
        logger.info(f"Intent: PRODUCT_RECOMMENDATION (rule-based)")
        return "PRODUCT_RECOMMENDATION", False

    if _match_patterns(text, PRODUCT_SEARCH_PATTERNS):
        logger.info(f"Intent: PRODUCT_SEARCH (rule-based)")
        return "PRODUCT_SEARCH", False

    # ── Tier 2: LLM-based (uses tokens) ──────────────────────────────────
    logger.info(f"Rule-based classification failed, using LLM for: '{text[:50]}...'")
    intent = await llm_classify(text, INTENT_CLASSIFICATION_PROMPT)
    logger.info(f"Intent: {intent} (LLM-based)")
    return intent, True
