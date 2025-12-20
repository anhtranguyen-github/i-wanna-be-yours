import pytest
from datetime import datetime, timedelta, date
from modules.pact import PACTModule
import mongomock
from flask import Flask
from bson import ObjectId

@pytest.fixture
def mock_pact():
    app = Flask(__name__)
    client = mongomock.MongoClient()
    
    pact = PACTModule()
    pact.client = client
    pact.db = client["flaskStudyPlanDB"]
    pact.commitments = pact.db["pact_commitments"]
    pact.actions_log = pact.db["pact_actions_log"]
    pact.progress = pact.db["learner_progress"]
    
    pact.register_routes(app)
    return app, pact

def test_upsert_commitment(mock_pact):
    app, pact = mock_pact
    client = app.test_client()
    
    response = client.post("/v1/pact/commitment", json={
        "user_id": "user123",
        "purpose": "Become fluent",
        "actions": [
            {"description": "Flashcards", "target_minutes": 10},
            {"description": "Reading", "target_minutes": 20}
        ]
    })
    
    assert response.status_code == 201
    doc = pact.commitments.find_one({"user_id": "user123"})
    assert len(doc["actions"]) == 2
    assert doc["streak_current"] == 0

def test_daily_streak_update_success(mock_pact):
    _, pact = mock_pact
    
    user_id = "user123"
    action_item = {"id": ObjectId(), "description": "Study", "is_active": True}
    
    # 1. Create commitment
    pact.commitments.insert_one({
        "user_id": user_id,
        "actions": [action_item],
        "streak_current": 5,
        "streak_longest": 10
    })
    
    # 2. Add log for yesterday (completed)
    yesterday = (datetime.now() - timedelta(days=1)).replace(hour=12, minute=0)
    pact.actions_log.insert_one({
        "user_id": user_id,
        "action_id": action_item["id"],
        "date": datetime.combine(yesterday.date(), datetime.min.time()),
        "completed": True
    })
    
    # 3. Update streak
    pact.update_streak(user_id)
    
    updated = pact.commitments.find_one({"user_id": user_id})
    assert updated["streak_current"] == 6
    
    progress = pact.progress.find_one({"user_id": user_id})
    assert progress["current_streak"] == 6

def test_daily_streak_update_failure(mock_pact):
    _, pact = mock_pact
    
    user_id = "user123"
    action_item = {"id": ObjectId(), "description": "Study", "is_active": True}
    
    pact.commitments.insert_one({
        "user_id": user_id,
        "actions": [action_item],
        "streak_current": 5,
        "streak_longest": 10,
        "streak_history": []
    })
    
    # Yesterday log is missing or completed=False
    pact.update_streak(user_id)
    
    updated = pact.commitments.find_one({"user_id": user_id})
    assert updated["streak_current"] == 0
    assert len(updated["streak_history"]) == 1
    assert updated["streak_history"][0]["length"] == 5
