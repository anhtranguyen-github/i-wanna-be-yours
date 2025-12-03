import asyncio
import logging
from chat_service import chat_service

# Configure logging
logging.basicConfig(level=logging.INFO)

async def verify():
    print("Verifying ChatService with New Agents...")
    try:
        # Test 1: Check if agents can be created
        print("1. Creating agent 'kaiwa_coach'...")
        llm, tools, prompt = await chat_service.agent_factory.create_agent("kaiwa_coach")
        print(f"   Success! Loaded {len(tools)} tools.")
        
        # Test 2: Run a simple chat flow
        print("2. Testing MAS Graph flow...")
        user_input = "Hello, I want ramen."
        print(f"   Input: {user_input}")
        
        async for chunk in chat_service.stream_answer(user_input, show_thinking=True):
            print(f"   Chunk: {chunk}", end="")
        print("\n   Success! Stream completed.")
        
    except Exception as e:
        print(f"❌ Verification Failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(verify())
