import asyncio
import time
from app.core.intent import classify
from app.handlers.fast.greeting import handle_greeting
from app.schemas.state import ConversationState

async def main():
    print("Testing handler...")
    start = time.time()
    res = await handle_greeting("hii", state=ConversationState(conversation_id="test"))
    print(f"Result: {res}, Time: {time.time() - start:.4f}s")

if __name__ == "__main__":
    asyncio.run(main())
