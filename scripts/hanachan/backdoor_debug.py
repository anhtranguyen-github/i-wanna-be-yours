import os
import sys
import json
import logging
import requests
from datetime import datetime

# Add root directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

try:
    from app import create_app
    from models.conversation import Conversation
    from models.message import ChatMessage
    from database.database import db
except ImportError:
    print("❌ Error: Could not import Hanachan models. Run from backend/hanachan directory.")
    sys.exit(1)

# NRS API URL
NRS_URL = os.environ.get("NRS_API_URL", "http://localhost:5300/v1/resources")

def get_conversation_debug(session_id):
    """Peek into the PostgreSQL STM state for a specific session."""
    app = create_app()
    with app.app_context():
        conv = Conversation.query.filter_by(session_id=session_id).first()
        if not conv:
            print(f"❌ Session {session_id} not found in STM.")
            return

        print("\n" + "═"*60)
        print(f"🧠 STM DEBUG: SESSION {session_id}")
        print("═"*60)
        print(f"ID: {conv.id}")
        print(f"Title: {conv.title}")
        print(f"Last Summarized Msg ID: {conv.last_summarized_msg_id}")
        print("-" * 60)
        print(f"CURRENT SUMMARY:\n{conv.summary or '[Empty]'}")
        print("-" * 60)
        
        # Recent Messages
        msgs = ChatMessage.query.filter_by(conversation_id=conv.id).order_by(ChatMessage.created_at.desc()).limit(15).all()
        print(f"RECENT HISTORY (Last 15):")
        for m in reversed(msgs):
            summarized = " [SUMMARIZED]" if conv.last_summarized_msg_id and m.id <= conv.last_summarized_msg_id else " [RAW]"
            attachment_count = len(m.attachments or [])
            att_info = f" (Attachments: {m.attachments})" if attachment_count > 0 else ""
            print(f"[{m.role.upper()}]{summarized} (ID: {m.id}){att_info}: {m.content[:70]}...")
        print("═"*60 + "\n")

def get_nrs_debug(resource_id):
    """Peek into the Neural Resource Service (Mongo/Qdrant)."""
    print("\n" + "🛰️ NRS MICROSERVICE DEBUG " + "🛰️")
    try:
        resp = requests.get(f"{NRS_URL}/{resource_id}")
        if resp.ok:
            data = resp.json()
            print(json.dumps(data, indent=2))
        else:
            print(f"❌ NRS Error: {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"❌ Could not connect to NRS on {NRS_URL}: {e}")

def get_queue_health():
    """Check Redis Queue status."""
    try:
        from services.queue_factory import get_queue
        q = get_queue()
        print(f"\n📥 QUEUE HEALTH (Redis)")
        print(f"Jobs in queue: {q.count}")
        print(f"Started jobs: {len(q.started_job_ids)}")
        print(f"Finished jobs: {len(q.finished_job_registry)}")
        print(f"Failed jobs: {len(q.failed_job_registry)}")
    except Exception as e:
        print(f"❌ Redis Queue error: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python scripts/backdoor_debug.py chat <session_id>")
        print("  python scripts/backdoor_debug.py nrs <resource_id>")
        print("  python scripts/backdoor_debug.py health")
    else:
        cmd = sys.argv[1]
        if cmd == "chat" and len(sys.argv) > 2:
            get_conversation_debug(sys.argv[2])
        elif cmd == "nrs" and len(sys.argv) > 2:
            get_nrs_debug(sys.argv[2])
        elif cmd == "health":
            get_queue_health()
        else:
            print("Invalid command or missing arguments.")
