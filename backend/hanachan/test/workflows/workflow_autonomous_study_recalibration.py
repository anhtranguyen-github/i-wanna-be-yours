
import unittest
import os
import requests
import jwt
import time
import uuid
import json
from datetime import datetime, timedelta
from app import create_app, db
from models.resource import Resource

# ------------------------------------------------------------------------------
# WORKFLOW: Autonomous Study Recalibration
# ------------------------------------------------------------------------------

def run_workflow():
    print("\n🚀 WORKFLOW: Autonomous Study Recalibration")

    # --- Config ---
    FLASK_URL = os.environ.get("FLASK_URL", "http://localhost:5100")
    HANA_URL = os.environ.get("HANA_URL", "http://localhost:5400")
    STUDY_URL = os.environ.get("STUDY_PLAN_SERVICE_URL", "http://localhost:5500")
    JWT_SECRET = os.getenv("JWT_SECRET", "your-development-secret-key")
    
    USER_ID = str(uuid.uuid4())
    SESSION_ID = str(uuid.uuid4())
    print(f"🔑 Test User: {USER_ID}")
    
    token = jwt.encode({
        "id": USER_ID,
        "userId": USER_ID,
        "role": "user",
        "exp": int(time.time()) + 3600
    }, JWT_SECRET, algorithm="HS256")
    headers = {"Authorization": f"Bearer {token}"}
    
    app = create_app()
    with app.app_context():
        db.create_all()

        # --- Step 1: Create Study Plan ---
        print("\n📈 [Step 1] Creating Study Plan in Study Service...")
        plan_payload = {
            "target_level": "N3",
            "exam_date": (datetime.now() + timedelta(days=90)).isoformat() + "Z"
        }
        res = requests.post(f"{STUDY_URL}/v1/study-plan/plans", headers=headers, json=plan_payload)
        if res.status_code not in [200, 201]:
            print(f"❌ Failed to create study plan: {res.status_code} - {res.text}")
            import sys
            sys.exit(1)
        plan_id = res.json().get("id")
        print(f"✅ Study Plan Created: {plan_id}")

        # Create some initial goals
        print("Targeting goals for recalibration...")
        goals_data = [
            {
                "plan_id": plan_id,
                "user_id": USER_ID,
                "title": "Passive Form Grammar",
                "measurable_metric": "grammar_points",
                "measurable_target": 10,
                "priority": 1
            },
            {
                "plan_id": plan_id,
                "user_id": USER_ID,
                "title": "Kanji Level 5-6",
                "measurable_metric": "kanji_count",
                "measurable_target": 50,
                "priority": 1
            }
        ]
        for g in goals_data:
            requests.post(f"{STUDY_URL}/v1/smart-goals/", headers=headers, json=g)

        # --- Step 2: Index Grammar Resource ---
        print("\n📚 [Step 2] Indexing Grammar Resource...")
        content = "Japanese Passive Form: Verb-ru -> Verb-rareru. Used for inanimate subjects or emotional affect."
        resource = Resource(title="Passive Form Guide", type="document", content=content, user_id=USER_ID)
        db.session.add(resource)
        db.session.commit()
        resource_id = str(resource.id)
        
        from tasks.resource import ingest_resource
        ingest_resource(resource_id)
        print(f"✅ Resource Indexed: {resource_id}")

        # --- Step 3: Simulate "Struggle" (Record Poor Performance) ---
        print("\n📉 [Step 3] Simulating 'Struggle' via Performance Audit...")
        # We'll use the API to save a performance tracking entry with low score
        audit_data = {
            "type": "detailed_audit",
            "summary": "User struggled significantly with N3 passive form transformations.",
            "note_quality_score": 3,
            "note_audit_details": "Inconsistent conjugation of ichidan verbs for passive voice transformations.",
            "quantitative_stats": {"correct_answers": 2, "total_questions": 10},
            "user_id": USER_ID
        }
        res = requests.post(f"{STUDY_URL}/v1/performance/trackings", headers=headers, json=audit_data)
        if res.status_code != 201:
            print(f"❌ Failed to save performance audit: {res.text}")
            import sys
            sys.exit(1)
        print("✅ Poor Performance Recorded.")

        # --- Step 4: Agent Interaction ---
        print("\n💬 [Step 4] Asking Agent for Study Advice (Recalibration Trigger)...")
        chat_payload = {
            "prompt": "I'm really struggling with the passive form transformations. I keep getting them wrong. Can you audit my progress and adjust my study plan priorities?",
            "user_id": USER_ID,
            "session_id": SESSION_ID
        }
        res = requests.post(f"{HANA_URL}/agent/invoke", headers=headers, json=chat_payload)
        if res.status_code != 200:
             print(f"❌ Agent error: {res.text}")
             import sys
             sys.exit(1)
             
        agent_out = res.json().get('responses', [{}])[0].get('content', '')
        print(f"🤖 Agent Response: {agent_out[:200]}...")

        # --- Step 5: Verification ---
        print("\n✅ [Step 5] Verifying Recalibration...")
        # Wait a bit for background tasks if any
        time.sleep(2)
        
        # Check if the "Passive Form Grammar" goal now has high priority
        res = requests.get(f"{STUDY_URL}/v1/smart-goals/", headers=headers, params={"user_id": USER_ID})
        goals = res.json()
        passive_goal = next((g for g in goals if g["title"] == "Passive Form Grammar"), None)
        
        if passive_goal and passive_goal.get("priority", 1) > 1:
            print(f"🌟 SUCCESS: Study Agent proactively elevated priority for struggle point! (New Priority: {passive_goal.get('priority')})")
        else:
            print(f"❌ RECALIBRATION FAILED. Goal Priority: {passive_goal.get('priority') if passive_goal else 'Goal Not Found'}")
            import sys
            sys.exit(1)

if __name__ == "__main__":
    run_workflow()
