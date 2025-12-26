import pytest
from datetime import datetime, timedelta
from modules.okr import OKRModule
from modules.content_mastery import ContentMasteryModule
import mongomock
from flask import Flask
from bson import ObjectId

@pytest.fixture
def mock_env():
    app = Flask(__name__)
    client = mongomock.MongoClient()
    
    # Setup Content Mastery
    mastery = ContentMasteryModule()
    mastery.client = client
    mastery.db = client["flaskStudyPlanDB"]
    mastery.mastery = mastery.db["user_content_mastery"]
    mastery.interactions = mastery.db["content_interactions"]
    mastery.sessions = mastery.db["study_sessions"]
    mastery.register_routes(app)
    
    # Setup OKR
    okr = OKRModule(mastery, client=client)
    # Re-assigning collections just in case, though constructor now handles it
    okr.objectives = okr.db["okr_objectives"]
    okr.register_routes(app)
    
    return app, okr, mastery

def test_create_okr(mock_env):
    app, okr, mastery = mock_env
    client = app.test_client()
    
    # Seed data for initial KR calculation
    mastery.mastery.insert_many([
        {"user_id": "user123", "content_type": "vocabulary", "content_id": f"word_{i}", "status": "mastered"}
        for i in range(10)
    ])
    
    response = client.post("/v1/okr/objectives", json={
        "user_id": "user123",
        "objective": "JLPT N3 Mastery",
        "deadline": "2026-03-01T00:00:00Z",
        "key_results": [
            {
                "title": "Master 500 words",
                "data_source": "vocabulary",
                "target": 500,
                "unit": "words"
            }
        ]
    })
    
    assert response.status_code == 201
    okr_id = response.get_json()["id"]
    
    doc = okr.objectives.find_one({"_id": ObjectId(okr_id)})
    kr = doc["key_results"][0]
    assert kr["current"] == 10
    assert kr["progress_percent"] == 2.0 # 10/500

def test_okr_refresh_velocity(mock_env):
    app, okr, mastery = mock_env
    client = app.test_client()
    
    now = datetime.now()
    
    # 1. Create OKR with some history
    okr_id = ObjectId()
    initial_kr = {
        "id": ObjectId(),
        "title": "Words",
        "data_source": "vocabulary",
        "target": 100,
        "current": 10,
        "history": [
            {"date": now - timedelta(days=5), "value": 0},
            {"date": now - timedelta(days=1), "value": 10}
        ]
    }
    
    okr.objectives.insert_one({
        "_id": okr_id,
        "user_id": "user123",
        "objective": "Test",
        "key_results": [initial_kr],
        "created_at": now - timedelta(days=10),
        "deadline": now + timedelta(days=30)
    })
    
    # 2. Update mastery to see progress
    mastery.mastery.insert_many([
        {"user_id": "user123", "content_type": "vocabulary", "content_id": f"new_word_{i}", "status": "mastered"}
        for i in range(20)
    ])
    
    # 3. Refresh
    res = client.post(f"/v1/okr/objectives/{str(okr_id)}/refresh")
    assert res.status_code == 200
    
    doc = okr.objectives.find_one({"_id": okr_id})
    kr = doc["key_results"][0]
    
    assert kr["current"] > 10
    assert kr["velocity"] > 0
    assert kr["projected_completion"] is not None

def test_okr_risk_assessment(mock_env):
    _, okr, _ = mock_env
    
    now = datetime.now()
    created = now - timedelta(days=10)
    deadline = now + timedelta(days=10) # 20 days total, 50% time passed
    
    # Low risk: 50% progress at 50% time
    assert okr.assess_risk({
        "created_at": created,
        "deadline": deadline,
        "progress_percent": 50
    }) == "low"
    
    # Medium risk: 35% progress at 50% time (gap 15)
    assert okr.assess_risk({
        "created_at": created,
        "deadline": deadline,
        "progress_percent": 35
    }) == "medium"
    
    # High risk: 20% progress at 50% time (gap 30)
    assert okr.assess_risk({
        "created_at": created,
        "deadline": deadline,
        "progress_percent": 20
    }) == "high"
