import pytest
from datetime import datetime, timedelta
from modules.smart_goals import SmartGoalsModule
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
    mastery.register_routes(app)
    
    # Setup SMART Goals
    smart = SmartGoalsModule()
    smart.client = client
    smart.db = client["flaskStudyPlanDB"]
    smart.goals = smart.db["smart_goals"]
    smart.mastery = mastery.mastery # link them
    smart.register_routes(app)
    
    return app, smart, mastery

def test_create_smart_goal(mock_env):
    app, smart, _ = mock_env
    client = app.test_client()
    
    response = client.post("/v1/smart-goals/", json={
        "user_id": "user123",
        "title": "Learn 50 verbs",
        "measurable_metric": "vocabulary_count",
        "measurable_target": 50,
        "measurable_baseline": 0,
        "time_bound_deadline": "2025-12-31T23:59:59Z",
        "success_criteria": [
            {"description": "Master JLPT N5 verbs"},
            {"description": "Complete 10 quizzes"}
        ]
    })
    
    assert response.status_code == 201
    goal_id = response.get_json()["id"]
    
    doc = smart.goals.find_one({"_id": ObjectId(goal_id)})
    assert doc["title"] == "Learn 50 verbs"
    assert len(doc["success_criteria"]) == 2
    assert isinstance(doc["time_bound_deadline"], datetime)

def test_calculate_progress_vocab(mock_env):
    app, smart, mastery = mock_env
    
    # 1. Seed mastery data
    now = datetime.now()
    mastery.mastery.insert_many([
        {"user_id": "user123", "content_type": "vocabulary", "status": "mastered", "last_reviewed_at": now},
        {"user_id": "user123", "content_type": "vocabulary", "status": "reviewing", "last_reviewed_at": now},
        {"user_id": "user123", "content_type": "vocabulary", "status": "learning", "last_reviewed_at": now}, # won't count
        {"user_id": "user123", "content_type": "kanji", "status": "mastered", "last_reviewed_at": now}    # won't count
    ])
    
    # 2. Create Goal
    goal = {
        "user_id": "user123",
        "measurable_metric": "vocabulary_count",
        "measurable_target": 10,
        "measurable_baseline": 0,
        "created_at": now - timedelta(days=1)
    }
    
    progress = smart.calculate_progress(goal)
    assert progress["current_value"] == 2 # 2 mastered/reviewing vocab
    assert progress["progress_percent"] == 20.0

def test_toggle_criteria(mock_env):
    app, smart, _ = mock_env
    client = app.test_client()
    
    # 1. Create goal
    res = client.post("/v1/smart-goals/", json={
        "user_id": "user123",
        "success_criteria": [{"description": "Step 1"}]
    })
    goal_id = res.get_json()["id"]
    
    goal = smart.goals.find_one({"_id": ObjectId(goal_id)})
    sc_id = str(goal["success_criteria"][0]["id"])
    
    # 2. Toggle
    res = client.post(f"/v1/smart-goals/{goal_id}/criteria/{sc_id}/toggle")
    assert res.status_code == 200
    
    updated_goal = smart.goals.find_one({"_id": ObjectId(goal_id)})
    assert updated_goal["success_criteria"][0]["completed"] is True
