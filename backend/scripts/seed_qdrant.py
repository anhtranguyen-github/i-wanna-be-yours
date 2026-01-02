import os
import sys
from dotenv import load_dotenv

# Load .env from hanachan folder
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'hanachan', '.env'))

# Ensure backend and hanachan folder are in path
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(root_dir)
sys.path.append(os.path.join(root_dir, 'hanachan'))

from hanachan.services.memory import MemoryService

def seed_qdrant_memory():
    print("🚀 SEEDING QDRANT CLUSTER WITH UNIFIED MEMORY...")
    svc = MemoryService()
    
    user_id = "user_demo_1"
    
    # 1. Add Semantic Facts
    print(f"   Adding semantic facts for {user_id}...")
    svc.add_semantic_fact(user_id, "User prefers polite Japanese (Desu/Masu).", "preferences")
    svc.add_semantic_fact(user_id, "User is currently studying for JLPT N3.", "goals")
    svc.add_semantic_fact(user_id, "User struggles with reading Kanji for 'Waiting'.", "weaknesses")
    svc.add_semantic_fact(user_id, "User enjoys cooking Japanese food.", "interests")
    
    # 2. Add Episodic Memories
    print(f"   Adding episodic memories for {user_id}...")
    svc.add_episodic_memory(user_id, "User asked about the difference between 'wa' and 'ga'. Hanachan explained it using the 'New Info' vs 'Topic' concept.", {"source": "conversation"})
    svc.add_episodic_memory(user_id, "User was encouraged to study after a 3-day absence.", {"source": "signal_agent"})
    svc.add_episodic_memory(user_id, "User successfully completed a 10-word quiz with 90% accuracy.", {"source": "quiz"})

    print("✅ Done. Memory is now unified in Qdrant.")
    
    # 3. Verify Stats
    stats = svc.get_memory_stats(user_id)
    print(f"📊 Live Stats: {stats}")

if __name__ == "__main__":
    seed_qdrant_memory()
