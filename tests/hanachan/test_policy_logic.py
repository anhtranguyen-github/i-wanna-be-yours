import pytest
import os
import sys
from agent.engine.policy_engine import PolicyEngine
from agent.engine.loader import ConfigLoader

def test_policy_engine_logic():
    ConfigLoader.reload()
    pe = PolicyEngine()
    
    # 1. Test valid tool for user
    decision = pe.evaluate_tool_call("create_study_quiz", "user-1", identity_type="user")
    assert decision["allowed"] is True
    
    # 2. Test invalid tool for guest
    decision = pe.evaluate_tool_call("recalibrate_study_priorities", "guest-1", identity_type="guest")
    assert decision["allowed"] is False
    assert "not permitted" in decision["reason"]
    
    # 3. Test non-existent tool
    decision = pe.evaluate_tool_call("hack_nasa", "user-1", identity_type="user")
    assert decision["allowed"] is False
    assert "does not exist" in decision["reason"]
    
    # 4. Test memory trigger logic
    trigger = pe.evaluate_memory_save("I really struggle with particles like wa and ga.")
    assert trigger is not None
    assert trigger["rule_type"] == "learning_struggle"
    assert trigger["action"] == "save_to_semantic"
    
    trigger = pe.evaluate_memory_save("The weather is nice today.")
    assert trigger is None # No pattern match

if __name__ == "__main__":
    test_policy_engine_logic()
    print("✅ PolicyEngine Logic Verified")
