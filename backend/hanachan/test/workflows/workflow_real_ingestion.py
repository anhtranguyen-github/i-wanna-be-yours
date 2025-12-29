import os
import sys
import logging
from dotenv import load_dotenv

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
load_dotenv(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../.env')))

from services.agent_service import AgentService
from schemas.chat import AgentRequest, ContextConfigurationDTO
from services.resource_processor import ResourceProcessor
from models.resource import Resource

from app import create_app

def workflow_real_ingestion():
    """
    WORKFLOW 4: Real Resource Ingestion & RAG
    
    Target Flow:
    1. Read a real file from backend/hanachan/.testfile/
    2. Ingest it into the system (simulating upload).
    3. Chat with the agent using that specific resource ID.
    4. Verify the agent answers based on the file content.
    """
    print("\n🚀 WORKFLOW: Real Resource Ingestion & Deduplication")
    
    # Update path to new location
    test_file_path = os.path.join(os.path.dirname(__file__), 'resources/sample_grammar.txt')
    if not os.path.exists(test_file_path):
        print(f"❌ Test file not found: {test_file_path}")
        return

    # --- Step 0: Auth Token ---
    import jwt
    import time
    import requests
    
    # Matching what start_local_services.sh uses
    JWT_SECRET = os.getenv("JWT_SECRET", "your-development-secret-key")
    USER_ID = "wf-user-real-001"
    
    token = jwt.encode({
        "id": USER_ID, # Flask middleware usually looks for 'userId' or 'id'
        "userId": USER_ID,
        "role": "user",
        "exp": int(time.time()) + 3600
    }, JWT_SECRET, algorithm="HS256")
    
    headers = {"Authorization": f"Bearer {token}"}
    API_URL = "http://localhost:5100"

    # --- Step 1: Real HTTP Upload ---
    print(f"\n📂 [Step 1] Uploading file via HTTP to {API_URL}/v1/resources/upload...")
    
    resource_id = None
    try:
        with open(test_file_path, 'rb') as f:
            files = {'file': (os.path.basename(test_file_path), f, 'text/plain')}
            res = requests.post(f"{API_URL}/v1/resources/upload", headers=headers, files=files)
        
        if res.status_code == 201:
            data = res.json()
            resource_id = data['id']
            print(f"✅ Upload Successful! ID: {resource_id}")
        else:
            print(f"❌ Upload Failed: {res.status_code} - {res.text}")
            return
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        return

    # --- Step 2: Duplicate Prevention Check ---
    print("\n🔄 [Step 2] Testing Duplicate Upload Prevention...")
    try:
        with open(test_file_path, 'rb') as f:
            files = {'file': (os.path.basename(test_file_path), f, 'text/plain')}
            res = requests.post(f"{API_URL}/v1/resources/upload", headers=headers, files=files)
        
        if res.status_code == 200:
            data = res.json()
            dup_id = data['id']
            if dup_id == resource_id:
                print(f"✅ Deduplication Verified: Returned existing ID {dup_id} (Status 200)")
            else:
                print(f"❌ Deduplication Logic Error: Got different ID {dup_id}")
        elif res.status_code == 201:
             print("❌ Deduplication Failed: Created new resource (201 Created)")
        else:
             print(f"⚠️ Unexpected Status: {res.status_code}")
    except Exception as e:
        print(f"❌ Duplicate Check Error: {e}")

    app = create_app()
    with app.app_context():
        # --- Step 3: Indexing (Synchronous) ---
        print("\n⚙️ [Step 3] Indexing resource (Real fetch from Flask)...")
        from tasks.resource import ingest_resource
        
        # Now ingest_resource will call ResourceProcessor, which calls Flask API GET /v1/resources/{id}
        # Since we really uploaded it, Flask has it.
        # We need to rely on ingest_resource generating its own token (system-worker) which Flask accepts.
        
        success = ingest_resource(resource_id)
        if success:
            print("✅ Indexing successful.")
        else:
            print("❌ Indexing failed.")
            return

        # --- Step 4: Chat with Context (Summarization) ---
        print("\n📝 [Step 4] User asks to 'Summarize this' with resource attached...")
        service = AgentService()
        req = AgentRequest(
            session_id="wf-real-rag-001",
            user_id=USER_ID,
            prompt="Summarize this document for me.",
            context_config=ContextConfigurationDTO(
                resource_ids=[resource_id]
            )
        )
        
        resp = service.invoke_agent(req)
        content_resp = resp.responses[0].content if resp.responses else ""
        if hasattr(content_resp, 'content'): content_resp = content_resp.content
        
        print(f"🤖 Agent: {content_resp}")
        
        # --- Verification 1: Content ---
        # The summary should mention "te-form", "Group 1", "Group 2", or "irregular"
        keywords = ["te-form", "group", "irregular", "verb"]
        found = [k for k in keywords if k in content_resp.lower()]
        
        if len(found) >= 2:
             print(f"\n✅ [Content Check] Summary generated (Keywords found: {found}).")
        else:
             print(f"\n⚠️ [Content Check] Summary might be too vague. Keywords found: {found}")
             
        # --- Verification 2: Memory Persistence ---
        print("\n🧠 [Step 5] Verifying Memory Persistence...")
        # Check if the interaction was saved to Episodic Memory (Chat History)
        from memory.manager import get_memory_manager
        mm = get_memory_manager()
        
        # Check AgentService.invoke_agent:
        #   3. Try to save Assistant Message & Artifacts to DB (Sync)
        #   4. MemoryManager.save_interaction (Async/Queue)
        
        # We can check the DB for the chat message.
        from models.message import ChatMessage
        last_msg = ChatMessage.query.filter_by(content=content_resp).first()
        if last_msg:
             print(f"✅ [Memory Check] DB Persistence verified (Msg ID: {last_msg.id})")
        else:
             print("⚠️ [Memory Check] Response not found in SQL DB.")
             
        # We can also check Vector Store if we had a worker processing the queue.
        # Since we might not have a worker running for this specific test script context,
        # we skip verifying the vector embedding of the chat *history* unless we process the queue manually.


if __name__ == "__main__":
    workflow_real_ingestion()
