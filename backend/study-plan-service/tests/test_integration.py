import pytest
import mongomock
from flask import Flask
from datetime import datetime, timedelta
from bson import ObjectId

from modules.content_mastery import ContentMasteryModule
from modules.smart_goals import SmartGoalsModule
from modules.okr import OKRModule
from modules.pact import PACTModule
from modules.context import ContextModule
from modules.priority import PriorityMatrixModule
from modules.review_cycles import ReviewCyclesModule

@pytest.fixture
def app_with_all_modules():
    app = Flask(__name__)
    client = mongomock.MongoClient()
    db = client["flaskStudyPlanDB"]
    
    # Init all
    mastery = ContentMasteryModule()
    mastery.client = client
    mastery.db = db
    mastery.mastery = db["user_content_mastery"]
    mastery.interactions = db["content_interactions"]
    mastery.sessions = db["study_sessions"]
    mastery.register_routes(app)
    
    smart = SmartGoalsModule()
    smart.client = client
    smart.db = db
    smart.goals = db["smart_goals"]
    smart.mastery = mastery.mastery
    smart.register_routes(app)
    
    okr = OKRModule(mastery)
    okr.client = client
    okr.db = db
    okr.objectives = db["okr_objectives"]
    okr.register_routes(app)
    
    pact = PACTModule()
    pact.client = client
    pact.db = db
    pact.commitments = db["pact_commitments"]
    pact.actions_log = db["pact_actions_log"]
    pact.progress = db["learner_progress"]
    pact.register_routes(app)
    
    context = ContextModule()
    context.client = client
    context.db = db
    context.checkins = db["context_checkins"]
    context.sessions = db["study_sessions"]
    context.register_routes(app)
    
    priority = PriorityMatrixModule()
    priority.client = client
    priority.db = db
    priority.queue = db["priority_queue"]
    priority.errors = db["error_analysis"]
    priority.mastery = mastery.mastery
    priority.interactions = mastery.interactions
    priority.register_routes(app)
    
    review_cycles = ReviewCyclesModule()
    review_cycles.client = client
    review_cycles.db = db
    review_cycles.reviews = db["review_cycles"]
    review_cycles.sessions = mastery.sessions
    review_cycles.mastery = mastery.mastery
    review_cycles.interactions = mastery.interactions
    review_cycles.commitments = pact.commitments
    review_cycles.queue = priority.queue
    review_cycles.register_routes(app)
    
    return app

def test_full_integration_flow(app_with_all_modules):
    client = app_with_all_modules.test_client()
    user_id = "user123"
    
    # 1. Start learning word (Phase 0)
    client.post("/v1/mastery/vocabulary/shizuka/start", json={"user_id": user_id})
    
    # 2. Create SMART Goal (Phase 1)
    res = client.post("/v1/smart-goals/", json={
        "user_id": user_id,
        "title": "Mastery Goal",
        "measurable_metric": "vocabulary_count",
        "measurable_target": 1,
        "measurable_baseline": 0
    })
    goal_id = res.get_json()["id"]
    
    # 3. Review word as 'mastered' (Phase 0)
    # Actually need to review multiple times to hit mastered status per logic 
    # OR just force status in DB for test simplicity
    client.post("/v1/mastery/review", json={
        "user_id": user_id,
        "content_type": "vocabulary",
        "content_id": "shizuka",
        "is_correct": True,
        "difficulty": "perfect"
    })
    
    # Let's verify progress
    res = client.get(f"/v1/smart-goals/{goal_id}?user_id={user_id}")
    # It might still be 'reviewing' not 'mastered' so current_value might be 1 if reviewing is included
    # check calculate_progress logic: {"status": {"$in": ["mastered", "reviewing"]}}
    assert res.get_json()["current_value"] == 1
    
    # 4. OKR (Phase 2)
    res = client.post("/v1/okr/objectives", json={
        "user_id": user_id,
        "objective": "Vocabulary OKR",
        "key_results": [{"title": "Learn words", "data_source": "vocabulary", "target": 5}]
    })
    okr_id = res.get_json()["id"]
    
    # 5. PACT & Context (Phase 3 & 4)
    client.post("/v1/context/checkin", json={"user_id": user_id, "energy_level": 5})
    client.post("/v1/pact/commitment", json={
        "user_id": user_id,
        "actions": [{"description": "Daily Vocab", "action_id": str(ObjectId())}]
    })
    
    # 6. Review Cycles (Phase 6)
    res = client.post("/v1/reviews/generate", json={"user_id": user_id, "cycle_type": "daily"})
    assert res.status_code == 201
    assert "metrics" in res.get_json()
