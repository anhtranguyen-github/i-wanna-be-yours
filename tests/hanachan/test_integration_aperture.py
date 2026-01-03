import pytest
import os
import sys
from agent.core_agent import HanachanAgent

def test_agent_integration_with_aperture():
    from unittest.mock import MagicMock, AsyncMock, patch
    
    # Patch dependencies
    with patch('agent.core_agent.get_memory_manager', return_value=MagicMock()), \
         patch('agent.core_agent.ModelFactory.create_chat_model', return_value=MagicMock()), \
         patch('agent.core_agent.PolicyEngine', return_value=MagicMock()), \
         patch('agent.core_agent.ConfigLoader', return_value=MagicMock()):
        agent = HanachanAgent()
        
    user_id = "test-user-123"
    session_id = "test-session-integration"
    prompt = "Hi Hanachan, what was the last flashcard deck we made?"
    
    # We won't call the real LLM here to avoid slowness, 
    # but we will verify that 'invoke' calls 'assemble' correctly.
    # We can mock the context_assembler.assemble call.
    
    from unittest.mock import MagicMock, AsyncMock
    agent.context_assembler.assemble = AsyncMock(return_value=MagicMock(to_system_narrative=lambda: "MOCK NARRATIVE"))
    
    # Also mock llm to avoid real inference
    agent.llm_with_tools.invoke = MagicMock(return_value=MagicMock(content="I remember you made a Particle Deck.", tool_calls=[]))
    
    response = agent.invoke(
        prompt=prompt,
        session_id=session_id,
        user_id=user_id,
        stream=False
    )
    
    assert "I remember" in response
    # Verify Aperture was called
    agent.context_assembler.assemble.assert_called_once()
    print(f"Integration Response: {response}")

if __name__ == "__main__":
    test_agent_integration_with_aperture()
    print("✅ Agent Integration with Aperture Verified")
