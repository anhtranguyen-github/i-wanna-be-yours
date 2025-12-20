import pytest
from datetime import datetime, timedelta
from modules.priority import PriorityMatrixModule
import mongomock
from flask import Flask
from bson import ObjectId

@pytest.fixture
def mock_priority():
    app = Flask(__name__)
    client = mongomock.MongoClient()
    
    pm = PriorityMatrixModule()
    pm.client = client
    pm.db = client["flaskStudyPlanDB"]
    pm.queue = pm.db["priority_queue"]
    pm.errors = pm.db["error_analysis"]
    pm.mastery = pm.db["user_content_mastery"]
    pm.interactions = pm.db["content_interactions"]
    
    pm.register_routes(app)
    return app, pm

def test_recalculate_matrix(mock_priority):
    app, pm = mock_priority
    client = app.test_client()
    
    user_id = "user123"
    
    # 1. Seed mastery items
    pm.mastery.insert_many([
        {"user_id": user_id, "content_id": "word1", "content_type": "vocabulary", "status": "learning"},
        {"user_id": user_id, "content_id": "word2", "content_type": "vocabulary", "status": "reviewing"}
    ])
    
    # 2. Seed interactions for word1 (High error = RED)
    now = datetime.now()
    pm.interactions.insert_many([
        {"user_id": user_id, "content_id": "word1", "is_correct": False, "timestamp": now - timedelta(hours=i)}
        for i in range(5)
    ])
    
    # 3. Seed interactions for word2 (Zero error = GREEN)
    pm.interactions.insert_many([
        {"user_id": user_id, "content_id": "word2", "is_correct": True, "timestamp": now - timedelta(hours=i)}
        for i in range(5)
    ])
    
    # 4. Trigger recalculate
    res = client.post("/v1/priority-matrix/recalculate", json={"user_id": user_id})
    assert res.status_code == 200
    data = res.get_json()
    
    items = data["items"]
    w1 = next(it for it in items if it["content_id"] == "word1")
    w2 = next(it for it in items if it["content_id"] == "word2")
    
    assert w1["priority"] == "red"
    assert w2["priority"] == "green"
    
    alloc = data["recommended_time_allocation"]
    assert alloc["red"] > alloc["green"]

def test_log_error(mock_priority):
    app, _ = mock_priority
    client = app.test_client()
    
    res = client.post("/v1/priority-matrix/errors", json={
        "user_id": "user123",
        "content_id": "word1",
        "error_type": "knowledge_gap",
        "user_answer": "abc",
        "correct_answer": "xyz"
    })
    
    assert res.status_code == 201
    assert mock_priority[1].errors.count_documents({"user_id": "user123"}) == 1
