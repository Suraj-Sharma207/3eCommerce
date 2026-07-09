import asyncio
import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage

KEYS = [
    "REDACTED",
]

async def test_key(key):
    print(f"Testing key: {key[:15]}...")
    try:
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=key,
            temperature=0.3,
            max_output_tokens=100,
        )
        # Disable retries for fast test
        llm.max_retries = 0
        response = await llm.ainvoke([HumanMessage(content="hi")])
        print(f"-> SUCCESS! Response: {response.content}")
        return True
    except Exception as e:
        print(f"-> FAILED: {e}")
        return False

async def main():
    for key in KEYS:
        success = await test_key(key)
        if success:
            print("Found working key!")
            break

if __name__ == "__main__":
    asyncio.run(main())
