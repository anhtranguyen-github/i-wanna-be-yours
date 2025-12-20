"""
Learner Progress Module

This module tracks comprehensive learner progress across all learning activities:
- Flashcard reviews (SRS)
- Quiz performance
- Study session time
- Vocabulary/Kanji/Grammar mastery
- Achievements and streaks

API Prefix: /v1/learner/
"""

import logging
from flask import request, jsonify
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Any

# ============================================
# Constants
# ============================================

ACTIVITY_TYPES = [
    "flashcard_review",
    "quiz_completed",
    "grammar_lesson",
    "reading_session",
    "listening_session",
    "milestone_completed"
]

JLPT_LEVELS = ["N5", "N4", "N3", "N2", "N1"]

CATEGORIES = ["vocabulary", "kanji", "grammar", "reading", "listening"]

ACHIEVEMENT_DEFINITIONS = {
    "first_flashcard": {"name": "First Card", "description": "Complete your first flashcard review", "icon": "🎴"},
    "streak_3": {"name": "On Fire", "description": "3-day study streak", "icon": "🔥"},
    "streak_7": {"name": "Week Warrior", "description": "7-day study streak", "icon": "⚔️"},
    "streak_30": {"name": "Monthly Master", "description": "30-day study streak", "icon": "👑"},
    "vocab_100": {"name": "Word Collector", "description": "Master 100 vocabulary words", "icon": "📚"},
    "vocab_500": {"name": "Vocabulary Virtuoso", "description": "Master 500 vocabulary words", "icon": "📖"},
    "kanji_50": {"name": "Kanji Beginner", "description": "Master 50 kanji characters", "icon": "✍️"},
    "kanji_200": {"name": "Kanji Expert", "description": "Master 200 kanji characters", "icon": "🏆"},
    "grammar_50": {"name": "Grammar Guru", "description": "Learn 50 grammar points", "icon": "📝"},
    "quiz_perfect": {"name": "Perfect Score", "description": "Get 100% on a quiz", "icon": "💯"},
    "quiz_10": {"name": "Quiz Taker", "description": "Complete 10 quizzes", "icon": "📋"},
    "study_hour": {"name": "Dedicated Learner", "description": "Study for 1 hour total", "icon": "⏰"},
    "study_10_hours": {"name": "Serious Student", "description": "Study for 10 hours total", "icon": "📅"},
}


# ============================================
# Learner Progress Module Class
# ============================================

