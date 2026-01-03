import os
import sys
import uuid
import logging
import jwt
import requests
import time
from datetime import datetime, timedelta

# Add root directory to sys.path for internal imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

try:
    from app import create_app, db
    from services.agent_service import AgentService
    from schemas.chat import AgentRequest, ContextConfigurationDTO
    from tasks.summarization import summarize_conversation_task
    from models.conversation import Conversation
    from models.message import ChatMessage
except ImportError as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)

# Configuration
JWT_SECRET = os.environ.get("JWT_SECRET", "your-development-secret-key")
NRS_URL = os.environ.get("NRS_API_URL", "http://localhost:5300/v1/resources")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("Simulation")

def generate_token(user_id):
    payload = {
        "userId": user_id,
        "exp": datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def upload_file(file_path, token):
    if not os.path.exists(file_path):
        print(f"⚠️ File not found: {file_path}")
        return None
    
    with open(file_path, "rb") as f:
        files = {"file": f}
        data = {"auto_ingest": "true", "strategy": "recursive"}
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.post(f"{NRS_URL}/upload", files=files, data=data, headers=headers)
        if resp.ok:
            return resp.json()["id"]
        else:
            print(f"❌ Upload failed: {resp.status_code} - {resp.text}")
            return None

def run_infinite_chat_simulation():
    app = create_app()
    with app.app_context():
        # Setup Simulation environment
        user_id = "sim-tester-qwen"
        session_id = f"sim_{uuid.uuid4().hex[:6]}"
        token = generate_token(user_id)
        os.environ["LTM_ENABLED"] = "False"
        
        print(f"🚀 [START] Full Lifecycle Simulation: {session_id}")
        print(f"🔑 Token generated for: {user_id}")

        # --- STEP 0: Resource Ingestion ---
        print("\n--- 📤 STAGE 0: Resource Ingestion ---")
        doc_a_path = "/mnt/c/Users/tra01/OneDrive/Desktop/Last dance/hanabira.org/2508.14797v1 (2).pdf"
        doc_b_path = "/mnt/c/Users/tra01/OneDrive/Desktop/Last dance/hanabira.org/Building an AI-Integrated Goal Tracker.pdf"
        
        doc_a_id = upload_file(doc_a_path, token)
        doc_b_id = upload_file(doc_b_path, token)
        
        if not doc_a_id or not doc_b_id:
            print("❌ Failed to initialize simulation resources. Exiting.")
            return
            
        print(f"✅ Doc A uploaded: {doc_a_id}")
        print(f"✅ Doc B uploaded: {doc_b_id}")
        print("⏳ Waiting for initial ingestion (5s)...")
        time.sleep(5)

        agent_service = AgentService()

        # --- PHASE 1: Focus on Document A ---
        print("\n--- 🟢 STAGE 1: Analyzing Document A (3 Turns) ---")
        for i in range(1, 4):
            req = AgentRequest(
                session_id=session_id,
                user_id=user_id,
                prompt=f"Explain something about turn {i} from the first PDF.",
                context_config=ContextConfigurationDTO(resource_ids=[doc_a_id]),
                token=token
            )
            full_resp = ""
            for chunk in agent_service.stream_agent(req):
                # agent_service handles the token internally now
                if hasattr(chunk, 'content'): full_resp += chunk.content
                elif isinstance(chunk, str) and not chunk.startswith("__METADATA__"): full_resp += chunk
            print(f"Turn {i}: {full_resp[:50]}...")
            db.session.commit()

        # --- PHASE 2: Stretching Memory ---
        print("\n--- 🟠 STAGE 2: Memory Compression (10 Turns) ---")
        for i in range(1, 11):
            req = AgentRequest(
                session_id=session_id,
                user_id=user_id,
                prompt=f"Noise {i}: Random Japanese word.",
                token=token
            )
            for _ in agent_service.stream_agent(req): pass
            db.session.commit()
            
            conv = Conversation.query.filter_by(session_id=session_id).first()
            if conv:
                summarize_conversation_task(conv.id)
                print(f"Turn {i+3}: Summary: {len(conv.summary or '')} chars.")

        # --- PHASE 3: Adding Document B ---
        print("\n--- 🔵 STAGE 3: Introduction of Document B (3 Turns) ---")
        for i in range(1, 4):
            req = AgentRequest(
                session_id=session_id,
                user_id=user_id,
                prompt=f"Use the Goal Tracker PDF to explain turn {i}.",
                context_config=ContextConfigurationDTO(resource_ids=[doc_b_id]),
                token=token
            )
            for _ in agent_service.stream_agent(req): pass
            db.session.commit()
            print(f"Turn {i+13}: Goal Tracker active.")

        # --- PHASE 4: Full Multi-Resource Run ---
        print("\n--- 🔥 STAGE 4: Full Integration (10 Turns) ---")
        for i in range(1, 11):
            req = AgentRequest(
                session_id=session_id,
                user_id=user_id,
                prompt=f"Synthesize paper and goal tracker for scenario {i}.",
                context_config=ContextConfigurationDTO(resource_ids=[doc_a_id, doc_b_id]),
                token=token
            )
            for _ in agent_service.stream_agent(req): pass
            db.session.commit()
            
            conv = Conversation.query.filter_by(session_id=session_id).first()
            if conv: summarize_conversation_task(conv.id)
            print(f"Loop Turn {i}")

        # --- AUDIT ---
        db.session.expire_all()
        conv = Conversation.query.filter_by(session_id=session_id).first()
        print("\n" + "="*50)
        print("🧠 FINAL AUDIT REPORT")
        if conv:
            print(f"Session: {session_id}")
            print(f"Message Count: {len(conv.messages)}")
            print(f"Final Summary:\n{conv.summary or '[No summary generated]'}")
        else:
            print(f"❌ Conversation {session_id} not found in database.")
        print("="*50)

if __name__ == "__main__":
    run_infinite_chat_simulation()
