import re
from loguru import logger
from app.services.interfaces import BaseDetector
from app.models.schema import RequestContext, GibberishResult
from app.services.fast_path.dictionary import DictionaryService
from app.core.config import settings

class GibberishDetector(BaseDetector):
    """Detects random keyboard text, mashes, repetitive sequences, and non-sensical strings using heuristics."""
    
    def __init__(self):
        self.dictionary = DictionaryService()
        self.threshold = settings.GIBBERISH_THRESHOLD
        
    def detect(self, context: RequestContext) -> GibberishResult:
        """Analyzes input message using multiple heuristics and returns a structured result."""
        raw_msg = context.raw_message
        norm_msg = context.normalized_message
        
        reasons = []
        score = 0
        
        # Rule 8: Very Short Messages (Guardrail)
        valid_short_words = {"ok", "hi", "yo", "no", "yes", "hey"}
        if norm_msg in valid_short_words or (len(norm_msg) <= 3 and norm_msg.isalpha()):
            return GibberishResult(is_gibberish=False, score=0, reasons=["short_valid_word"])
            
        # If the user typed something, but the normalizer stripped it to empty (e.g. "!!!!!")
        if raw_msg and not norm_msg:
            score += 3
            reasons.append("empty_normalized")
            
        if norm_msg:
            looks_like_sentence = self._is_sentence_structure(norm_msg)
            
            # Dictionary check is now ratio-based and handles short vs long messages differently
            if self._check_dictionary(norm_msg):
                score += 1
                reasons.append("dictionary_failed")
                
            # Only apply keyboard-mash and character distribution heuristics
            # if the text doesn't look like a valid sentence structure.
            if not looks_like_sentence:
                if self._check_keyboard_mash(norm_msg):
                    score += 4
                    reasons.append("keyboard_mash")
                    
                if self._check_consecutive_consonants(norm_msg):
                    score += 3
                    reasons.append("consecutive_consonants")
                    
                if self._check_vowel_ratio(norm_msg):
                    score += 3
                    reasons.append("low_vowel_ratio")
                    
                if self._check_random_distribution(norm_msg):
                    score += 2
                    reasons.append("random_distribution")
                
        # Rules relying on raw_message
        if self._check_numbers_symbols(raw_msg):
            score += 4
            reasons.append("numbers_or_symbols")
            
        if self._check_repeated_characters(raw_msg):
            score += 4
            reasons.append("repeated_characters")
            
        is_gibberish = score >= self.threshold
        
        if settings.FAST_PATH_DEBUG:
            logger.info("--- Gibberish Debug ---")
            logger.info(f"Raw: {raw_msg}")
            logger.info(f"Normalized: {norm_msg}")
            logger.info(f"Dictionary Match: {'dictionary_failed' not in reasons}")
            logger.info(f"Keyboard Mash: {'keyboard_mash' in reasons}")
            logger.info(f"Vowel Ratio Low: {'low_vowel_ratio' in reasons}")
            logger.info(f"Consecutive Consonants: {'consecutive_consonants' in reasons}")
            logger.info(f"Final Score: {score}")
            logger.info(f"Classification: {'Gibberish' if is_gibberish else 'Not Gibberish'}")
            logger.info("-----------------------")
            
        return GibberishResult(
            is_gibberish=is_gibberish,
            score=score,
            reasons=reasons
        )

    def _is_sentence_structure(self, text: str) -> bool:
        """Helper to determine if text looks like a real sentence structure."""
        words = text.split()
        if len(words) >= 4:
            return True
            
        function_words = {"is", "the", "what", "how", "want", "to", "i", "of", "a", "can", "do", "you", "my"}
        overlap = set(words) & function_words
        if len(overlap) >= 2:
            return True
            
        return False

    def _check_dictionary(self, text: str) -> bool:
        """Rule 1: Fail if > 50% words are invalid AND it's a short message (< 5 words). Long messages are considered typos, not gibberish."""
        words = text.split()
        if len(words) >= 5:
            return False # Assume typos in long sentences, not complete gibberish
            
        invalid_count = 0
        total_checked = 0
        
        for word in words:
            if word.isalpha() and len(word) > 2:
                total_checked += 1
                if not self.dictionary.is_valid_word(word):
                    invalid_count += 1
                    
        if total_checked > 0:
            if (invalid_count / total_checked) > 0.5:
                return True
                
        return False
        
    def _check_keyboard_mash(self, text: str) -> bool:
        """Rule 2: Detect common keyboard sequences (4+ chars from the same row)."""
        rows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"]
        
        # Check forward and backward for each row
        for row in rows:
            for i in range(len(row) - 3):
                seq = row[i:i+4]
                if seq in text or seq[::-1] in text:
                    return True
                    
        # Also include some known disjoint mashes
        extra_mashes = ["qwepoiu", "wqfoijqer"]
        for mash in extra_mashes:
            if mash in text:
                return True
                
        return False
        
    def _check_consecutive_consonants(self, text: str) -> bool:
        """Rule 3: Very long consonant sequences (5+ consonants)."""
        return bool(re.search(r'[^aeiou\s\d]{5,}', text))
        
    def _check_vowel_ratio(self, text: str) -> bool:
        """Rule 4: Vowel ratio < 35% on words > 4 chars."""
        words = text.split()
        for word in words:
            if word.isalpha() and len(word) > 4:
                vowel_count = sum(1 for char in word if char in "aeiouy")
                if (vowel_count / len(word)) < 0.35:
                    return True
        return False
        
    def _check_random_distribution(self, text: str) -> bool:
        """Rule 5: If message is exactly one word > 5 chars and failed dictionary, it's highly suspect."""
        words = text.split()
        if len(words) == 1:
            word = words[0]
            if word.isalpha() and len(word) > 5:
                if not self.dictionary.is_valid_word(word):
                    return True
        return False
        
    def _check_numbers_symbols(self, raw_text: str) -> bool:
        """Rule 6: Check for pure numbers or pure symbols."""
        if re.match(r'^[^\w\s]{3,}$', raw_text):
            return True
        if re.match(r'^\d{4,}$', raw_text):
            return True
        return False
        
    def _check_repeated_characters(self, raw_text: str) -> bool:
        """Rule 7: Check for single character repeating 5+ times."""
        return bool(re.search(r'(.)\1{4,}', raw_text))
