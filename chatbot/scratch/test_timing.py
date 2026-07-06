import asyncio
import time
from app.core.orchestrator import process_message

async def main():
    print("Testing process_message timing...")
    start = time.time()
    res = await process_message("hii")
    print(f"Time: {time.time() - start:.4f}s")
    print(f"Result: {res}")

if __name__ == "__main__":
    asyncio.run(main())
