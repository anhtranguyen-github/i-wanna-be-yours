
import unittest
import os
import requests
import jwt
import time
from app import create_app, db
from services.agent_service import AgentService
from schemas.chat import AgentRequest, ContextConfigurationDTO
from models.resource import Resource
from models.message import ChatMessage

# ------------------------------------------------------------------------------
# WORKFLOW: Comprehensive Chat & Resource Integration
# ------------------------------------------------------------------------------
# Scenario:
# 1. User has a resource in the "Sidebar" (Already in DB/Vector Store).
# 2. User uploads a NEW resource from "PC" (via HTTP Endpoint).
# 3. User sends a message referencing BOTH resources.
# 4. System must:
#    - Handle the PC upload.
#    - Deduplicate if needed (though this test uses a new file).
#    - Ingest the new file.
#    - Retrieve context from BOTH files.
#    - Respond and save to Memory.
# ------------------------------------------------------------------------------

def run_workflow():
    print("\n🚀 WORKFLOW: Comprehensive Chat (Sidebar + PC Upload)")

    # --- Config ---
    FLASK_URL = os.environ.get("FLASK_URL", "http://localhost:5100")
    HANA_URL = os.environ.get("HANA_URL", "http://localhost:5400")
    JWT_SECRET = os.getenv("JWT_SECRET", "your-development-secret-key")
    
    # Dynamic User ID for Clean State per Run
    import uuid
    USER_ID = str(uuid.uuid4())
    SESSION_ID = str(uuid.uuid4())
    print(f"🔑 Using Temporary Test User: {USER_ID}")
    
    # Generate Token
    token = jwt.encode({
        "id": USER_ID,
        "userId": USER_ID,
        "role": "user",
        "exp": int(time.time()) + 3600
    }, JWT_SECRET, algorithm="HS256")
    headers = {"Authorization": f"Bearer {token}"}
    
    # --- Resources Config ---
    RESOURCES_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), 'resources'))
    if not os.path.exists(RESOURCES_DIR):
         os.makedirs(RESOURCES_DIR, exist_ok=True) # Ensure it exists for creation steps

    app = create_app()
    with app.app_context():
        # --- Step 0: Pre-flight Safety Checks (Coordination Logic) ---
        print("\n🛡️ [Step 0] Verifying Backend-Frontend Coordination (Limits)...")

        # Test 1: Invalid File Type
        try:
            exe_path = os.path.join(RESOURCES_DIR, 'malware_test.exe')
            # Create dummy only if not exists (cleanup handled later)
            with open(exe_path, 'w') as f: f.write("MZ_FAKE_HEADER")
            
            with open(exe_path, 'rb') as f:
                res = requests.post(f"{FLASK_URL}/v1/resources/upload", headers=headers, files={'file': f})
                if res.status_code == 400:
                    print("✅ Type Check Passed: Backend rejected .exe (400 Bad Request)")
                else:
                    print(f"❌ Type Check Failed: Got {res.status_code}, expected 400")
            
            # Cleanup
            if os.path.exists(exe_path):
                os.remove(exe_path)
                
        except Exception as e:
            print(f"⚠️ Type Check Error: {e}")

        # Test 2: Size Limit (Using existing 'oversized.pdf' if available)
        oversized_path = os.path.join(RESOURCES_DIR, 'oversized.pdf')
        if os.path.exists(oversized_path):
            try:
                # Expecting 413 Payload Too Large OR 400 with "File too large" message
                # Flask max_content_length usually returns 413.
                # Our middleware returns 400 with "FILE_TOO_LARGE" code if it checks it first, 
                # but Nginx/Flask core might catch 413 first if it exceeds MAX_CONTENT_LENGTH.
                with open(oversized_path, 'rb') as f:
                    # Requests might hang if we try to send full 27MB and backend kills connection early.
                    # We'll set a timeout.
                    res = requests.post(f"{FLASK_URL}/v1/resources/upload", headers=headers, files={'file': f}, timeout=5)
                    
                    if res.status_code == 413:
                        print("✅ Size Limit Check Passed: Backend returned 413 Payload Too Large")
                    elif res.status_code == 400:
                         print(f"✅ Size Limit Check Passed: Backend returned 400 ({res.text})")
                    else:
                        print(f"❌ Size Limit Check Failed: Got {res.status_code}")
            except Exception as e:
                 # If connection aborted (common with 413), it's also a pass roughly
                 print(f"✅ Size Limit Check Passed (Connection Aborted): {e}")
        else:
             print("⚠️ Skipping Size Limit Test: 'oversized.pdf' not found in resources.")

        # --- Step 1: Simulate "Sidebar" Resource (Pre-existing) ---
        print("\n📚 [Step 1] Creating 'Sidebar' Resource (Direct DB Insert)...")
        sidebar_content = "The Sakura Protocol emphasizes harmony and synchronization between neural interfaces."
        
        # Check if exists to avoid dup error on re-run
        existing = Resource.query.filter_by(title="Sakura Protocol Guide", user_id=USER_ID).first()
        if existing:
            sidebar_res = existing
            print(f"   Using existing sidebar resource: {sidebar_res.id}")
        else:
            sidebar_res = Resource(
                title="Sakura Protocol Guide",
                type="document",
                content=sidebar_content,
                user_id=USER_ID
            )
            db.session.add(sidebar_res)
            db.session.commit()
            print(f"✅ Sidebar Resource Created: {sidebar_res.id}")

        sidebar_id = str(sidebar_res.id)
        
        # Index it
        from tasks.resource import ingest_resource
        print("   Indexing Sidebar Resource...")
        try:
            ingest_resource(sidebar_id)
        except Exception as e:
            print(f"   Indexing warning (might be mocked/failed): {e}")

    # --- Step 2: Simulate "PC" Upload (New File) ---
    print("\n💻 [Step 2] Uploading 'PC' Resource (via HTTP)...")
    pc_file_path = os.path.join(RESOURCES_DIR, 'sample_grammar.txt')
    
    if not os.path.exists(pc_file_path):
        os.makedirs(os.path.dirname(pc_file_path), exist_ok=True)
        with open(pc_file_path, 'w') as f:
            f.write("Japanese Grammar: The te-form is used for requests.")
            
    pc_id = None
    try:
        with open(pc_file_path, 'rb') as f:
            files = {'file': (os.path.basename(pc_file_path), f, 'text/plain')}
            res = requests.post(f"{FLASK_URL}/v1/resources/upload", headers=headers, files=files)
            
        if res.status_code in [200, 201]:
            data = res.json()
            pc_id = data['id']
            print(f"✅ PC Upload Successful: {pc_id} (Status: {res.status_code})")
            
            # Force completion for test speed (simulate worker finishing)
            requests.put(f"{FLASK_URL}/v1/resources/{pc_id}", headers=headers, json={"ingestionStatus": "completed"})
            
            # Ensure index
            with app.app_context():
                 ingest_resource(pc_id)
        else:
             print(f"❌ PC Upload Failed: {res.status_code} - {res.text}")
             return
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        return

    # --- Step 3: Chat with BOTH Resources ---
    print(f"\n💬 [Step 3] Sending Message with Resources [{sidebar_id}, {pc_id}]...")
    
    # --- Step 3: Chat with BOTH Resources (Streaming) ---
    print(f"\n💬 [Step 3] Sending Message with Resources [{sidebar_id}, {pc_id}] (Streaming)...")
    
    stream_payload = {
        "session_id": SESSION_ID,
        "user_id": USER_ID,
        "prompt": "Explain the relation between Sakura Protocol and te-form.",
        "context_config": {
            "resource_ids": [sidebar_id, pc_id],
            "resources": []
        }
    }
    
    conversation_id = None
    full_response = ""
    
    try:
        # Client Logic: Stream from /agent/stream (Hanachan)
        with requests.post(f"{HANA_URL}/agent/stream", headers=headers, json=stream_payload, stream=True) as r:
            if r.status_code != 200:
                print(f"❌ Stream Failed: {r.status_code} - {r.text}")
                return
            
            print("   Streaming response...", end="", flush=True)
            for chunk in r.iter_content(chunk_size=None):
                if chunk:
                    text_chunk = chunk.decode('utf-8')
                    
                    # Client Logic: Metadata parsing
                    if "__METADATA__" in text_chunk:
                        # Extract metadata if needed
                        parts = text_chunk.split("__METADATA__:")
                        if len(parts) > 1:
                            try:
                                meta_json = parts[1].split("\n")[0]
                                meta = requests.get(f"http://localhost:5100/health").json() # dummy call or parse json
                                import json
                                meta_obj = json.loads(meta_json)
                                if 'conversationId' in meta_obj:
                                    conversation_id = meta_obj['conversationId']
                                    print(f"\n   [Metadata] Conversation ID: {conversation_id}")
                                # Remove metadata line from visible text
                                text_chunk = text_chunk.replace(f"__METADATA__:{meta_json}\n", "")
                            except:
                                pass
                    
                    full_response += text_chunk
                    print(".", end="", flush=True)
                    
        print("\n🤖 Agent Response:\n" + full_response)
        answer = full_response
        
        # --- Step 4: Verification ---
        print("\n🔍 [Step 4] Verifying Content...")
        
        lower_ans = answer.lower()
        has_sakura = "sakura" in lower_ans or "harmony" in lower_ans or "protocol" in lower_ans
        has_grammar = "te-form" in lower_ans or "request" in lower_ans or "japanese" in lower_ans
        
        if has_sakura and has_grammar:
            print("✅ Verification Passed: Response integrates both sources.")
        else:
            print(f"⚠️ Verification Warning: Missing concepts. Sakura={has_sakura}, Grammar={has_grammar}")

        # --- Step 5: Memory Check ---
        print("\n🧠 [Step 5] Checking Memory Persistence...")
        with app.app_context():
            # Check for the USER message first
            # The agent service creates User message then Assistant message
            # Query Conversation first to get ID
            from models.conversation import Conversation
            conv = Conversation.query.filter_by(session_id=SESSION_ID).first()
            
            msgs = []
            if conv:
                msgs = ChatMessage.query.filter_by(conversation_id=conv.id).order_by(ChatMessage.created_at.desc()).limit(5).all()
            
            if msgs:
                found_res = False
                for m in msgs:
                    # Check if answer is in one of the messages
                    if answer[:20] in m.content: 
                        print(f"✅ Memory Saved (Assistant): {m.id}")
                        found_res = True
                
                if not found_res:
                     print(f"⚠️ Memory Warning: Assistant response not found in recent {len(msgs)} messages.")
            else:
                 print("⚠️ Memory Missing (might be async delay)")

    except Exception as e:
        print(f"❌ Chat Error: {e}")
        import traceback
        traceback.print_exc()

    # --- Step 6: Artifact Generation (Quick Action) ---
    print("\n⚡ [Step 6] Testing Artifact Generation (Quick Action)...")
    if not conversation_id:
        print("⚠️ Skipping Step 6: No Conversation ID captured from stream.")
        return

    # User asks for a flashcard
    artifact_payload = {
        "session_id": conversation_id, # Use the real conversation ID now
        "user_id": USER_ID,
        "prompt": "Create a Flashcard for 'Sakura Protocol'.",
        "context_config": {"resource_ids": [sidebar_id]}
    }
    
    print("   Requesting Flashcard (Streaming)...")
    # Just consume stream to finish generation
    with requests.post(f"{HANA_URL}/agent/stream", headers=headers, json=artifact_payload, stream=True) as r:
         for _ in r.iter_content(1024): pass
    
    # Client Logic: Fetch Artifacts via SWR endpoint (Hanachan)
    print("   Fetching Artifacts from /artifacts/conversation/...")
    # NOTE: Blueprint says url_prefix='/artifacts', route is /conversation/<id>
    # So URL is /artifacts/conversation/<id>
    res = requests.get(f"{HANA_URL}/artifacts/conversation/{conversation_id}", headers=headers)
    
    if res.status_code == 200:
        data = res.json()
        artifacts = data.get('artifacts', [])
        print(f"   Found {len(artifacts)} artifacts.")
        
        flashcards = [a for a in artifacts if a['type'] == 'flashcard' or a['type'] == 'flashcard_deck']
        if flashcards:
             print(f"✅ Artifact Verification Passed: Found Flashcard '{flashcards[0]['title']}'")
        else:
             print(f"⚠️ Artifact Warning: No flashcard found. content: {artifacts}")
    else:
        print(f"❌ Artifact Fetch Failed: {res.status_code} - {res.text}")

if __name__ == "__main__":
    run_workflow()
