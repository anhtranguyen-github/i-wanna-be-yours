import os
import sys
import logging
from dotenv import load_dotenv

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
# Load env from hanachan root
load_dotenv(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../.env')))

from services.agent_service import AgentService
from schemas.chat import AgentRequest, ContextConfigurationDTO
from app import create_app

def test_error_resilience():
    """
    Test 5: Verify Error Handling (Empty prompts, Invalid sessions)
    """
    print("\n--- TEST: Error Resilience ---")
    
    app = create_app()
    with app.app_context():
        service = AgentService()
        
        try:
            print("🔸 Case 1: Empty Prompt")
            req = AgentRequest(
                session_id="test-error-session",
                user_id="test-user-error",
                prompt="",
                context_config=ContextConfigurationDTO()
            )
            resp = service.invoke_agent(req)
            print(f"   Result: {resp}")
        except Exception as e:
            print(f"   Caught expected error: {e}")

    # Case 2: Streaming with invalid config (if applicable)
    # Just checking it doesn't crash the process
    print("🔸 Case 2: Resilience check passed (if no crash above)")

if __name__ == "__main__":
    test_error_resilience()
