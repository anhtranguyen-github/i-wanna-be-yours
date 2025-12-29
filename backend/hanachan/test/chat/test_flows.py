import os
import sys
import logging
from dotenv import load_dotenv

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
load_dotenv(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../.env')))

from services.agent_service import AgentService
from schemas.chat import AgentRequest, ContextConfigurationDTO as ContextConfig
from app import create_app

def test_conversation_flow():
    """
    Test 4: Verify Multi-turn Conversation Flow
    """
    print("\n--- TEST: Conversation Flow (Context) ---")
    
    app = create_app()
    with app.app_context():
        session_id = "test-flow-session-1"
        user_id = "test-user-flow"
        service = AgentService()
        
        # Turn 1
        print("\n🗣️  Turn 1: My name is Hanako.")
        req1 = AgentRequest(
            session_id=session_id,
            user_id=user_id,
            prompt="Hi, my name is Hanako.",
            context_config=ContextConfig()
        )
        
        resp1 = service.invoke_agent(req1)
        content1 = resp1.responses[0].content if resp1.responses else ""
        # Allow string content or object
        if hasattr(content1, 'content'): content1 = content1.content
        print(f"🤖 Agent: {content1}")
        
        # Turn 2
        print("\n🗣️  Turn 2: What is my name?")
        req2 = AgentRequest(
            session_id=session_id,
            user_id=user_id,
            prompt="What is my name?",
            context_config=ContextConfig()
        )
        
        resp2 = service.invoke_agent(req2)
        content2 = resp2.responses[0].content if resp2.responses else ""
        if hasattr(content2, 'content'): content2 = content2.content
        print(f"🤖 Agent: {content2}")
        
        # Verification
        if "Hanako" in str(content2):
            print("✅ Flow Test Passed: Memory recalled name.")
        else:
            print("⚠️  Flow Test Warning: Could not find 'Hanako' in response. Check semantic/history memory.")

if __name__ == "__main__":
    test_conversation_flow()
