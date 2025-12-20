import pytest
from datetime import datetime, timedelta
from modules.content_mastery import calculate_next_srs, ContentMasteryModule
import mongomock
from flask import Flask

# ============================================
# SRS Utility Tests
# ============================================

def test_srs_calculation_correct_easy():
    # current_interval, current_ease, quality, current_stage
    # quality 4: Correct (easy)
    res = calculate_next_srs(1, 2.5, 4, 1)
    assert res["interval_days"] == 1
    assert res["new_stage"] == 2
    assert res["ease_factor"] == 2.5 # 2.5 + (0.1 - (5-4)*(0.08+0.02)) = 2.5 + 0 = 2.5

def test_srs_calculation_correct_perfect():
    res = calculate_next_srs(6, 2.5, 5, 3)
    assert res["interval_days"] == 15 # math.ceil(6 * 2.5)
    assert res["new_stage"] == 4
    assert res["ease_factor"] > 2.5

def test_srs_calculation_incorrect():
    res = calculate_next_srs(15, 2.5, 1, 4)
    assert res["interval_days"] == 1
    assert res["new_stage"] == 1
    assert res["ease_factor"] < 2.5

# ============================================
# Mastery Logic Tests
# ============================================

@pytest.fixture
def mock_mastery():
    app = Flask(__name__)
    # We won't use register_routes here as we're testing the class directly first
    # But we'll mock the database
    module = ContentMasteryModule()
    module.client = mongomock.MongoClient()
    module.db = module.client["flaskStudyPlanDB"]
    module.mastery = module.db["user_content_mastery"]
    module.interactions = module.db["content_interactions"]
    return module

def test_determine_status(mock_mastery):
    # interval, accuracy, streak
    assert mock_mastery.determine_status(1, 0, 0) == "learning"
    assert mock_mastery.determine_status(7, 85, 3) == "reviewing"
    assert mock_mastery.determine_status(25, 95, 5) == "mastered"
    assert mock_mastery.determine_status(150, 95, 10) == "burned"

def test_start_learning(mock_mastery):
    # Mocking the Flask app to test routes
    app = Flask(__name__)
    mock_mastery.register_routes(app)
    client = app.test_client()
    
    response = client.post("/v1/mastery/vocabulary/test_word/start", json={
        "user_id": "user123"
    })
    
    assert response.status_code == 201
    assert mock_mastery.mastery.count_documents({"user_id": "user123"}) == 1
    
    doc = mock_mastery.mastery.find_one({"user_id": "user123"})
    assert doc["status"] == "learning"
    assert doc["content_id"] == "test_word"

def test_log_review(mock_mastery):
    app = Flask(__name__)
    mock_mastery.register_routes(app)
    client = app.test_client()
    
    # 1. Start learning
    client.post("/v1/mastery/vocabulary/test_word/start", json={"user_id": "user123"})
    
    # 2. Log correct review
    response = client.post("/v1/mastery/review", json={
        "user_id": "user123",
        "content_type": "vocabulary",
        "content_id": "test_word",
        "is_correct": True,
        "difficulty": "easy"
    })
    
    assert response.status_code == 200
    data = response.get_json()
    assert "status" in data
    
    doc = mock_mastery.mastery.find_one({"user_id": "user123"})
    assert doc["stats"]["correct_count"] == 1
    assert doc["stats"]["total_reviews"] == 1
    assert doc["srs"]["correct_streak"] == 1
    
    # 3. Log interaction was created
    assert mock_mastery.interactions.count_documents({"user_id": "user123"}) == 1

def test_get_stats(mock_mastery):
    app = Flask(__name__)
    mock_mastery.register_routes(app)
    client = app.test_client()
    
    # Add some records
    mock_mastery.mastery.insert_many([
        {"user_id": "user123", "status": "learning", "stats": {"accuracy_percent": 50}},
        {"user_id": "user123", "status": "reviewing", "stats": {"accuracy_percent": 80}},
        {"user_id": "user123", "status": "reviewing", "stats": {"accuracy_percent": 90}}
    ])
    
    response = client.get("/v1/mastery/stats?user_id=user123")
    assert response.status_code == 200
    data = response.get_json()
    
    # data is list of groups: [{"_id": "learning", "count": 1, ...}, ...]
    learning_group = next(g for g in data if g["_id"] == "learning")
    reviewing_group = next(g for g in data if g["_id"] == "reviewing")
    
    assert learning_group["count"] == 1
    assert reviewing_group["count"] == 2
    assert reviewing_group["avg_accuracy"] == 85.0