class LearnerProgressModule:
    """
    Manages comprehensive learner progress tracking and analytics.
    """

    def __init__(self):
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s %(levelname)s %(name)s : %(message)s",
        )
        self.logger = logging.getLogger(__name__)

        # MongoDB connections
        self.mongo_client = MongoClient("mongodb://localhost:27017/")
        self.db = self.mongo_client["flaskStudyPlanDB"]

        # Collections
        self.progress_collection = self.db["learner_progress"]
        self.activities_collection = self.db["learning_activities"]
        self.achievements_collection = self.db["user_achievements"]
        self.sessions_collection = self.db["study_sessions"]

        # Create indexes
        self._create_indexes()

    def _create_indexes(self):
        """Create MongoDB indexes for efficient queries."""
        try:
            # Progress collection
            self.progress_collection.create_index([("user_id", 1)], unique=True)

            # Activities collection
            self.activities_collection.create_index([("user_id", 1), ("timestamp", -1)])
            self.activities_collection.create_index([("activity_type", 1)])

            # Achievements collection
            self.achievements_collection.create_index([("user_id", 1), ("achievement_id", 1)], unique=True)

            # Sessions collection
            self.sessions_collection.create_index([("user_id", 1), ("date", -1)])

            self.logger.info("Learner progress indexes created")
        except Exception as e:
            self.logger.error(f"Error creating indexes: {e}")

    # ============================================
    # Progress Management
    # ============================================

    def get_or_create_progress(self, user_id: str) -> Dict:
        """Get existing progress or create new record for user."""
        progress = self.progress_collection.find_one({"user_id": user_id})

        if not progress:
            progress = {
                "user_id": user_id,
                "vocabulary_mastered": 0,
                "kanji_mastered": 0,
                "grammar_points_learned": 0,
                "total_study_time_minutes": 0,
                "current_streak": 0,
                "longest_streak": 0,
                "level_scores": {level: {"vocabulary": 0, "kanji": 0, "grammar": 0} for level in JLPT_LEVELS},
                "weekly_goals": {
                    "flashcard_reviews": {"target": 100, "current": 0},
                    "quizzes_completed": {"target": 5, "current": 0},
                    "study_minutes": {"target": 150, "current": 0}
                },
                "last_activity_date": None,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
            self.progress_collection.insert_one(progress)
            progress = self.progress_collection.find_one({"user_id": user_id})

        return self._serialize(progress)

    def get_progress_summary(self, user_id: str) -> Dict:
        """Get comprehensive progress summary for user."""
        progress = self.get_or_create_progress(user_id)

        # Get recent activities
        recent_activities = list(self.activities_collection.find(
            {"user_id": user_id}
        ).sort("timestamp", -1).limit(10))

        # Get achievements
        achievements = list(self.achievements_collection.find({"user_id": user_id}))

        # Calculate weekly stats
        week_start = datetime.now(timezone.utc) - timedelta(days=7)
        weekly_activities = list(self.activities_collection.find({
            "user_id": user_id,
            "timestamp": {"$gte": week_start}
        }))

        weekly_stats = self._calculate_weekly_stats(weekly_activities)

        return {
            "progress": progress,
            "recent_activities": [self._serialize(a) for a in recent_activities],
            "achievements": [self._serialize(a) for a in achievements],
            "achievements_count": len(achievements),
            "total_achievements_available": len(ACHIEVEMENT_DEFINITIONS),
            "weekly_stats": weekly_stats
        }

    def _calculate_weekly_stats(self, activities: List[Dict]) -> Dict:
        """Calculate statistics for the past week."""
        stats = {
            "flashcard_reviews": 0,
            "quizzes_completed": 0,
            "avg_quiz_score": 0,
            "study_minutes": 0,
            "days_active": set()
        }

        quiz_scores = []

        for activity in activities:
            atype = activity.get("activity_type")
            if atype == "flashcard_review":
                stats["flashcard_reviews"] += activity.get("count", 1)
            elif atype == "quiz_completed":
                stats["quizzes_completed"] += 1
                if activity.get("score"):
                    quiz_scores.append(activity["score"])
            
            stats["study_minutes"] += activity.get("duration_minutes", 0)
            
            # Track unique days
            if activity.get("timestamp"):
                stats["days_active"].add(activity["timestamp"].date())

        stats["avg_quiz_score"] = round(sum(quiz_scores) / len(quiz_scores), 1) if quiz_scores else 0
        stats["days_active"] = len(stats["days_active"])

        return stats

    # ============================================
    # Activity Logging
    # ============================================

    def log_activity(self, user_id: str, activity_type: str, data: Dict) -> Dict:
        """
        Log a learning activity and update progress.

        Args:
            user_id: User identifier
            activity_type: Type of activity (flashcard_review, quiz_completed, etc.)
            data: Activity-specific data (count, score, category, etc.)

        Returns:
            Updated progress and any new achievements
        """
        if activity_type not in ACTIVITY_TYPES:
            raise ValueError(f"Invalid activity type: {activity_type}")

        # Create activity record
        activity = {
            "user_id": user_id,
            "activity_type": activity_type,
            "timestamp": datetime.now(timezone.utc),
            **data
        }

        self.activities_collection.insert_one(activity)

        # Update progress based on activity type
        updates = self._calculate_progress_updates(activity_type, data)
        
        # Update streak
        streak_update = self._update_streak(user_id)
        updates.update(streak_update)

        # Apply updates
        self.progress_collection.update_one(
            {"user_id": user_id},
            {
                "$inc": updates.get("$inc", {}),
                "$set": {
                    "updated_at": datetime.now(timezone.utc),
                    "last_activity_date": datetime.now(timezone.utc),
                    **updates.get("$set", {})
                }
            },
            upsert=True
        )

        # Check for new achievements
        new_achievements = self._check_achievements(user_id)

        return {
            "activity_logged": True,
            "activity_id": str(activity.get("_id", "")),
            "new_achievements": new_achievements,
            "streak": streak_update.get("$set", {}).get("current_streak", 0)
        }

    def _calculate_progress_updates(self, activity_type: str, data: Dict) -> Dict:
        """Calculate progress field updates based on activity."""
        updates = {"$inc": {}, "$set": {}}

        if activity_type == "flashcard_review":
            count = data.get("count", 1)
            updates["$inc"]["weekly_goals.flashcard_reviews.current"] = count
            
            # If marked as mastered
            if data.get("mastered_count"):
                category = data.get("category", "vocabulary")
                if category == "vocabulary":
                    updates["$inc"]["vocabulary_mastered"] = data["mastered_count"]
                elif category == "kanji":
                    updates["$inc"]["kanji_mastered"] = data["mastered_count"]

        elif activity_type == "quiz_completed":
            updates["$inc"]["weekly_goals.quizzes_completed.current"] = 1
            
            # Update level scores if provided
            level = data.get("level")
            category = data.get("category")
            score = data.get("score", 0)
            
            if level and category and level in JLPT_LEVELS and category in CATEGORIES:
                # Update running average (simplified - just use latest score)
                updates["$set"][f"level_scores.{level}.{category}"] = score

        elif activity_type == "grammar_lesson":
            updates["$inc"]["grammar_points_learned"] = 1

        # Add study time if provided
        if data.get("duration_minutes"):
            updates["$inc"]["total_study_time_minutes"] = data["duration_minutes"]
            updates["$inc"]["weekly_goals.study_minutes.current"] = data["duration_minutes"]

        return updates

    def _update_streak(self, user_id: str) -> Dict:
        """Update user's study streak."""
        progress = self.progress_collection.find_one({"user_id": user_id})
        
        today = datetime.now(timezone.utc).date()
        updates = {"$set": {}}

        if progress:
            last_activity = progress.get("last_activity_date")
            current_streak = progress.get("current_streak", 0)
            longest_streak = progress.get("longest_streak", 0)

            if last_activity:
                last_date = last_activity.date() if isinstance(last_activity, datetime) else last_activity
                days_diff = (today - last_date).days

                if days_diff == 0:
                    # Same day, no change
                    pass
                elif days_diff == 1:
                    # Consecutive day
                    current_streak += 1
                else:
                    # Streak broken
                    current_streak = 1

                longest_streak = max(longest_streak, current_streak)
            else:
                current_streak = 1
                longest_streak = 1

            updates["$set"]["current_streak"] = current_streak
            updates["$set"]["longest_streak"] = longest_streak

        return updates

    # ============================================
    # Achievements System
    # ============================================

    def _check_achievements(self, user_id: str) -> List[Dict]:
        """Check and award any newly earned achievements."""
        progress = self.progress_collection.find_one({"user_id": user_id})
        if not progress:
            return []

        existing = set(
            a["achievement_id"] for a in 
            self.achievements_collection.find({"user_id": user_id})
        )

        new_achievements = []

        # Define achievement checks
        checks = [
            ("first_flashcard", progress.get("vocabulary_mastered", 0) >= 1),
            ("vocab_100", progress.get("vocabulary_mastered", 0) >= 100),
            ("vocab_500", progress.get("vocabulary_mastered", 0) >= 500),
            ("kanji_50", progress.get("kanji_mastered", 0) >= 50),
            ("kanji_200", progress.get("kanji_mastered", 0) >= 200),
            ("grammar_50", progress.get("grammar_points_learned", 0) >= 50),
            ("streak_3", progress.get("current_streak", 0) >= 3),
            ("streak_7", progress.get("current_streak", 0) >= 7),
            ("streak_30", progress.get("current_streak", 0) >= 30),
            ("study_hour", progress.get("total_study_time_minutes", 0) >= 60),
            ("study_10_hours", progress.get("total_study_time_minutes", 0) >= 600),
        ]

        # Check quiz-based achievements
        quiz_count = self.activities_collection.count_documents({
            "user_id": user_id,
            "activity_type": "quiz_completed"
        })
        checks.append(("quiz_10", quiz_count >= 10))

        perfect_quiz = self.activities_collection.find_one({
            "user_id": user_id,
            "activity_type": "quiz_completed",
            "score": 100
        })
        checks.append(("quiz_perfect", perfect_quiz is not None))

        for achievement_id, earned in checks:
            if earned and achievement_id not in existing:
                achievement = {
                    "user_id": user_id,
                    "achievement_id": achievement_id,
                    "earned_at": datetime.now(timezone.utc),
                    **ACHIEVEMENT_DEFINITIONS.get(achievement_id, {})
                }
                try:
                    self.achievements_collection.insert_one(achievement)
                    new_achievements.append({
                        "id": achievement_id,
                        **ACHIEVEMENT_DEFINITIONS.get(achievement_id, {})
                    })
                except Exception:
                    pass  # Already exists

        return new_achievements

    def get_achievements(self, user_id: str) -> Dict:
        """Get all achievements for user."""
        earned = list(self.achievements_collection.find({"user_id": user_id}))
        earned_ids = {a["achievement_id"] for a in earned}

        all_achievements = []
        for aid, info in ACHIEVEMENT_DEFINITIONS.items():
            all_achievements.append({
                "id": aid,
                "earned": aid in earned_ids,
                "earned_at": next((a["earned_at"] for a in earned if a["achievement_id"] == aid), None),
                **info
            })

        return {
            "achievements": all_achievements,
            "earned_count": len(earned_ids),
            "total_count": len(ACHIEVEMENT_DEFINITIONS)
        }

    # ============================================
    # Statistics & Analytics
    # ============================================

    def get_detailed_stats(self, user_id: str, days: int = 30) -> Dict:
        """Get detailed learning statistics for the specified period."""
        start_date = datetime.now(timezone.utc) - timedelta(days=days)

        activities = list(self.activities_collection.find({
            "user_id": user_id,
            "timestamp": {"$gte": start_date}
        }).sort("timestamp", 1))

        # Aggregate by day
        daily_stats = {}
        for activity in activities:
            day = activity["timestamp"].strftime("%Y-%m-%d")
            if day not in daily_stats:
                daily_stats[day] = {
                    "flashcard_reviews": 0,
                    "quizzes": 0,
                    "quiz_avg_score": [],
                    "study_minutes": 0
                }

            atype = activity.get("activity_type")
            if atype == "flashcard_review":
                daily_stats[day]["flashcard_reviews"] += activity.get("count", 1)
            elif atype == "quiz_completed":
                daily_stats[day]["quizzes"] += 1
                if activity.get("score"):
                    daily_stats[day]["quiz_avg_score"].append(activity["score"])
            
            daily_stats[day]["study_minutes"] += activity.get("duration_minutes", 0)

        # Calculate averages
        for day in daily_stats:
            scores = daily_stats[day]["quiz_avg_score"]
            daily_stats[day]["quiz_avg_score"] = round(sum(scores) / len(scores), 1) if scores else 0

        # Level breakdown
        progress = self.progress_collection.find_one({"user_id": user_id})
        level_scores = progress.get("level_scores", {}) if progress else {}

        return {
            "period_days": days,
            "daily_breakdown": daily_stats,
            "level_scores": level_scores,
            "total_activities": len(activities)
        }

    # ============================================
    # Study Sessions
    # ============================================

    def start_session(self, user_id: str, focus_area: str = "general") -> Dict:
        """Start a new study session."""
        session = {
            "user_id": user_id,
            "focus_area": focus_area,
            "started_at": datetime.now(timezone.utc),
            "ended_at": None,
            "duration_minutes": 0,
            "activities": []
        }

        result = self.sessions_collection.insert_one(session)
        return {
            "session_id": str(result.inserted_id),
            "started_at": session["started_at"].isoformat()
        }

    def end_session(self, session_id: str) -> Dict:
        """End a study session and log total time."""
        session = self.sessions_collection.find_one({"_id": ObjectId(session_id)})
        if not session:
            return {"error": "Session not found"}

        ended_at = datetime.now(timezone.utc)
        duration = (ended_at - session["started_at"]).total_seconds() / 60

        self.sessions_collection.update_one(
            {"_id": ObjectId(session_id)},
            {
                "$set": {
                    "ended_at": ended_at,
                    "duration_minutes": round(duration, 1)
                }
            }
        )

        # Log as activity
        self.log_activity(
            session["user_id"],
            "flashcard_review",
            {"duration_minutes": round(duration, 1)}
        )

        return {
            "session_id": session_id,
            "duration_minutes": round(duration, 1),
            "ended_at": ended_at.isoformat()
        }

    # ============================================
    # Utility Methods
    # ============================================

    def _serialize(self, doc: Dict) -> Dict:
        """Convert MongoDB document to JSON-serializable format."""
        if doc is None:
            return None
        
        result = {}
        for key, value in doc.items():
            if key == "_id":
                result["id"] = str(value)
            elif isinstance(value, ObjectId):
                result[key] = str(value)
            elif isinstance(value, datetime):
                result[key] = value.isoformat()
            else:
                result[key] = value
        return result

    def reset_weekly_goals(self, user_id: str) -> Dict:
        """Reset weekly goals (called at start of each week)."""
        self.progress_collection.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "weekly_goals.flashcard_reviews.current": 0,
                    "weekly_goals.quizzes_completed.current": 0,
                    "weekly_goals.study_minutes.current": 0,
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )
        return {"message": "Weekly goals reset"}

    # ============================================
    # Flask Route Registration
    # ============================================

    def register_routes(self, app):
        """Register learner progress routes with Flask app."""

        @app.route("/v1/learner/progress/<user_id>", methods=["GET"])
        def get_learner_progress(user_id):
            """Get user's progress summary."""
            try:
                result = self.get_progress_summary(user_id)
                return jsonify(result), 200
            except Exception as e:
                self.logger.error(f"Error getting progress: {e}")
                return jsonify({"error": str(e)}), 500

        @app.route("/v1/learner/activity", methods=["POST"])
        def log_learner_activity():
            """Log a learning activity."""
            try:
                data = request.get_json()
                user_id = data.get("user_id")
                activity_type = data.get("activity_type")
                activity_data = data.get("data", {})

                if not user_id or not activity_type:
                    return jsonify({"error": "user_id and activity_type required"}), 400

                result = self.log_activity(user_id, activity_type, activity_data)
                return jsonify(result), 200
            except ValueError as e:
                return jsonify({"error": str(e)}), 400
            except Exception as e:
                self.logger.error(f"Error logging activity: {e}")
                return jsonify({"error": str(e)}), 500

        @app.route("/v1/learner/stats/<user_id>", methods=["GET"])
        def get_learner_stats(user_id):
            """Get detailed stats for user."""
            try:
                days = request.args.get("days", 30, type=int)
                result = self.get_detailed_stats(user_id, days)
                return jsonify(result), 200
            except Exception as e:
                self.logger.error(f"Error getting stats: {e}")
                return jsonify({"error": str(e)}), 500

        @app.route("/v1/learner/achievements/<user_id>", methods=["GET"])
        def get_learner_achievements(user_id):
            """Get user's achievements."""
            try:
                result = self.get_achievements(user_id)
                return jsonify(result), 200
            except Exception as e:
                self.logger.error(f"Error getting achievements: {e}")
                return jsonify({"error": str(e)}), 500

        @app.route("/v1/learner/session/start", methods=["POST"])
        def start_learner_session():
            """Start a study session."""
            try:
                data = request.get_json()
                user_id = data.get("user_id")
                focus_area = data.get("focus_area", "general")

                if not user_id:
                    return jsonify({"error": "user_id required"}), 400

                result = self.start_session(user_id, focus_area)
                return jsonify(result), 200
            except Exception as e:
                self.logger.error(f"Error starting session: {e}")
                return jsonify({"error": str(e)}), 500

        @app.route("/v1/learner/session/<session_id>/end", methods=["POST"])
        def end_learner_session(session_id):
            """End a study session."""
            try:
                result = self.end_session(session_id)
                return jsonify(result), 200
            except Exception as e:
                self.logger.error(f"Error ending session: {e}")
                return jsonify({"error": str(e)}), 500

        self.logger.info("Learner Progress routes registered")

