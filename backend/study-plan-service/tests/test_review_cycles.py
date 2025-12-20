import pytest
from datetime import datetime, timedelta
from modules.review_cycles import ReviewCyclesModule
import mongomock
from flask import Flask
from bson import ObjectId

@pytest.fixture
def mock_review():
    app = Flask(__name__)
    client = mongomock.MongoClient()
    
    rc = ReviewCyclesModule()
    rc.client = client
    rc.db = client["flaskStudyPlanDB"]
    rc.reviews = rc.db["review_cycles"]
    rc.sessions = rc.db["study_sessions"]
    rc.mastery = rc.db["user_content_mastery"]
    rc.interactions = rc.db["content_interactions"]
    rc.commitments = rc.db["pact_commitments"]
    rc.queue = rc.db["priority_queue"]
    
    rc.register_routes(app)
    return app, rc

def test_generate_weekly_review(mock_review):
    app, rc = mock_review
    client = app.test_client()
    
    user_id = "user123"
    now = datetime.now()
    week_start = now - timedelta(days=2)
    
    # 1. Seed sessions
    rc.sessions.insert_many([
        {"user_id": user_id, "duration_minutes": 30, "started_at": week_start + timedelta(hours=1)},
        {"user_id": user_id, "duration_minutes": 45, "started_at": week_start + timedelta(hours=5)}
    ])
    
    # 2. Seed interactions (90% accuracy)
    rc.interactions.insert_many([
        {"user_id": user_id, "is_correct": True, "timestamp": week_start + timedelta(hours=2)} for _ in range(9)
    ] + [
        {"user_id": user_id, "is_correct": False, "timestamp": week_start + timedelta(hours=3)}
    ])
    
    # 3. Seed PACT streak
    rc.commitments.insert_one({"user_id": user_id, "streak_current": 7})
    
    # 4. Generate
    res = client.post("/v1/reviews/generate", json={"user_id": user_id, "cycle_type": "weekly"})
    assert res.status_code == 201
    data = res.get_json()
    
    metrics = data["metrics"]
    assert metrics["total_study_minutes"] == 75
    assert metrics["avg_accuracy"] == 90.0
    assert metrics["streak_maintained"] is True
    
    assert "Kept your study streak alive!" in data["wins"]
    assert "High accuracy maintained!" in data["wins"]

def test_get_latest_review(mock_review):
    app, rc = mock_review
    client = app.test_client()
    
    user_id = "user123"
    now = datetime.now()
    
    rc.reviews.insert_many([
        {"user_id": user_id, "cycle_type": "daily", "period_end": now - timedelta(days=1)},
        {"user_id": user_id, "cycle_type": "daily", "period_end": now}
    ])
    
    res = client.get(f"/v1/reviews/latest?user_id={user_id}&cycle_type=daily")
    assert res.status_code == 200
    data = res.get_json()
    assert data["cycle_type"] == "daily"
    # period_end should be present
    assert "period_end" in data
