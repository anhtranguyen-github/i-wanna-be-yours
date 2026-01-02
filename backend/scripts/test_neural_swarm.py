import os
import sys
from dotenv import load_dotenv

# Ensure backend and hanachan folder are in path
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(root_dir)
sys.path.append(os.path.join(root_dir, 'hanachan'))

# Load .env
load_dotenv(os.path.join(root_dir, 'hanachan', '.env'))

from hanachan.agent.neural_swarm import swarm_instance

def test_swarm_routing():
    print("🐝 TESTING NEURAL SWARM ROUTING...")
    user_id = "user_demo_1"
    
    # Test 1: Strategy Question
    print("\n--- TEST 1: STRATEGY (OKR/PACT) ---")
    req1 = "How are my long-term JLPT goals looking? Am I staying consistent with my habits?"
    resp1 = swarm_instance.route_and_solve(req1, user_id)
    print(f"Response: {resp1[:200]}...")

    # Test 2: Analyst Question
    print("\n--- TEST 2: ANALYST (Progress Audit) ---")
    req2 = "Can you perform a deep audit of my recent study sessions and tell me my weak points?"
    resp2 = swarm_instance.route_and_solve(req2, user_id)
    print(f"Response: {resp2[:200]}...")

    # Test 3: General Question
    print("\n--- TEST 3: GENERAL ---")
    req3 = "How do I say 'I am hungry' in polite Japanese?"
    resp3 = swarm_instance.route_and_solve(req3, user_id)
    print(f"Result (should be fallback): {resp3}")

if __name__ == "__main__":
    test_swarm_routing()
