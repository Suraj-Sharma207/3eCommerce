import asyncio
import time
import redis.asyncio as redis
from app.config import get_settings

async def main():
    settings = get_settings()
    url = settings.redis_url
    print(f"Connecting to {url}")
    r = redis.from_url(url, decode_responses=True)
    start = time.time()
    await r.ping()
    print(f"Ping took {time.time() - start:.4f}s")
    
    start = time.time()
    await r.set("test", "test")
    print(f"Set took {time.time() - start:.4f}s")
    
    start = time.time()
    await r.get("test")
    print(f"Get took {time.time() - start:.4f}s")

if __name__ == "__main__":
    asyncio.run(main())
