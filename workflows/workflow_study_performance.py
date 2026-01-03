
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

class TestStudyPerformanceWorkflow(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()
        
        self.user_id = "perf-test-user"
        self.session_id = "perf-test-session"
        
        # Initialize MemoryManager
        self.memory_manager = get_memory_manager()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    @patch('services.study_service.requests.get')
    @patch('services.study_service.requests.post')
    def test_performance_and_proactive_workflow(self, mock_post, mock_get):
        """
        Verify the full workflow:
        1. User asks about specific historical records (exams).
        2. User performs a task (e.g. writing a sentence).
        3. Agent evaluates performance (quality + stats) and dumps to collection.
        4. Agent updates a specific goal.
        """
        
        # 1. Setup Mock for GET (History, Plan, Stats)
        def mock_get_side_effect(url, **kwargs):
            mock_res = MagicMock()
            mock_res.status_code = 200
            if "plans" in url:
                mock_res.json.return_value = {"plans": [{"id": "plan-123", "status": "active"}]}
            elif "plans/plan-123" in url:
                mock_res.json.return_value = {"id": "plan-123", "title": "N3 Plan", "target_level": "N3", "progress_percent": 60, "current_milestone_title": "Grammar"}
            elif "daily-tasks" in url:
                mock_res.json.return_value = {"tasks": [{"id": "goal-456", "title": "Write 5 N3 sentences", "completed": False}]}
            elif "activities" in url:
                mock_res.json.return_value = {"activities": [
                    {"date": "2025-12-28", "type": "Mock Exam", "output": "N4 Review", "score": "95%"},
                    {"date": "2025-12-27", "type": "Flashcard Session", "output": "Vocab", "score": "80%"}
                ]}
            elif "performance/trackings" in url:
                mock_res.json.return_value = {"trackings": []}
            elif "streak" in url:
                mock_res.json.return_value = {"current": 7}
            elif "sessions" in url:
                mock_res.json.return_value = {"sessions": []}
            return mock_res

        mock_get.side_effect = mock_get_side_effect

        # 2. Setup Mock for POST (Save tracking, Toggle goal)
        mock_post_res = MagicMock()
        mock_post_res.status_code = 201 # for saving tracking
        def mock_post_side_effect(url, **kwargs):
             m = MagicMock()
             if "trackings" in url:
                 m.status_code = 201
                 m.json.return_value = {"id": "perf-doc-1"}
             elif "toggle" in url:
                 m.status_code = 200
                 m.json.return_value = {"message": "Toggled"}
             return m
        mock_post.side_effect = mock_post_side_effect

        agent = HanachanAgent()
        
        # --- PHASE 1: Historical Query ---
        print("\n--- PHASE 1: Querying History ---")
        resp1 = agent.invoke(
            prompt="Hanachan, how did I do on my last mock exam?",
            session_id=self.session_id,
            user_id=self.user_id
        )
        print(f"🤖 Agent: {resp1}")
        self.assertIn("95%", resp1)

        # --- PHASE 2: Performance Evaluation & Goal Update ---
        print("\n--- PHASE 2: Performance Evaluation ---")
        # Simulate user writing a sentence and asking for an audit
        prompt2 = (
            "I wrote this for my 'Write 5 N3 sentences' goal: '昨日、図書館へ行きました。'. "
            "Can you evaluate my note quality and update my goal status?"
        )
        resp2 = agent.invoke(
            prompt=prompt2,
            session_id=self.session_id,
            user_id=self.user_id
        )
        print(f"🤖 Agent: {resp2}")
        
        # Verify tool calls happened by checking mock_post calls
        # At least one for performance tracking, one for goal toggle
        self.assertTrue(mock_post.call_count >= 2, f"Expected 2+ POST calls, got {mock_post.call_count}")
        
        # Verify specific tool mentions or logic in response
        self.assertIn("quality", resp2.lower())
        self.assertIn("goal", resp2.lower())

if __name__ == "__main__":
    unittest.main()
