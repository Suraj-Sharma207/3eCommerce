import unittest
from app.detectors.fast_detector import FastIntentDetector
from app.schemas.state import ConversationState, ShoppingStage


class TestFastIntentDetector(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.detector = FastIntentDetector()

    async def test_empty_message(self):
        intent, gemini_used = await self.detector("")
        self.assertEqual(intent, "EMPTY")
        self.assertFalse(gemini_used)

        intent, gemini_used = await self.detector("   ")
        self.assertEqual(intent, "EMPTY")
        self.assertFalse(gemini_used)

    async def test_emoji_only(self):
        intent, gemini_used = await self.detector("👋😊")
        self.assertEqual(intent, "EMOJI")
        self.assertFalse(gemini_used)

        intent, gemini_used = await self.detector("👍")
        self.assertEqual(intent, "EMOJI")
        self.assertFalse(gemini_used)

        # Mix of emoji and text should not trigger EMOJI intent
        intent, gemini_used = await self.detector("hello 👋")
        self.assertNotEqual(intent, "EMOJI")

    async def test_spam_and_gibberish(self):
        intent, gemini_used = await self.detector("aaaaaa")
        self.assertEqual(intent, "SPAM")
        self.assertFalse(gemini_used)

        intent, gemini_used = await self.detector("asdfasdf")
        self.assertEqual(intent, "GIBBERISH")
        self.assertFalse(gemini_used)

    async def test_greetings(self):
        greetings = ["hi", "hello", "hey", "good morning", "whats up", "hello there"]
        for g in greetings:
            intent, gemini_used = await self.detector(g)
            self.assertEqual(intent, "GREETING", f"Failed for greeting: {g}")
            self.assertFalse(gemini_used)

    async def test_closings(self):
        closings = ["thanks", "thank you", "bye", "goodbye", "cya"]
        for c in closings:
            intent, gemini_used = await self.detector(c)
            self.assertEqual(intent, "CLOSING", f"Failed for closing: {c}")
            self.assertFalse(gemini_used)

    async def test_product_search(self):
        searches = [
            "show me products",
            "find a chair",
            "looking for a table",
            "do you have a bed",
            "furniture under 5000",
        ]
        for s in searches:
            intent, gemini_used = await self.detector(s)
            self.assertEqual(intent, "PRODUCT_SEARCH", f"Failed for search: {s}")
            self.assertFalse(gemini_used)

    async def test_recommendations(self):
        recommendations = [
            "recommend a sofa",
            "popular item",
            "help me choose",
            "what's good for a bedroom",
        ]
        for r in recommendations:
            intent, gemini_used = await self.detector(r)
            self.assertEqual(intent, "PRODUCT_RECOMMENDATION", f"Failed for recommendation: {r}")
            self.assertFalse(gemini_used)

    async def test_order_status(self):
        orders = [
            "where is my order",
            "track shipping status",
            "when will my package arrive",
            "order history",
            "how long does delivery take",  # originally matches ORDER_STATUS because of "delivery"
        ]
        for o in orders:
            intent, gemini_used = await self.detector(o)
            self.assertEqual(intent, "ORDER_STATUS", f"Failed for order: {o}")
            self.assertFalse(gemini_used)

    async def test_cart_wishlist(self):
        cart_items = [
            "shopping cart",
            "view wishlist",
            "what's in my bag",
            "how many items in my cart",
        ]
        for c in cart_items:
            intent, gemini_used = await self.detector(c)
            self.assertEqual(intent, "CART_WISHLIST", f"Failed for cart: {c}")
            self.assertFalse(gemini_used)

    async def test_policy_faq(self):
        policies = [
            "return policy",
            "free shipping cost",
            "payment methods",
            "how long does shipping take",
            "store hours",
        ]
        for p in policies:
            intent, gemini_used = await self.detector(p)
            self.assertEqual(intent, "POLICY_FAQ", f"Failed for policy: {p}")
            self.assertFalse(gemini_used)

    async def test_abusive_frustration_general(self):
        self.assertEqual((await self.detector("you idiot bot"))[0], "ABUSIVE")
        self.assertEqual((await self.detector("this is useless"))[0], "FRUSTRATION")
        self.assertEqual((await self.detector("what is the weather today"))[0], "GENERAL_KNOWLEDGE")

    async def test_state_biased_search(self):
        state = ConversationState(
            conversation_id="test",
            shopping_stage=ShoppingStage.COLLECTING_PREFERENCES
        )
        # Short message under 5 words in search stage should bias to PRODUCT_SEARCH
        intent, gemini_used = await self.detector("wooden red", state)
        self.assertEqual(intent, "PRODUCT_SEARCH")
        self.assertFalse(gemini_used)

        # Longer message in search stage shouldn't get biased blindly if it matches nothing
        intent, gemini_used = await self.detector("this is a very long message that does not match anything", state)
        self.assertIsNone(intent)
        self.assertFalse(gemini_used)

    async def test_fallback_none(self):
        # A complex query that has no regex matches should return None
        intent, gemini_used = await self.detector("I want to buy a present for my mother's birthday")
        self.assertIsNone(intent)
        self.assertFalse(gemini_used)


if __name__ == "__main__":
    unittest.main()
