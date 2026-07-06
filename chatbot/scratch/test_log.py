import asyncio
import time
from app.services.conversation_log import log_conversation

async def main():
    start = time.time()
    await log_conversation("test", "user", "name", "q", "intent", "resp", False, 1, [])
    print(f"Time: {time.time() - start:.4f}s")

if __name__ == "__main__":
    asyncio.run(main())
