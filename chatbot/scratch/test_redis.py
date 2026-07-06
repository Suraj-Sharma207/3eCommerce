import asyncio
import redis.asyncio as redis
from app.config import get_settings

async def main():
    settings = get_settings()
    url = settings.redis_url.replace("rediss://", "redis://")
    print(f"Connecting to {url}")
    try:
        r = redis.from_url(url, decode_responses=True)
        await r.ping()
        print("Connected successfully!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
