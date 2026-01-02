import unittest
from backend.hanachan.workflows.workflow_study_agent import agent_workflow
from backend.hanachan.schemas.signal import Signal, SignalPriority
from backend.hanachan.services.memory import MemoryService
import time

class TestAgentMemoryIntegration(unittest.TestCase):
    def setUp(self):
        # Reset memory for test
        self.agent = agent_workflow
        # Hacky clean for test
        self.agent.memory = MemoryService(persistence_path="./test_agent_mem_db")
    
    def test_conversation_memory_loop(self):
        user_id = "u_mem_1"
        
        # 1. Provide a Fact
        self.agent.memory.add_semantic_fact(user_id, "User is studying for N1 exam.")
        
        # 2. Run Agent
        input_data = {"user_id": user_id, "message": "What should I study?"}
        result = self.agent.run(input_data)
        
        # 3. Verify Context Usage
        print(f"Result: {result}")
        self.assertIn("N1 exam", result["context_used"])
        self.assertIn("facts", result["response"])

    def test_signal_processing_with_memory(self):
        user_id = "u_sig_1"
        
        # 1. Send Signal
        sig = Signal(type="streak.warning", priority="P1", user_id=user_id, payload={})
        result = self.agent.run(sig)
        
        # 2. Verify Action Triggered
        self.assertEqual(result["action"], "send_notification")
        
        # 3. Verify Logic was stored in Memory (Reflection)
        memories = self.agent.memory.retrieve_episodic_memory(user_id, "streak")
        self.assertTrue(len(memories) > 0)
        self.assertIn("streak.warning", memories[0]["content"])

if __name__ == '__main__':
    unittest.main()
