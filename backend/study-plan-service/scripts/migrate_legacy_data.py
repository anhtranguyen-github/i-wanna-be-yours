"""
Migration Script: Legacy Flashcards to Content Mastery
Moves data from flaskFlashcardDB.words to flaskStudyPlanDB.user_content_mastery
"""

import sys
import os
from datetime import datetime, timedelta
from pymongo import MongoClient

# Add parent dir to path to import modules if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def map_difficulty_to_status(difficulty):
    return {
        'new': 'new',
        'easy': 'reviewing',
        'medium': 'learning',
        'hard': 'learning'
    }.get(difficulty, 'new')

def difficulty_to_ease(difficulty):
    return {
        'easy': 3.0,
        'medium': 2.5,
        'hard': 2.0
    }.get(difficulty, 2.5)

def run_migration():
    client = MongoClient("mongodb://localhost:27017/")
    legacy_db = client["flaskFlashcardDB"]
    target_db = client["flaskStudyPlanDB"]
    
    legacy_collection = legacy_db["words"]
    mastery_collection = target_db["user_content_mastery"]
    progress_collection = target_db["learner_progress"]
    
    print("🚀 Starting migration from flaskFlashcardDB.words...")
    
    cursor = legacy_collection.find({})
    count = 0
    errors = 0
    
    # Track stats per user for updating learner_progress
    user_stats = {}
    
    for doc in cursor:
        user_id = doc.get("userId") or doc.get("user_id")
        if not user_id: continue
        
        content_id = doc.get("vocabulary_original")
        if not content_id: continue
        
        difficulty = doc.get("difficulty", "new")
        status = map_difficulty_to_status(difficulty)
        
        # Initialize stats for user
        if user_id not in user_stats:
            user_stats[user_id] = {"vocabulary_mastered": 0, "vocabulary_learning": 0}
            
        if status == "mastered": user_stats[user_id]["vocabulary_mastered"] += 1
        elif status in ["learning", "reviewing"]: user_stats[user_id]["vocabulary_learning"] += 1
        
        now = datetime.now()
        
        mastery_doc = {
            "user_id": user_id,
            "content_type": "vocabulary",
            "content_id": content_id,
            "content_source": doc.get("p_tag"),
            "status": status,
            "mastery_level": 100 if status == "mastered" else 20,
            "mastery_stage": 4 if status == "reviewing" else 1,
            "srs": {
                "ease_factor": difficulty_to_ease(difficulty),
                "interval_days": 1,
                "next_review_date": now + timedelta(days=1),
                "review_count": 0,
                "correct_streak": 0,
                "lapse_count": 0
            },
            "stats": {
                "total_reviews": 0,
                "correct_count": 0,
                "incorrect_count": 0,
                "accuracy_percent": 0
            },
            "created_at": now,
            "updated_at": now
        }
        
        try:
            # We use update_one with upsert=True to avoid duplicates
            mastery_collection.update_one(
                {"user_id": user_id, "content_type": "vocabulary", "content_id": content_id},
                {"$setOnInsert": mastery_doc},
                upsert=True
            )
            count += 1
            if count % 100 == 0:
                print(f"✅ Processed {count} items...")
        except Exception as e:
            print(f"❌ Error migrating item {content_id}: {e}")
            errors += 1

    print(f"🏁 Migration complete. {count} items processed. {errors} errors.")
    
    # Update learner_progress aggregations
    print("📊 Updating learner_progress aggregations...")
    for user_id, stats in user_stats.items():
        progress_collection.update_one(
            {"user_id": user_id},
            {"$inc": {
                "vocabulary_mastered": stats["vocabulary_mastered"]
                # Not incrementing learner progress learning count as there's no direct field in schema
            }},
            upsert=True
        )
    print("✅ Progress aggregations updated.")

if __name__ == "__main__":
    run_migration()
