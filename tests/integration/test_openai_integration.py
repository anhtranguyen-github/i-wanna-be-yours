import unittest
import os
import json
from dotenv import load_dotenv
from backend.hanachan.workflows.enhanced_agent import BetterStudyAgent
from backend.scripts.seed_learner_db import TEST_USER_ID

# Load environment variables from .env
load_dotenv()

class TestOpenAIIntegration(unittest.TestCase):
    def setUp(self):
        # Ensure we have the API key for the test
        if not os.getenv("OPENAI_API_KEY"):
            self.skipTest("OPENAI_API_KEY not found in environment. Skipping real LLM test.")
        
        # Re-initialize agent to pick up the env var
        self.agent = BetterStudyAgent()

    def test_llm_response_with_context(self):
        print(f"\n[Test] Testing Real OpenAI Integration for user: {TEST_USER_ID}...")
        
        # This user was seeded with JLPT N3 preferences and a 12-day streak
        user_query = "Based on my progress and goals, what should I focus on next?"
        
        result = self.agent.handle_interaction({"user_id": TEST_USER_ID, "message": user_query})
        
        print(f"Agent Source: {result['source']}")
        print(f"Hanachan's Response (LLM):\n{result['response']}")
        
        # Assertions
        self.assertEqual(result['source'], "openai")
        self.assertTrue(len(result['response']) > 20)
        
        # Check if the LLM acknowledged the context (N3 or streak or vocab)
        # Note: LLM responses are variable, so we check for keywords that should be in context
        response_lower = result['response'].lower()
        context_words = ["n3", "streak", "vocab", "japanese", "vocabulary"]
        found_context = any(word in response_lower for word in context_words)
        
        self.assertTrue(found_context, f"LLM response did not seem to use seeded context. Response: {result['response']}")
        print("✅ SUCCESS: Real OpenAI model invoked and used database context.")

if __name__ == '__main__':
    unittest.main()
