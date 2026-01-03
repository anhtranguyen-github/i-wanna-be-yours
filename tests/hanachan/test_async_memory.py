
import unittest
from unittest.mock import MagicMock, patch
from app import create_app
import uuid
import time
from services.queue_factory import get_queue

class TestAsyncMemory(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app_context = self.app.app_context()
        self.app_context.push()
        
        # Clear queue before test
        self.queue = get_queue()
        self.queue.empty()

    def tearDown(self):
        self.app_context.pop()

    @patch("services.llm_factory.ModelFactory.create_chat_model")
    def test_agent_enqueues_job(self, mock_create_model):
        """
        Verify that invoking the agent enqueues a memory task 
        instead of blocking.
        """
        # Mock LLM to return immediate response
        mock_llm = MagicMock()
        mock_llm.invoke.return_value.content = "I am a mock response."
        
        # Mock Stream (generator)
        def mock_stream(*args, **kwargs):
            yield MagicMock(content="I am ")
            yield MagicMock(content="a mock response.")
        mock_llm.stream.side_effect = mock_stream
        
        mock_create_model.return_value = mock_llm

        from agent.ollama_agent import HanachanAgent
        agent = HanachanAgent()
        
        session_id = f"test-session-{uuid.uuid4()}"
        user_prompt = "Hello World"
        
        print("\n🚀 Invoking Agent (Stream Mode)...")
        start_time = time.time()
        
        # Consume the generator
        response_content = ""
        for chunk in agent.invoke(
            prompt=user_prompt,
            session_id=session_id,
            user_id="user-123",
            stream=True
        ):
            response_content += chunk
            
        elapsed = time.time() - start_time
        print(f"⏱️ Agent finished in {elapsed:.4f}s")
        
        self.assertEqual(response_content, "I am a mock response.")
        
        # Verify Queue
        print("🔍 Checking Redis Queue...")
        jobs = self.queue.jobs
        self.assertEqual(len(jobs), 1, "Should have exactly 1 job in queue")
        
        job = jobs[0]
        print(f"✅ Found Job ID: {job.id}")
        print(f"   Func: {job.func_name}")
        print(f"   Args: {job.kwargs}")
        
        self.assertEqual(job.func_name, 'tasks.memory.process_interaction')
        self.assertEqual(job.kwargs['session_id'], session_id)
        self.assertEqual(job.kwargs['user_message'], user_prompt)
        self.assertEqual(job.kwargs['agent_response'], "I am a mock response.")

if __name__ == "__main__":
    unittest.main()
