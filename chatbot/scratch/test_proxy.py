import asyncio
import httpx

async def test():
    async with httpx.AsyncClient(timeout=30.0) as client:
        print("Sending POST request to Express backend /api/chatbot/chat...")
        headers = {
            "Origin": "http://localhost:5173",
            "Referer": "http://localhost:5173/",
            "Content-Type": "application/json"
        }
        try:
            response = await client.post(
                "http://localhost:5000/api/chatbot/chat",
                json={"message": "tell me about your company"},
                headers=headers
            )
            print("Status:", response.status_code)
            print("Response:", response.text)
        except Exception as e:
            print("Error occurred:", e)

if __name__ == "__main__":
    asyncio.run(test())
