import asyncio
from dotenv import load_dotenv
load_dotenv()

from app.core.orchestrator import process_message

async def test():
    print("Sending message...")
    res = await process_message("tell me about your company", conversation_id="test-conv")
    print("Result:", res)

if __name__ == "__main__":
    asyncio.run(test())
