"""
LLM Service — Gemini via LangChain.

This is the ONLY module that calls the LLM. All handlers route
through here, making it easy to swap providers or add LangGraph later.

Token optimization: Gemini is only used for:
  1. Product recommendations (reasoning required)
  2. Ambiguous intent classification
  3. Complex multi-turn conversations
"""

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
from app.config import get_settings
from app.utils.logging import get_logger
from typing import Optional

logger = get_logger(__name__)

# Singleton LLM instance
_llm = None


def get_llm() -> ChatGoogleGenerativeAI:
    """Returns a singleton Gemini LLM instance."""
    global _llm

    if _llm is None:
        settings = get_settings()
        _llm = ChatGoogleGenerativeAI(
            model=settings.gemini_model,
            google_api_key=settings.gemini_api_key,
            temperature=0.3,  # Low temperature for consistent shopping responses
            max_output_tokens=1024,
        )
        logger.info(f"Initialized LLM: {settings.gemini_model}")

    return _llm


async def generate_response(
    system_prompt: str,
    user_message: str,
    context: str = "",
    history: str = "",
) -> str:
    """
    Generate a response using Gemini.
    
    This is the single entry point for all LLM calls.
    Tracks usage for analytics.
    """
    llm = get_llm()

    # Build the system message with context
    full_system = system_prompt.format(
        context=context or "No additional context.",
        history=history or "No previous conversation.",
    )

    messages = [
        SystemMessage(content=full_system),
        HumanMessage(content=user_message),
    ]

    try:
        response = await llm.ainvoke(messages)
        return response.content.strip()
    except Exception as e:
        logger.error(f"LLM generation failed: {e}")
        return "I'm having trouble processing your request right now. Please try again in a moment."


async def classify_intent(message: str, prompt_template: str) -> str:
    """
    Use the LLM to classify an ambiguous message intent.
    Only called when rule-based classification fails.
    """
    llm = get_llm()

    prompt = prompt_template.format(message=message)
    messages = [HumanMessage(content=prompt)]

    try:
        response = await llm.ainvoke(messages)
        intent = response.content.strip().upper()
        # Validate against known intents
        valid_intents = {
            "GREETING", "PRODUCT_SEARCH", "PRODUCT_RECOMMENDATION",
            "ORDER_STATUS", "CART_WISHLIST", "POLICY_FAQ",
            "GENERAL", "UNRELATED",
        }
        return intent if intent in valid_intents else "GENERAL"
    except Exception as e:
        logger.error(f"Intent classification failed: {e}")
        return "GENERAL"
