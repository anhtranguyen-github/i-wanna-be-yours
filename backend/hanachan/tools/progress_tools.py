import os
from pymongo import MongoClient
from typing import Dict, Any, Optional

MONGO_URI = os.getenv("MONGO_URI_FLASK", "mongodb://localhost:27017/")
DB_NAME = "flaskStudyPlanDB"

class ProgressService:
    def __init__(self):
        self.client = MongoClient(MONGO_URI)
        self.db = self.client[DB_NAME]
        self.progress_col = self.db["learner_progress"]

    def get_user_stats(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetches real user statistics from the MongoDB Learner Progress collection.
        """
        try:
            progress = self.progress_col.find_one({"user_id": user_id})
            if progress:
                # Basic cleanup for agent consumption
                return {
                    "current_streak": progress.get("current_streak", 0),
                    "total_study_time": progress.get("total_study_time_minutes", 0),
                    "vocabulary_mastered": progress.get("vocabulary_mastered", 0),
                    "kanji_mastered": progress.get("kanji_mastered", 0),
                    "last_active": progress.get("last_activity_date").isoformat() if progress.get("last_activity_date") else "Never"
                }
            return None
        except Exception as e:
            print(f"[ProgressService] Error: {e}")
            return None

# Tool Wrapper
def get_user_stats_tool(user_id: str) -> str:
    svc = ProgressService()
    stats = svc.get_user_stats(user_id)
    if not stats:
        return f"Could not find learning stats for user {user_id}."
    
    return (f"User {user_id} Stats: "
            f"Streak: {stats['current_streak']} days, "
            f"Vocab Mastered: {stats['vocabulary_mastered']}, "
            f"Kanji Mastered: {stats['kanji_mastered']}, "
            f"Total Study Time: {stats['total_study_time']} mins.")
