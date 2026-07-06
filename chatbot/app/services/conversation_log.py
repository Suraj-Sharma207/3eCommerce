"""
Conversation logging service.

Stores conversation history in Redis for admin review and analytics.
User-specific data is NEVER stored in Qdrant — only in Redis with TTL.

Data structure in Redis:
  - chat:log:{conversation_id} → list of exchange entries (JSON)
  - chat:analytics:intents → hash of intent counts
  - chat:analytics:gemini_usage → integer counter
  - chat:analytics:total_messages → integer counter
  - chat:analytics:response_times → list of response times
  - chat:analytics:searched_products → sorted set of product queries
  - chat:analytics:unknown_questions → list of unrecognized queries
"""

import json
import redis.asyncio as redis
from datetime import datetime
from app.config import get_settings
from app.utils.logging import get_logger
from typing import Optional

logger = get_logger(__name__)

# Singleton Redis client
_redis: Optional[redis.Redis] = None
_redis_attempted: bool = False

# Max conversation log entries to keep
MAX_LOG_ENTRIES = 1000
# TTL for conversation logs (7 days)
LOG_TTL = 7 * 24 * 60 * 60


async def get_redis_client() -> Optional[redis.Redis]:
    """Returns a singleton async Redis client."""
    global _redis, _redis_attempted

    if _redis_attempted and _redis is None:
        return None

    if _redis is None:
        _redis_attempted = True
        settings = get_settings()
        try:
            _redis = redis.from_url(
                settings.redis_url,
                decode_responses=True,
                socket_connect_timeout=1.0,
                socket_timeout=1.0,
            )
            # Test connection
            await _redis.ping()
            logger.info("Connected to Redis for conversation logging")
        except Exception as e:
            logger.warning(f"Redis unavailable for logging: {e}")
            _redis = None

    return _redis


async def close_redis() -> None:
    """Close Redis connection. Called during shutdown."""
    global _redis
    if _redis:
        await _redis.aclose()
        _redis = None


async def check_redis_connection() -> bool:
    """Check if Redis is reachable."""
    try:
        client = await get_redis_client()
        if client:
            await client.ping()
            return True
    except Exception:
        pass
    return False


async def log_conversation(
    conversation_id: str,
    user_id: Optional[str],
    user_name: Optional[str],
    question: str,
    intent: str,
    response: str,
    gemini_used: bool,
    response_time_ms: int,
    sources: list[str],
) -> None:
    """
    Log a conversation exchange for admin review and analytics.
    Non-blocking — failures are logged but don't affect the chat.
    """
    client = await get_redis_client()
    if not client:
        return

    try:
        entry = {
            "id": f"{conversation_id}:{datetime.utcnow().timestamp()}",
            "conversation_id": conversation_id,
            "user_id": user_id or "anonymous",
            "user_name": user_name or "Anonymous",
            "question": question,
            "intent": intent,
            "response": response[:500],  # Truncate long responses
            "gemini_used": gemini_used,
            "response_time_ms": response_time_ms,
            "sources": sources,
            "timestamp": datetime.utcnow().isoformat(),
        }

        # Store conversation log
        pipe = client.pipeline()
        pipe.lpush("chat:logs", json.dumps(entry))
        pipe.ltrim("chat:logs", 0, MAX_LOG_ENTRIES - 1)

        # Update analytics counters
        pipe.hincrby("chat:analytics:intents", intent, 1)
        pipe.incr("chat:analytics:total_messages")

        if gemini_used:
            pipe.incr("chat:analytics:gemini_usage")

        # Track response times (keep last 500)
        pipe.lpush("chat:analytics:response_times", response_time_ms)
        pipe.ltrim("chat:analytics:response_times", 0, 499)

        # Track unknown questions
        if intent == "UNRELATED":
            pipe.lpush("chat:analytics:unknown_questions", question)
            pipe.ltrim("chat:analytics:unknown_questions", 0, 99)
            
        await pipe.execute()

    except Exception as e:
        logger.error(f"Failed to log conversation: {e}")


async def get_conversation_logs(
    limit: int = 50,
    offset: int = 0,
) -> list[dict]:
    """Fetch conversation logs for admin review."""
    client = await get_redis_client()
    if not client:
        return []

    try:
        entries = await client.lrange("chat:logs", offset, offset + limit - 1)
        return [json.loads(entry) for entry in entries]
    except Exception as e:
        logger.error(f"Failed to fetch conversation logs: {e}")
        return []


async def get_analytics() -> dict:
    """Compute analytics from Redis counters."""
    client = await get_redis_client()
    if not client:
        return {}

    try:
        # Total messages
        total = await client.get("chat:analytics:total_messages") or 0
        total = int(total)

        # Gemini usage
        gemini_count = await client.get("chat:analytics:gemini_usage") or 0
        gemini_count = int(gemini_count)

        # Intent distribution
        intents = await client.hgetall("chat:analytics:intents") or {}
        intents = {k: int(v) for k, v in intents.items()}

        # Average response time
        times = await client.lrange("chat:analytics:response_times", 0, -1)
        times = [int(t) for t in times] if times else []
        avg_time = sum(times) / len(times) if times else 0

        # Unknown questions
        unknown = await client.lrange("chat:analytics:unknown_questions", 0, 19)

        return {
            "total_conversations": total,
            "total_messages": total,
            "avg_response_time_ms": round(avg_time, 2),
            "gemini_usage_count": gemini_count,
            "gemini_usage_percentage": round(
                (gemini_count / total * 100) if total > 0 else 0, 2
            ),
            "cache_hit_rate": round(
                ((total - gemini_count) / total * 100) if total > 0 else 0, 2
            ),
            "top_intents": intents,
            "unknown_questions": unknown or [],
        }
    except Exception as e:
        logger.error(f"Failed to compute analytics: {e}")
        return {}
