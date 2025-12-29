
import unittest
from unittest.mock import patch, MagicMock
import os
import sys
import json
from datetime import datetime

# Ensure we can import from the root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from agent.core_agent import HanachanAgent
from memory.manager import get_memory_manager

class TestMemoryRecalibrationWorkflow(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()
        
        self.user_id = "recalibrate-test-user"
        self.session_id = "recalibrate-session"
        
        # Initialize MemoryManager
        self.memory_manager = get_memory_manager()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    @patch('services.study_service.requests.get')
    @patch('services.study_service.requests.post')
    def test_recalibration_workflow(self, mock_post, mock_get):
        """
        Verify that the agent:
        1. Identifies struggle points from semantic memory.
        2. Proactively suggests recalibration.
        3. Executes recalibrate_study_priorities.
        """
        
        # 1. Setup Mock for GET (History, Plan, Stats, Trends)
        def mock_get_side_effect(url, **kwargs):
            mock_res = MagicMock()
            mock_res.status_code = 200
            if "plans" in url:
                mock_res.json.return_value = {"plans": [{"id": "plan-789", "status": "active"}]}
            elif "plans/plan-789" in url or "summary" in url:
                mock_res.json.return_value = {
                    "id": "plan-789", "title": "N3 Master Plan", 
                    "target_level": "N3", "progress_percent": 30, 
                    "current_milestone": "Intermediate Grammar"
                }
            elif "daily-tasks" in url or "smart-goals" in url:
                mock_res.json.return_value = [
                    {"id": "goal-1", "title": "Daily Grammar Practice", "completed": False, "priority": 1}
                ]
            elif "performance/trends" in url:
                mock_res.json.return_value = {
                    "status": "success",
                    "identified_struggles": ["particles", "passive_form"],
                    "avg_note_quality": 4.5
                }
            elif "activities" in url:
                 mock_res.json.return_value = {"activities": []}
            elif "performance/trackings" in url:
                 mock_res.json.return_value = {"trackings": []}
            elif "streak" in url:
                 mock_res.json.return_value = {"current": 5}
            elif "sessions" in url:
                 mock_res.json.return_value = {"sessions": []}
            return mock_res

        mock_get.side_effect = mock_get_side_effect

        # 2. Mock for POST (Batch Update)
        mock_post_res = MagicMock()
        mock_post_res.status_code = 200
        mock_post.return_value = mock_post_res

        agent = HanachanAgent()
        
        # --- PHASE 1: Identifying Struggles ---
        print("\n--- PHASE 1: Identifying Struggles ---")
        resp1 = agent.invoke(
            prompt="Hanachan, what should I focus on for my study today?",
            session_id=self.session_id,
            user_id=self.user_id
        )
        print(f"🤖 Agent: {resp1}")
        # Agent should mention struggle points from mock trends
        self.assertTrue("particles" in resp1.lower() or "passive" in resp1.lower())

        # --- PHASE 2: Proactive Recalibration ---
        print("\n--- PHASE 2: Recalibrating ---")
        resp2 = agent.invoke(
            prompt="That's right, I'm really struggling with those. Can you update my study plan to prioritize them?",
            session_id=self.session_id,
            user_id=self.user_id
        )
        print(f"🤖 Agent: {resp2}")
        
        # Verify recalibrate_study_priorities was called (which triggers a POST to /batch)
        # Checking if mock_post was called for 'batch'
        batch_call_found = False
        for call in mock_post.call_args_list:
            if "batch" in call.args[0]:
                batch_call_found = True
                break
        self.assertTrue(batch_call_found, "Expected a POST call to /batch for recalibration")
        self.assertIn("Recalibration complete", resp2)

if __name__ == "__main__":
    unittest.main()
