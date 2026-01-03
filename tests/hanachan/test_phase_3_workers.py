
import unittest
from unittest.mock import MagicMock, patch
from app import create_app, db
from services.queue_factory import get_queue
import uuid
import time
from models.episode import Episode, EpisodeStatus

class TestPhase3Workers(unittest.TestCase):
    def setUp(self):
        # Patch Mongo to avoid connection errors in CI/Test
        self.mongo_patcher = patch("database.mongo.init_mongo_indexes")
        self.mock_mongo = self.mongo_patcher.start()
        
        self.app = create_app()
        self.app_context = self.app.app_context()
        self.app_context.push()
        self.queue = get_queue()
        self.queue.empty()

    def tearDown(self):
        self.app_context.pop()
        self.mongo_patcher.stop()

    @patch("tasks.memory.ModelFactory.create_chat_model")
    @patch("tasks.memory.EpisodicMemory.add_memory")
    @patch("tasks.memory.SemanticMemory.add_relationships")
    def test_memory_processing_worker(self, mock_semantic, mock_episodic, mock_llm_factory):
        """
        Test that process_interaction task calls LLMs and updates memory.
        """
        # Mock LLM
        mock_llm = MagicMock()
        mock_llm.invoke.return_value.content = '{"relationships": [{"source": {"id": "User", "type": "User"}, "target": {"id": "Japanese", "type": "Topic"}, "type": "WANTS_TO_LEARN"}]}'
        mock_llm_factory.return_value = mock_llm
        
        from tasks.memory import process_interaction
        
        session_id = f"test-session-{uuid.uuid4()}"
        user_msg = "I want to learn Japanese."
        agent_res = "I can help with Japanese!"
        
        print(f"🚀 Running process_interaction task for {session_id}...")
        result = process_interaction(session_id, user_msg, agent_res)
        
        self.assertTrue(result)
        
        # Verify Episode Creation
        ep = Episode.query.filter_by(session_id=session_id).first()
        self.assertIsNotNone(ep)
        self.assertEqual(ep.status, EpisodeStatus.OPEN)
        print(f"✅ Episode {ep.id} created.")
        
        # Verify LLM calls
        # 1 for summary, 1 for extraction
        self.assertEqual(mock_llm.invoke.call_count, 2)
        
        # Verify Memory Updates
        self.assertTrue(mock_episodic.called)
        self.assertTrue(mock_semantic.called)
        print("✅ Episodic and Semantic memory update methods called.")

    @patch("tasks.resource.ResourceProcessor.get_resource_content")
    @patch("tasks.resource.EpisodicMemory.add_memory")
    def test_resource_ingestion_worker(self, mock_episodic, mock_get_content):
        """
        Test that ingest_resource task extracts content and embeds it.
        """
        mock_get_content.return_value = {
            "id": "123",
            "title": "Study Plan",
            "content": "Learn kanji every day."
        }
        
        from tasks.resource import ingest_resource
        
        print("🚀 Running ingest_resource task...")
        result = ingest_resource("123")
        
        self.assertTrue(result)
        self.assertTrue(mock_episodic.called)
        
        # Check metadata passed to episodic memory
        args, kwargs = mock_episodic.call_args
        self.assertEqual(args[0], "Learn kanji every day.")
        self.assertEqual(kwargs['metadata']['resource_id'], '123')
        print("✅ Resource ingestion task verified.")

if __name__ == "__main__":
    unittest.main()
