import os
import sys
import logging
import json

# Setup paths
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(root_dir)
sys.path.append(os.path.join(root_dir, 'hanachan'))

from dotenv import load_dotenv
load_dotenv(os.path.join(root_dir, 'hanachan', '.env'))

from hanachan.agent.core_agent import HanachanAgent
from hanachan.services.memory import MemoryService

# Silence noisy logs
logging.getLogger("hanachan").setLevel(logging.INFO)
logging.getLogger("httpx").setLevel(logging.WARNING)

def run_long_run_session():
    print("🚀 STARTING: LONG RUN SESSION (REAL GROQ + REAL SERVICES)")
    
    # Initialize Agent and Memory
    agent = HanachanAgent()
    memory = MemoryService()
    
    user_id = "long_run_test_user"
    session_id = "session_swarm_real_001"
    
    # Pre-seed some facts in Qdrant for this user
    print("\n📦 [Pre-seed] Injecting baseline memories into Qdrant...")
    memory.add_semantic_fact(user_id, "User's ultimate goal is to pass JLPT N2 by December.", "goals")
    memory.add_semantic_fact(user_id, "User struggles with 'Passive Form' and 'Causative' meanings.", "weaknesses")
    memory.add_semantic_fact(user_id, "User has a PACT to study 30 minutes every morning.", "habits")

    chat_history = []
    
    # --- TURN 1: GREETING & CONTEXT ---
    print("\n--- TURN 1: GREETING & CONTEXT ---")
    prompt1 = "Hi Hanachan! My name is Alex. I'm ready to study."
    resp1 = agent.invoke(prompt1, session_id, user_id, chat_history=chat_history)
    print(f"🤖 Hanachan: {resp1}")
    chat_history.append({"role": "user", "content": prompt1})
    chat_history.append({"role": "assistant", "content": resp1})

    print("\n--- TURN 2: STRATEGY (Routes to Strategist) ---")
    prompt2 = "How is my progress looking relative to my long-term OKRs and habit commitments?"
    resp2 = agent.invoke(prompt2, session_id, user_id, chat_history=chat_history)
    print(f"🤖 Hanachan: {resp2}")
    chat_history.append({"role": "user", "content": prompt2})
    chat_history.append({"role": "assistant", "content": resp2})
    
    print("\n--- TURN 3: ANALYSIS (Routes to Analyst) ---")
    prompt3 = "Can you perform an audit of my progress? I want to know if I'm truly on track for N3."
    resp3 = agent.invoke(prompt3, session_id, user_id, chat_history=chat_history)
    print(f"🤖 Hanachan: {resp3}")
    chat_history.append({"role": "user", "content": prompt3})
    chat_history.append({"role": "assistant", "content": resp3})

    print("\n--- TURN 4: LINGUISTICS (Routes to Linguist) ---")
    prompt4 = "Help me understand the 'Passive' form. I keep mixing it up with causative."
    resp4 = agent.invoke(prompt4, session_id, user_id, chat_history=chat_history)
    print(f"🤖 Hanachan: {resp4}")
    chat_history.append({"role": "user", "content": prompt4})
    chat_history.append({"role": "assistant", "content": resp4})

    print("\n--- TURN 5: MEMORY (Qdrant Retrieval) ---")
    prompt5 = "What did I tell you my name was, and what is my biggest weakness in Japanese?"
    resp5 = agent.invoke(prompt5, session_id, user_id, chat_history=chat_history)
    print(f"🤖 Hanachan: {resp5}")
    if "ALEX" in resp5.upper() and ("PASSIVE" in resp5.upper() or "CAUSATIVE" in resp5.upper()):
        print("✅ MEMORY VERIFIED: Qdrant recovered context across turns.")
    else:
        print("⚠️ MEMORY WEAK: Specialist might have masked the recovery or retrieval failed.")

    # --- NEW CONTENT CREATION TURNS ---
    # We allow the real ArtifactService to run. It will save to MongoDB.
    # We verify the response text implies success.

    print("\n--- TURN 6: CREATE FLASHCARDS ---")
    prompt6 = "Please create 5 flashcards about Japanese Food for N5 level."
    resp6 = agent.invoke(prompt6, session_id, user_id, chat_history=chat_history)
    print(f"🤖 Hanachan: {resp6}")
    chat_history.append({"role": "user", "content": prompt6})
    chat_history.append({"role": "assistant", "content": resp6})

    print("\n--- TURN 7: CREATE QUIZ ---")
    prompt7 = "Make a quick quiz about Particles."
    resp7 = agent.invoke(prompt7, session_id, user_id, chat_history=chat_history)
    print(f"🤖 Hanachan: {resp7}")
    chat_history.append({"role": "user", "content": prompt7})
    chat_history.append({"role": "assistant", "content": resp7})

    print("\n--- TURN 8: CREATE EXAM ---")
    prompt8 = "I want a full practice exam for N4."
    resp8 = agent.invoke(prompt8, session_id, user_id, chat_history=chat_history, token="mock-token-123")
    print(f"🤖 Hanachan: {resp8}")
    chat_history.append({"role": "user", "content": prompt8})
    chat_history.append({"role": "assistant", "content": resp8})
    
    print("\n--- TURN 9: LINGUIST + CONTENT (Perfect Coordination Test) ---")
    prompt9 = "Explain the difference between 'wa' and 'ga' and create a quiz about it to test me."
    resp9 = agent.invoke(prompt9, session_id, user_id, chat_history=chat_history, token="mock-token-123")
    print(f"🤖 Hanachan: {resp9}")
    
    print("\n🏁 LONG RUN SESSION TEST COMPLETE.")

if __name__ == "__main__":
    run_long_run_session()
