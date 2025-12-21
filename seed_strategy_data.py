"""
Seeding script for Study Plan Strategic Framework.
Populates MongoDB with realistic data for SMART Goals, OKRs, PACT, and Content Mastery.
"""

import os
from pymongo import MongoClient
from datetime import datetime, timedelta
import random

# MongoDB Connection
MONGO_URI = "mongodb://localhost:27017/"
client = MongoClient(MONGO_URI)
db = client["flaskStudyPlanDB"]

# User ID to seed for
USER_ID = "6762f2771e845c492161cc43"

def seed_content_mastery():
    print("Seeding Content Mastery...")
    collection = db["user_content_mastery"]
    collection.delete_many({"user_id": USER_ID})
    
    items = [
        # Vocabulary - N3
        {"title": "改善 (Kaizen)", "type": "vocabulary", "level": "N3", "status": "mastered", "performance": "high", "last_rating": "easy"},
        {"title": "経済 (Keizai)", "type": "vocabulary", "level": "N3", "status": "mastered", "performance": "perfect", "last_rating": "perfect"},
        {"title": "分析 (Bunseki)", "type": "vocabulary", "level": "N3", "status": "reviewing", "performance": "medium", "last_rating": "medium"},
        {"title": "目標 (Mokuhyou)", "type": "vocabulary", "level": "N3", "status": "mastered", "performance": "high", "last_rating": "easy"},
        {"title": "結果 (Kekka)", "type": "vocabulary", "level": "N3", "status": "reviewing", "performance": "low", "last_rating": "hard"},
        
        # Vocabulary - N5 (Basics)
        {"title": "先生 (Sensei)", "type": "vocabulary", "level": "N5", "status": "mastered", "performance": "perfect", "last_rating": "perfect"},
        {"title": "学校 (Gakkou)", "type": "vocabulary", "level": "N5", "status": "mastered", "performance": "high", "last_rating": "easy"},
        {"title": "学生 (Gakusei)", "type": "vocabulary", "level": "N5", "status": "mastered", "performance": "perfect", "last_rating": "perfect"},
        
        # Grammar - N5
        {"title": "~てもいい", "type": "grammar", "level": "N5", "status": "mastered", "performance": "high", "last_rating": "easy"},
        {"title": "~なくてはいけない", "type": "grammar", "level": "N5", "status": "reviewing", "performance": "medium", "last_rating": "medium"},
        {"title": "~たり~たり", "type": "grammar", "level": "N5", "status": "learning", "performance": "low", "last_rating": "hard"},
        
        # Grammar - N3
        {"title": "~ほど", "type": "grammar", "level": "N3", "status": "learning", "performance": "medium", "last_rating": "medium"},
    ]
    
    seed_data = []
    for item in items:
        seed_data.append({
            "user_id": USER_ID,
            "content_id": f"item_{random.randint(1000, 9999)}",
            "content_type": item["type"],
            "title": item["title"],
            "level": item["level"],
            "status": item["status"],
            "performance": item["performance"],
            "last_rating": item["last_rating"],
            "srs": {
                "next_review_date": datetime.now() + timedelta(days=random.randint(1, 30)),
                "interval_days": random.randint(1, 150),
                "ease_factor": 2.5,
                "stage": 4
            },
            "timestamp": datetime.now()
        })
    
    collection.insert_many(seed_data)
    print(f"Inserted {len(seed_data)} mastery items.")

def seed_smart_goals():
    print("Seeding SMART Goals...")
    collection = db["smart_goals"]
    collection.delete_many({"user_id": USER_ID})
    
    goals = [
        {
            "user_id": USER_ID,
            "title": "Master N3 Vocabulary Core",
            "specific": "Learn and retain 3000 N3-level vocabulary words with 90% recall accuracy",
            "measurable_metric": "vocab_mastered",
            "measurable_target": 3000,
            "measurable_baseline": 0,
            "relevant_jlpt_section": "vocabulary",
            "time_bound_deadline": "2024-07-07T00:00:00Z",
            "status": "active",
            "progress_percent": 41,
            "created_at": datetime.now() - timedelta(days=60)
        },
        {
            "user_id": USER_ID,
            "title": "N3 Grammar Proficiency",
            "specific": "Master 120 N3 grammar patterns with ability to use in context",
            "measurable_metric": "grammar_points",
            "measurable_target": 120,
            "measurable_baseline": 0,
            "relevant_jlpt_section": "grammar",
            "time_bound_deadline": "2024-06-23T00:00:00Z",
            "status": "active",
            "progress_percent": 54,
            "created_at": datetime.now() - timedelta(days=45)
        }
    ]
    
    collection.insert_many(goals)
    print("Inserted SMART Goals.")

def seed_okrs():
    print("Seeding OKRs...")
    collection = db["okr_objectives"]
    collection.delete_many({"user_id": USER_ID})
    
    # Needs to match SMART goal IDs if we were being strict, but for MVP we use objective names
    okrs = [
        {
            "user_id": USER_ID,
            "objective": "Build Unshakeable N3 Vocabulary Foundation",
            "description": "Master the core vocabulary needed to understand 80% of N3-level content",
            "deadline": datetime(2024, 7, 7),
            "on_track": True,
            "risk_level": "low",
            "progress_percent": 65,
            "key_results": [
                {
                    "title": "Master 1500 high-frequency words",
                    "data_source": "vocabulary",
                    "target": 1500,
                    "current": 1240,
                    "unit": "words"
                },
                {
                    "title": "Achieve 85% accuracy on vocab quizzes",
                    "data_source": "quiz_accuracy",
                    "target": 85,
                    "current": 78,
                    "unit": "%"
                }
            ],
            "created_at": datetime.now() - timedelta(days=30)
        }
    ]
    
    collection.insert_many(okrs)
    print("Inserted OKRs.")

def seed_pact():
    print("Seeding PACT...")
    # PACT usually uses separate collections or a single one
    # Assuming 'pact_commitments' from server.py (PACTModule uses pact_commitments and pact_daily_logs)
    db["pact_commitments"].delete_many({"user_id": USER_ID})
    db["pact_daily_logs"].delete_many({"user_id": USER_ID})
    
    commitment = {
        "user_id": USER_ID,
        "purpose": "Become confident in Japanese to work and travel in Japan",
        "actions": [
            {"id": "a1", "description": "Complete daily SRS flashcard reviews", "target_minutes": 15},
            {"id": "a2", "description": "Learn 5 new vocabulary words", "target_minutes": 10}
        ],
        "created_at": datetime.now()
    }
    db["pact_commitments"].insert_one(commitment)
    
    # Seed some logs
    logs = []
    for i in range(14):
        date = datetime.now() - timedelta(days=i)
        logs.append({
            "user_id": USER_ID,
            "date": date.strftime("%Y-%m-%d"),
            "completed_actions": ["a1"] if i % 3 != 0 else ["a1", "a2"],
            "total_minutes": 25 if i % 3 == 0 else 15
        })
    db["pact_daily_logs"].insert_many(logs)
    print("Inserted PACT data.")

if __name__ == "__main__":
    print(f"--- Seeding Data for User: {USER_ID} ---")
    seed_content_mastery()
    seed_smart_goals()
    seed_okrs()
    seed_pact()
    print("--- Seeding Complete ---")
