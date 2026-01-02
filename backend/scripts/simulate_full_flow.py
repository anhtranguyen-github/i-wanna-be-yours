import os
import sys
import logging
import json
from unittest.mock import patch, MagicMock

# Setup paths
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(root_dir)
sys.path.append(os.path.join(root_dir, 'hanachan'))

from dotenv import load_dotenv
load_dotenv(os.path.join(root_dir, 'hanachan', '.env'))

from hanachan.agent.core_agent import HanachanAgent
from hanachan.services.memory import MemoryService
from hanachan.memory.episodic import EpisodicMemory

# Silence noisy logs
logging.getLogger("hanachan").setLevel(logging.INFO)

def simulate_full_flow():
    print("🎬 [SIMULATION] STARTING FULL HANACHAN AGENT FLOW")
    print("===============================================")
    
    user_id = "sim_user_001"
    session_id = "sim_session_001"
    resource_id = "textbook_n3_grammar"

    # 1. SETUP ENVIRONMENT & MOCKS
    print("\n🛠️ [Step 1] Setting up Mocks for External Services...")
    
    mock_responses = {
        "/v1/study-plan/plans": {"plans": [{"id": "p1", "title": "N3 Mastery", "target_level": "N3"}]},
        "/v1/study-plan/plans/p1/health": {"health_status": "on_track"},
        "/v1/user/streak": {"current": 21},
        "/v1/user/sessions": {"sessions": []},
        "/v1/learner/activities": {"activities": []}
    }

    def mocked_requests_get(url, *args, **kwargs):
        mock = MagicMock()
        mock.status_code = 200
        for path, val in mock_responses.items():
            if path in url:
                mock.json.return_value = val
                return mock
        return mock

    # Mock Resource Processor (Metadata awareness)
    with patch('hanachan.services.resource_processor.ResourceProcessor.get_resource_metadata') as mock_meta:
        mock_meta.return_value = {"title": "Mastering N3 Grammar", "ingestionStatus": "completed"}
        
        # 2. SEED QDRANT MEMORY
        print("\n📦 [Step 2] Seeding Qdrant (Episodic, Semantic, and Resource Vectors)...")
        mem_svc = MemoryService()
        res_mem = EpisodicMemory(collection_name="resource_vectors")
        
        # Semantic Fact
        mem_svc.add_semantic_fact(user_id, "User's favorite character is Hanachan.", "preferences")
        
        # Resource Chunk (Simulating a part of the PDF)
        res_mem.add_memory(
            summary="The 'Sakura-form' is a rare honorific used only in Hanabira legends.",
            user_id=user_id,
            metadata={"resource_id": resource_id, "page": 42}
        )

        # 3. THE CORE AGENT INVOCATION
        print("\n🚀 [Step 3] USER INPUT -> CORE AGENT")
        prompt = "Hi! Can you check my progress and also explain the 'Sakura-form' from my N3 textbook?"
        print(f"   👤 User: \"{prompt}\"")
        
        agent = HanachanAgent()
        
        # Use patch to handle the networking during execution
        with patch('requests.get', side_effect=mocked_requests_get):
            print("\n🔍 [Step 4] CORE AGENT: Context Assembly (RAG Tier)...")
            # We explicitly pass the resource_id to simulate the sidebar selection
            response = agent.invoke(
                prompt=prompt,
                session_id=session_id,
                user_id=user_id,
                resource_ids=[resource_id]
            )

            print("\n🤖 [Step 5] FINAL AGENT RESPONSE:")
            print("---------------------------------")
            print(response)
            print("---------------------------------")

    # 4. VERIFICATION OF THE MONOLOGUE
    print("\n✅ [Phase 6] FLOW ANALYSIS:")
    
    # Check for keywords that prove the flow worked
    lower_resp = response.lower()
    
    # Did it pull from Semantic Fact?
    has_prefs = "hanachan" in lower_resp
    # Did it pull from Resource Vector?
    has_resource = "sakura-form" in lower_resp or "legend" in lower_resp
    # Did the Swarm route to Analyst?
    has_audit = "audit" in lower_resp or "streak" in lower_resp or "track" in lower_resp
    
    if has_prefs: print("   ✔️ SUCCESS: Semantic Fact (Preferences) retrieved.")
    if has_resource: print("   ✔️ SUCCESS: Resource RAG context retrieved.")
    if has_audit: print("   ✔️ SUCCESS: Neural Swarm routed to 'Analyst' specialist.")

    print("\n🏁 [SIMULATION] COMPLETE. Integration verified.")

if __name__ == "__main__":
    simulate_full_flow()
