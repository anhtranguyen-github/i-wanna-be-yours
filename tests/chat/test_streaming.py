import os
import sys
import logging
from dotenv import load_dotenv

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
load_dotenv(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../.env')))

from schemas.chat import AgentRequest, ContextConfigurationDTO as ContextConfig
from services.agent_service import AgentService
from app import create_app

def test_agent_streaming():
    """
    Test 3: Verify Streaming Response from AgentService
    """
    print("\n--- TEST: Agent Streaming ---")
    
    app = create_app()
    with app.app_context():
        # Setup dummy request
        req = AgentRequest(
            session_id="test-session-stream",
        user_id="test-user-stream",
        prompt="Tell me a very short joke.",
        context_config=ContextConfig(resource_ids=[])
    )
    
    service = AgentService()
    
    try:
        print("⚡ Starting stream...")
        chunk_count = 0
        full_text = ""
        
        # Invoke stream
        for chunk in service.stream_agent(req):
            # simulate frontend reading
            if chunk.startswith("__METADATA__"):
                print(f"   [Metadata]: {chunk.strip()}")
            else:
                chunk_count += 1
                full_text += chunk
                sys.stdout.write(".")
                sys.stdout.flush()
        
        print("\n")
        print(f"✅ Stream complete. Chunks: {chunk_count}")
        print(f"📥 Response: {full_text}")
        
        if len(full_text) > 0:
            print("✅ Streaming Test Passed")
        else:
            print("❌ No content received")

    except Exception as e:
        print(f"❌ Streaming Test Failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_agent_streaming()
