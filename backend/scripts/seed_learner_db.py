import os
import random
from pymongo import MongoClient
from datetime import datetime, timedelta, timezone

# Configuration
MONGO_URI = os.getenv("MONGO_URI_FLASK", "mongodb://localhost:27017/")
DB_NAME = "flaskStudyPlanDB"
TEST_USER_ID = "test_user_001"

def seed_learner_data():
    print(f"🌱 Seeding real learner data for {TEST_USER_ID}...")
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    
    # Collections
    progress_col = db["learner_progress"]
    activities_col = db["learning_activities"]
    achievements_col = db["user_achievements"]

    # 1. Clear existing data for this user
    progress_col.delete_one({"user_id": TEST_USER_ID})
    activities_col.delete_many({"user_id": TEST_USER_ID})
    achievements_col.delete_many({"user_id": TEST_USER_ID})

    # 2. Create Progress Record
    progress = {
        "user_id": TEST_USER_ID,
        "vocabulary_mastered": 142,
        "kanji_mastered": 85,
        "grammar_points_learned": 34,
        "total_study_time_minutes": 1240,
        "current_streak": 12,
        "longest_streak": 45,
        "level_scores": {
            "N5": {"vocabulary": 95, "kanji": 92, "grammar": 88},
            "N4": {"vocabulary": 78, "kanji": 65, "grammar": 70},
            "N3": {"vocabulary": 15, "kanji": 10, "grammar": 5},
            "N2": {"vocabulary": 0, "kanji": 0, "grammar": 0},
            "N1": {"vocabulary": 0, "kanji": 0, "grammar": 0}
        },
        "weekly_goals": {
            "flashcard_reviews": {"target": 500, "current": 320},
            "quizzes_completed": {"target": 10, "current": 7},
            "study_minutes": {"target": 300, "current": 180}
        },
        "last_activity_date": datetime.now(timezone.utc),
        "created_at": datetime.now(timezone.utc) - timedelta(days=60),
        "updated_at": datetime.now(timezone.utc)
    }
    progress_col.insert_one(progress)

    # 3. Create Recent Activities
    activities = []
    for i in range(20):
        type_choice = random.choice(["flashcard_review", "quiz_completed", "grammar_lesson"])
        activity = {
            "user_id": TEST_USER_ID,
            "activity_type": type_choice,
            "timestamp": datetime.now(timezone.utc) - timedelta(days=random.randint(0, 14), hours=random.randint(0, 23)),
            "data": {
                "count": random.randint(10, 50),
                "score": random.randint(70, 100),
                "category": random.choice(["vocabulary", "kanji", "grammar"]),
                "duration_minutes": random.randint(5, 45)
            }
        }
        activities.append(activity)
    activities_col.insert_many(activities)

    # 4. Create Achievements
    achievements = [
        {"user_id": TEST_USER_ID, "achievement_id": "streak_7", "name": "Week Warrior", "earned_at": datetime.now(timezone.utc) - timedelta(days=5)},
        {"user_id": TEST_USER_ID, "achievement_id": "vocab_100", "name": "Word Collector", "earned_at": datetime.now(timezone.utc) - timedelta(days=10)},
        {"user_id": TEST_USER_ID, "achievement_id": "first_flashcard", "name": "First Card", "earned_at": datetime.now(timezone.utc) - timedelta(days=59)},
    ]
    achievements_col.insert_many(achievements)

    print(f"✅ Seeding complete. User {TEST_USER_ID} is now a 'real' student with a 12-day streak.")

    # 5. Seed Hanachan Semantic Memory (Vector DB)
    from backend.hanachan.services.memory import MemoryService
    memory_svc = MemoryService()
    print(f"🧠 Seeding semantic facts for {TEST_USER_ID}...")
    
    facts = [
        "User is preparing for JLPT N3 exam (planned for July).",
        "User finds '~koto ga aru' syntax confusing but is working on it.",
        "User prefers short 15-minute study sessions in the morning.",
        "User is interested in business-level Japanese vocabulary."
    ]
    
    for fact in facts:
        memory_svc.add_semantic_fact(user_id=TEST_USER_ID, fact=fact, category="preferences")
    
    print("✅ Vector memory seeded.")

if __name__ == "__main__":
    seed_learner_data()
