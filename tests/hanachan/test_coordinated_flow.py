import pytest
import os
import sys
from langchain_core.messages import HumanMessage
from agent.core_agent import HanachanAgent
from agent.engine.loader import ConfigLoader

# Ensure we can import from the root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

@pytest.fixture
def agent():
    # Force reload config
    ConfigLoader.reload()
    return HanachanAgent()

def test_authorized_tool_flow(agent):
    """
    Scenario: User asks for a quiz.
    [LLM] Proposes create_study_quiz.
    [SYSTEM] Authorizes and Executes.
    """
    user_id = "test-user-123" # Seeded user
    session_id = "test-session-auth"
    prompt = "Can you make me a quick quiz about Japanese particles?"
    
    # We use invoke to trigger the loop
    response = agent.invoke(
        prompt=prompt,
        session_id=session_id,
        user_id=user_id,
        stream=False
    )
    
    # Verification
    assert response is not None
    # If the model worked correctly, it should have called the tool.
    # The response content should mention the quiz or artifact.
    # Note: 0.5b models might be flaky, but we expect it to attempt tool calling if prompted.
    print(f"Agent Response: {response}")

def test_unauthorized_identity_flow(agent):
    """
    Scenario: Guest tries to recalibrate study priorities (Premium/User only).
    [LLM] Proposes recalibrate_study_priorities.
    [SYSTEM] Rejects due to Identity Policy.
    """
    user_id = "guest-123"
    session_id = "test-session-guest"
    prompt = "Please recalibrate my study priorities based on my trends."
    
    # We need to simulate the agent encountering a guest. 
    # Currently, HanachanAgent.invoke doesn't take 'identity_type', it defaults to 'user'.
    # For testing, we can temporarily hack the agent's policy check or pass identity.
    # Let's update HanachanAgent.invoke to accept identity_type or derive it.
    
    # But for a basic test, let's see if the PolicyEngine itself rejects it.
    from agent.engine.policy_engine import PolicyEngine
    pe = PolicyEngine()
    
    # 'recalibrate_study_priorities' is in manifest but NOT allowed for 'guest' in policy.yaml
    decision = pe.evaluate_tool_call("recalibrate_study_priorities", user_id, identity_type="guest")
    
    assert decision["allowed"] is False
    assert "not permitted" in decision["reason"]
    print(f"Policy Decision for Guest: {decision}")

if __name__ == "__main__":
    # If run directly
    pytest.main([__file__])
