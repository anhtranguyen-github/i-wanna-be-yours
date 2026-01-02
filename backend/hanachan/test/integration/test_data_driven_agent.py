import unittest
from backend.hanachan.workflows.enhanced_agent import study_agent
from backend.scripts.seed_learner_db import TEST_USER_ID

class TestDataDrivenAgent(unittest.TestCase):
    def test_agent_uses_real_db_data(self):
        print(f"\n[Test] Checking agent response for seeded user: {TEST_USER_ID}...")
        
        # This user was seeded with a 12-day streak and 142 vocab
        result = study_agent.handle_interaction({"user_id": TEST_USER_ID, "message": "How is my progress?"})
        
        print(f"Result Response: {result['response']}")
        print(f"Result Stats: {result['real_stats']}")
        
        # Verify the stats match what we seeded
        self.assertEqual(result['real_stats']['current_streak'], 12)
        self.assertEqual(result['real_stats']['vocabulary_mastered'], 142)
        
        # Verify the response mentions the real vocab count
        self.assertIn("142", result['response'])
        self.assertIn("12-day", result['response'])
        
        print("✅ SUCCESS: Agent is pulling real data from MongoDB, not using mocks.")

if __name__ == '__main__':
    unittest.main()
