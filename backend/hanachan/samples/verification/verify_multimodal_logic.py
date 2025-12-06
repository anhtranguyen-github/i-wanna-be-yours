import asyncio
from graph.graph import MasGraph, AgentState
from agents.factory import AgentFactory
from config_loader import ConfigLoader
from langchain_core.messages import AIMessage

# Mock AgentFactory to avoid real LLM calls during logic test
class MockAgentFactory:
    async def create_agent(self, agent_name):
        # Return a mock LLM that just echoes the agent name
        class MockLLM:
            async def ainvoke(self, messages):
                return AIMessage(content=f"Mock response from {agent_name}")
            def bind_tools(self, tools):
                return self
        return MockLLM(), [], "Mock System Prompt"

async def test_routing():
    print("🚀 Starting Multimodal Logic Verification...")
    
    # Setup
    mock_factory = MockAgentFactory()
    graph = MasGraph(mock_factory)
    
    # Test Case 1: Text only (should go to Kaiwa)
    print("\nTest Case 1: Text Only")
    state_text = {
        "messages": [],
        "user_input": "Hello",
        "image_data": None,
        "conversation_id": "test_1"
    }
    # We can't easily step through compiled graph without running it, 
    # but we can check the first step output if we stream it or just run it.
    # Let's run it and check the logs/output.
    
    async for output in graph.app.astream(state_text):
        for key, value in output.items():
            print(f"  Step: {key}")
            if key == "kaiwa":
                print("  ✅ Correctly routed to Kaiwa")

    # Test Case 2: Image + Handwriting keyword
    print("\nTest Case 2: Image + Handwriting")
    state_hw = {
        "messages": [],
        "user_input": "Read this handwriting",
        "image_data": "base64_mock_data",
        "conversation_id": "test_2"
    }
    
    async for output in graph.app.astream(state_hw):
        for key, value in output.items():
            print(f"  Step: {key}")
            if key == "handwriting":
                print("  ✅ Correctly routed to Handwriting Agent")

    # Test Case 3: Image + OCR default
    print("\nTest Case 3: Image + OCR (Default)")
    state_ocr = {
        "messages": [],
        "user_input": "What does this document say?",
        "image_data": "base64_mock_data",
        "conversation_id": "test_3"
    }
    
    async for output in graph.app.astream(state_ocr):
        for key, value in output.items():
            print(f"  Step: {key}")
            if key == "ocr":
                print("  ✅ Correctly routed to OCR Agent")

if __name__ == "__main__":
    asyncio.run(test_routing())
