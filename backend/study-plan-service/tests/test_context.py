import pytest
from datetime import datetime
from modules.context import ContextModule
import mongomock
from flask import Flask
from bson import ObjectId

@pytest.fixture
def mock_context():
    app = Flask(__name__)
    client = mongomock.MongoClient()
    
    ctx = ContextModule()
    ctx.client = client
    ctx.db = client["flaskStudyPlanDB"]
    ctx.checkins = ctx.db["context_checkins"]
    ctx.sessions = ctx.db["study_sessions"]
    
    ctx.register_routes(app)
    return app, ctx

def test_submit_checkin(mock_context):
    app, ctx = mock_context
    client = app.test_client()
    
    # Low energy checkin
    response = client.post("/v1/context/checkin", json={
        "user_id": "user123",
        "sleep_quality": "poor",
        "energy_level": 2,
        "mood": "unmotivated",
        "stress_level": "high"
    })
    
    assert response.status_code == 201
    data = response.get_json()
    assert data["ai_session_recommendation"]["session_type"] == "review"
    
    # High energy checkin
    response = client.post("/v1/context/checkin", json={
        "user_id": "user123",
        "sleep_quality": "excellent",
        "energy_level": 9,
        "mood": "energized",
        "stress_level": "low"
    })
    
    assert response.status_code == 201
    data = response.get_json()
    assert data["ai_session_recommendation"]["session_type"] == "challenge"

def test_link_session(mock_context):
    app, ctx = mock_context
    client = app.test_client()
    
    # 1. Create checkin
    res = client.post("/v1/context/checkin", json={"user_id": "user123", "energy_level": 5})
    checkin_id = res.get_json()["_id"]
    
    # 2. Create session
    session_id = ObjectId()
    ctx.sessions.insert_one({
        "_id": session_id,
        "user_id": "user123",
        "duration_minutes": 30,
        "accuracy_percent": 85
    })
    
    # 3. Link
    res = client.post(f"/v1/context/checkin/{checkin_id}/link-session", json={
        "session_id": str(session_id)
    })
    assert res.status_code == 200
    
    updated = ctx.checkins.find_one({"_id": ObjectId(checkin_id)})
    assert updated["session_id"] == session_id
    assert updated["session_outcome"]["performance_score"] == 85

def test_context_analytics(mock_context):
    app, ctx = mock_context
    client = app.test_client()
    
    # Seed checkins with outcomes
    ctx.checkins.insert_many([
        {"user_id": "user123", "energy_level": 5, "session_id": ObjectId(), "session_outcome": {"performance_score": 70}},
        {"user_id": "user123", "energy_level": 5, "session_id": ObjectId(), "session_outcome": {"performance_score": 80}},
        {"user_id": "user123", "energy_level": 9, "session_id": ObjectId(), "session_outcome": {"performance_score": 95}}
    ])
    
    res = client.get("/v1/context/analytics?user_id=user123")
    assert res.status_code == 200
    data = res.get_json()
    
    # data is [{"_id": energy_lvl, "avg_accuracy": ...}, ...]
    e5 = next(r for r in data if r["_id"] == 5)
    e9 = next(r for r in data if r["_id"] == 9)
    
    assert e5["avg_accuracy"] == 75.0
    assert e9["avg_accuracy"] == 95.0
