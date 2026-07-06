"""
Redis-backed conversation memory.

Stores conversation history per session using Redis.
Uses a simple list structure (not LangChain memory classes)
so it can be easily migrated to LangGraph state later.

Key pattern: chat:memory:{conversation_id}
TTL: configurable (default 30 minutes)
Window: configurable (default last 10 messages)
"""

import json
import redis.asyncio as redis
from app.config import get_settings
from app.utils.logging import get_logger
from typing import Optional
import time
from app.schemas.state import ConversationState

logger = get_logger(__name__)

# Reuses the Redis client from conversation_log
_redis: Optional[redis.Redis] = None
_redis_attempted: bool = False
_redis_attempted: bool = False
_local_memory: dict[str, list[dict]] = {}
_local_state: dict[str, ConversationState] = {}


async def _get_redis() -> Optional[redis.Redis]:
    """Get or create the Redis connection."""
    global _redis, _redis_attempted

    if _redis_attempted and _redis is None:
        # print("Redis already attempted and failed.")
        return None

    if _redis is None:
        print("Attempting to connect to Redis...")
        _redis_attempted = True
        settings = get_settings()
        try:
            _redis = redis.from_url(
                settings.redis_url,
                decode_responses=True,
                socket_connect_timeout=1.0,
                socket_timeout=1.0,
            )
            await _redis.ping()
        except Exception as e:
            logger.warning(f"Redis unavailable for memory: {e}")
            _redis = None

    return _redis


async def close_memory_redis() -> None:
    """Close Redis connection. Called during shutdown."""
    global _redis
    if _redis:
        await _redis.aclose()
        _redis = None


async def get_conversation_history(conversation_id: str) -> list[dict]:
    """
    Retrieve conversation history for a session.
    Returns list of {role, content} messages (newest last).
    """
    client = await _get_redis()
    settings = get_settings()
    window = settings.conversation_history_length

    if not client:
        # Fallback to local memory
        messages = _local_memory.get(conversation_id, [])
        return messages[-window:]

    key = f"chat:memory:{conversation_id}"

    try:
        entries = await client.lrange(key, 0, -1)
        messages = [json.loads(entry) for entry in entries]
        return messages[-window:]
    except Exception as e:
        logger.error(f"Failed to load memory for {conversation_id}: {e}")
        return []


async def save_message(
    conversation_id: str,
    role: str,
    content: str,
) -> None:
    """
    Save a message to conversation history.
    Role is either 'user' or 'assistant'.
    """
    client = await _get_redis()
    settings = get_settings()
    max_entries = settings.conversation_history_length * 2

    if not client:
        # Fallback to local memory
        if conversation_id not in _local_memory:
            _local_memory[conversation_id] = []
        _local_memory[conversation_id].append({"role": role, "content": content})
        _local_memory[conversation_id] = _local_memory[conversation_id][-max_entries:]
        return

    key = f"chat:memory:{conversation_id}"

    try:
        entry = json.dumps({"role": role, "content": content})
        pipe = client.pipeline()
        pipe.rpush(key, entry)
        pipe.ltrim(key, -max_entries, -1)
        pipe.expire(key, settings.conversation_memory_ttl)
        await pipe.execute()
    except Exception as e:
        logger.error(f"Failed to save message for {conversation_id}: {e}")

async def get_conversation_state(conversation_id: str) -> ConversationState:
    """Load ConversationState from Redis or local memory. Resets if inactive for >30m."""
    client = await _get_redis()
    now = time.time()
    
    if not client:
        state = _local_state.get(conversation_id)
        if state:
            if now - state.last_activity > 1800:
                _local_memory.pop(conversation_id, None)
                state = ConversationState(conversation_id=conversation_id, last_activity=now)
            else:
                state.last_activity = now
            _local_state[conversation_id] = state
            return state
        new_state = ConversationState(conversation_id=conversation_id, last_activity=now)
        _local_state[conversation_id] = new_state
        return new_state

    key = f"chat:state:{conversation_id}"
    try:
        data = await client.get(key)
        if data:
            state_dict = json.loads(data)
            state = ConversationState(**state_dict)
            if now - state.last_activity > 1800:
                # Expired session, start fresh
                logger.debug(f"Session Expired (last activity > 30m ago) for {conversation_id}")
                await clear_conversation(conversation_id)
                state = ConversationState(conversation_id=conversation_id, last_activity=now)
            else:
                state.last_activity = now
                logger.debug(f"Conversation Loaded from Redis for {conversation_id}")
            return state
    except Exception as e:
        logger.error(f"Failed to get state for {conversation_id}: {e}")
        
    return ConversationState(conversation_id=conversation_id, last_activity=now)


async def save_conversation_state(state: ConversationState) -> None:
    """Save ConversationState to Redis."""
    client = await _get_redis()
    settings = get_settings()
    
    state.last_activity = time.time()
    
    if not client:
        _local_state[state.conversation_id] = state
        return
        
    key = f"chat:state:{state.conversation_id}"
    try:
        pipe = client.pipeline()
        pipe.set(key, state.model_dump_json())
        pipe.expire(key, settings.conversation_memory_ttl)
        await pipe.execute()
        logger.debug(f"Conversation Saved to Redis for {state.conversation_id}")
    except Exception as e:
        logger.error(f"Failed to save state for {state.conversation_id}: {e}")


async def clear_conversation(conversation_id: str) -> None:
    """Clear conversation history for a session."""
    client = await _get_redis()
    if not client:
        _local_memory.pop(conversation_id, None)
        _local_state.pop(conversation_id, None)
        return

    try:
        await client.delete(f"chat:memory:{conversation_id}")
        await client.delete(f"chat:state:{conversation_id}")
    except Exception as e:
        logger.error(f"Failed to clear memory for {conversation_id}: {e}")


def format_history(messages: list[dict]) -> str:
    """
    Format conversation history into a string for prompt injection.
    Returns a human-readable conversation transcript.
    """
    if not messages:
        return "No previous conversation."

    lines = []
    for msg in messages:
        role = "Customer" if msg["role"] == "user" else "Assistant"
        lines.append(f"{role}: {msg['content']}")

    return "\n".join(lines)
