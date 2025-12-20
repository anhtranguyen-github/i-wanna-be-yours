"""
Adaptive Learning Module

This module provides intelligent learning recommendations and adaptive adjustments:
- Analyze learner performance patterns
- Recommend next activities based on weaknesses
- Adjust difficulty levels
- Predict optimal review times

API Prefix: /v1/adaptive/
"""

import logging
from flask import request, jsonify
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Any
import math

# ============================================
# Constants
# ============================================

DIFFICULTY_LEVELS = ["beginner", "elementary", "intermediate", "advanced", "expert"]

JLPT_LEVELS = ["N5", "N4", "N3", "N2", "N1"]

PERFORMANCE_THRESHOLDS = {
    "excellent": 90,
    "good": 75,
    "average": 60,
    "needs_work": 40,
    "struggling": 0
}

# SRS intervals in days
SRS_INTERVALS = [0, 1, 3, 7, 14, 30, 60, 120]


# ============================================
# Adaptive Learning Module Class
# ============================================

class AdaptiveLearningModule:
    """
    Provides intelligent recommendations and adaptive learning features.
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
        self.recommendations_collection = self.db["learning_recommendations"]
        self.difficulty_settings_collection = self.db["difficulty_settings"]

        # Create indexes
        self._create_indexes()

    def _create_indexes(self):
        """Create MongoDB indexes."""
        try:
            self.recommendations_collection.create_index([("user_id", 1), ("created_at", -1)])
            self.difficulty_settings_collection.create_index([("user_id", 1)], unique=True)
            self.logger.info("Adaptive learning indexes created")
        except Exception as e:
            self.logger.error(f"Error creating indexes: {e}")

    # ============================================
    # Performance Analysis
    # ============================================

    def analyze_performance(self, user_id: str, days: int = 14) -> Dict:
        """
        Analyze user's learning performance over the specified period.

        Returns:
            Performance breakdown by category, strengths, weaknesses
        """
        start_date = datetime.now(timezone.utc) - timedelta(days=days)

        # Get recent activities
        activities = list(self.activities_collection.find({
            "user_id": user_id,
            "timestamp": {"$gte": start_date}
        }))

        if not activities:
            return {
                "status": "insufficient_data",
                "message": "Not enough learning data to analyze",
                "recommendations": [
                    {"type": "start_learning", "message": "Start with vocabulary flashcards to build your base"}
                ]
            }

        # Aggregate by category
        category_stats = {}
        for activity in activities:
            category = activity.get("category", "general")
            if category not in category_stats:
                category_stats[category] = {
                    "total_activities": 0,
                    "scores": [],
                    "items_reviewed": 0
                }

            category_stats[category]["total_activities"] += 1
            if activity.get("score"):
                category_stats[category]["scores"].append(activity["score"])
            category_stats[category]["items_reviewed"] += activity.get("count", 1)

        # Calculate averages and identify weak areas
        performance_summary = {}
        weak_areas = []
        strong_areas = []

        for category, stats in category_stats.items():
            if stats["scores"]:
                avg_score = sum(stats["scores"]) / len(stats["scores"])
            else:
                avg_score = None

            performance_summary[category] = {
                "average_score": round(avg_score, 1) if avg_score else None,
                "total_activities": stats["total_activities"],
                "items_reviewed": stats["items_reviewed"],
                "performance_level": self._get_performance_level(avg_score)
            }

            if avg_score:
                if avg_score < PERFORMANCE_THRESHOLDS["average"]:
                    weak_areas.append(category)
                elif avg_score >= PERFORMANCE_THRESHOLDS["good"]:
                    strong_areas.append(category)

        return {
            "status": "analyzed",
            "period_days": days,
            "total_activities": len(activities),
            "by_category": performance_summary,
            "weak_areas": weak_areas,
            "strong_areas": strong_areas
        }

    def _get_performance_level(self, score: Optional[float]) -> str:
        """Determine performance level from score."""
        if score is None:
            return "unknown"
        for level, threshold in PERFORMANCE_THRESHOLDS.items():
            if score >= threshold:
                return level
        return "struggling"

    # ============================================
    # Recommendations Engine
    # ============================================

    def get_recommendations(self, user_id: str) -> Dict:
        """
        Get personalized learning recommendations.

        Returns:
            List of recommended activities with priorities
        """
        # Get performance analysis
        performance = self.analyze_performance(user_id)

        # Get current progress
        progress = self.progress_collection.find_one({"user_id": user_id})

        recommendations = []

        # Check if new user
        if performance.get("status") == "insufficient_data":
            return {
                "recommendations": [
                    {
                        "type": "welcome",
                        "priority": 1,
                        "title": "Welcome! Start Your Journey",
                        "description": "Begin with basic vocabulary flashcards",
                        "action": {"type": "flashcards", "deck": "N5_vocab", "new_cards": 10},
                        "estimated_minutes": 10
                    }
                ],
                "focus_area": "vocabulary",
                "daily_goal_minutes": 15
            }

        # Priority 1: Address weak areas
        for weak_area in performance.get("weak_areas", []):
            recommendations.append({
                "type": "review",
                "priority": 1,
                "title": f"Review {weak_area.capitalize()}",
                "description": f"Your {weak_area} scores need improvement. Focus review recommended.",
                "action": {"type": "quiz", "category": weak_area, "difficulty": "adaptive"},
                "estimated_minutes": 15
            })

        # Priority 2: Daily SRS review
        if progress:
            recommendations.append({
                "type": "daily_review",
                "priority": 2,
                "title": "Daily Flashcard Review",
                "description": "Keep your knowledge fresh with spaced repetition",
                "action": {"type": "flashcards", "mode": "review"},
                "estimated_minutes": 10
            })

        # Priority 3: Learn new content (if not struggling)
        if not performance.get("weak_areas"):
            recommendations.append({
                "type": "new_content",
                "priority": 3,
                "title": "Learn New Material",
                "description": "You're ready for new vocabulary and grammar",
                "action": {"type": "lesson", "category": "vocabulary"},
                "estimated_minutes": 15
            })

        # Priority 4: Practice strong areas to maintain
        for strong_area in performance.get("strong_areas", [])[:1]:
            recommendations.append({
                "type": "maintenance",
                "priority": 4,
                "title": f"Maintain {strong_area.capitalize()} Skills",
                "description": f"Quick practice to keep your {strong_area} sharp",
                "action": {"type": "quick_quiz", "category": strong_area},
                "estimated_minutes": 5
            })

        # Sort by priority
        recommendations.sort(key=lambda x: x["priority"])

        # Determine focus area
        focus_area = "vocabulary"
        if performance.get("weak_areas"):
            focus_area = performance["weak_areas"][0]

        # Calculate recommended daily study time
        daily_goal = self._calculate_daily_goal(user_id, progress)

        return {
            "recommendations": recommendations[:5],
            "focus_area": focus_area,
            "daily_goal_minutes": daily_goal,
            "performance_summary": performance.get("by_category", {})
        }

    def _calculate_daily_goal(self, user_id: str, progress: Optional[Dict]) -> int:
        """Calculate recommended daily study time based on goals and history."""
        if not progress:
            return 15  # Beginner default

        # Check if user has active study plan
        plans_collection = self.db["study_plans"]
        active_plan = plans_collection.find_one({
            "user_id": user_id,
            "status": "active"
        })

        if active_plan:
            return active_plan.get("daily_study_minutes", 30)

        # Base on current streak and progress
        streak = progress.get("current_streak", 0)
        vocab_count = progress.get("vocabulary_mastered", 0)

        if streak < 7:
            return 15  # Build habit first
        elif vocab_count < 500:
            return 20
        elif vocab_count < 1500:
            return 30
        else:
            return 45

    # ============================================
    # Difficulty Adjustment
    # ============================================

    def get_difficulty_settings(self, user_id: str) -> Dict:
        """Get user's current difficulty settings."""
        settings = self.difficulty_settings_collection.find_one({"user_id": user_id})

        if not settings:
            # Create default settings
            settings = {
                "user_id": user_id,
                "global_level": "intermediate",
                "category_levels": {
                    "vocabulary": "intermediate",
                    "kanji": "beginner",
                    "grammar": "intermediate",
                    "reading": "beginner",
                    "listening": "beginner"
                },
                "auto_adjust": True,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
            self.difficulty_settings_collection.insert_one(settings)

        return {
            "global_level": settings.get("global_level", "intermediate"),
            "category_levels": settings.get("category_levels", {}),
            "auto_adjust": settings.get("auto_adjust", True)
        }

    def adjust_difficulty(self, user_id: str, category: str, performance_score: float) -> Dict:
        """
        Adjust difficulty based on recent performance.

        Args:
            user_id: User identifier
            category: Learning category
            performance_score: Recent quiz/review score (0-100)

        Returns:
            New difficulty level and adjustment made
        """
        settings = self.difficulty_settings_collection.find_one({"user_id": user_id})

        if not settings or not settings.get("auto_adjust", True):
            return {"adjusted": False, "reason": "Auto-adjust disabled"}

        current_levels = settings.get("category_levels", {})
        current_level = current_levels.get(category, "intermediate")
        current_idx = DIFFICULTY_LEVELS.index(current_level) if current_level in DIFFICULTY_LEVELS else 2

        # Determine adjustment
        new_idx = current_idx
        adjustment = None

        if performance_score >= PERFORMANCE_THRESHOLDS["excellent"]:
            # Move up if consistently excellent
            recent_scores = self._get_recent_category_scores(user_id, category, days=7)
            if len(recent_scores) >= 3 and all(s >= 85 for s in recent_scores[-3:]):
                new_idx = min(current_idx + 1, len(DIFFICULTY_LEVELS) - 1)
                adjustment = "increased"

        elif performance_score < PERFORMANCE_THRESHOLDS["needs_work"]:
            # Move down if struggling
            new_idx = max(current_idx - 1, 0)
            adjustment = "decreased"

        if adjustment:
            new_level = DIFFICULTY_LEVELS[new_idx]
            self.difficulty_settings_collection.update_one(
                {"user_id": user_id},
                {
                    "$set": {
                        f"category_levels.{category}": new_level,
                        "updated_at": datetime.now(timezone.utc)
                    }
                }
            )

            return {
                "adjusted": True,
                "category": category,
                "previous_level": current_level,
                "new_level": new_level,
                "reason": f"Performance {adjustment} based on score of {performance_score}"
            }

        return {"adjusted": False, "reason": "Performance within expected range"}

    def _get_recent_category_scores(self, user_id: str, category: str, days: int) -> List[float]:
        """Get recent scores for a category."""
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
        activities = self.activities_collection.find({
            "user_id": user_id,
            "category": category,
            "score": {"$exists": True},
            "timestamp": {"$gte": start_date}
        }).sort("timestamp", 1)

        return [a["score"] for a in activities]

    # ============================================
    # Optimal Review Timing
    # ============================================

    def get_optimal_study_time(self, user_id: str) -> Dict:
        """
        Analyze user's activity patterns to suggest optimal study times.
        """
        # Get last 30 days of activity
        start_date = datetime.now(timezone.utc) - timedelta(days=30)
        activities = list(self.activities_collection.find({
            "user_id": user_id,
            "timestamp": {"$gte": start_date}
        }))

        if len(activities) < 10:
            return {
                "optimal_times": ["morning", "evening"],
                "message": "Not enough data yet. Study when you feel most alert!",
                "confidence": "low"
            }

        # Analyze by hour of day
        hour_scores = {}
        for activity in activities:
            hour = activity["timestamp"].hour
            score = activity.get("score", 70)  # Default if no score

            if hour not in hour_scores:
                hour_scores[hour] = []
            hour_scores[hour].append(score)

        # Find best performing hours
        avg_by_hour = {hour: sum(scores)/len(scores) for hour, scores in hour_scores.items() if len(scores) >= 2}

        if not avg_by_hour:
            return {
                "optimal_times": ["morning", "evening"],
                "message": "Study consistently to build patterns",
                "confidence": "low"
            }

        sorted_hours = sorted(avg_by_hour.items(), key=lambda x: x[1], reverse=True)
        best_hours = [hour for hour, score in sorted_hours[:3]]

        # Convert to time periods
        time_periods = []
        for hour in best_hours:
            if 5 <= hour < 12:
                period = "morning"
            elif 12 <= hour < 17:
                period = "afternoon"
            elif 17 <= hour < 21:
                period = "evening"
            else:
                period = "night"

            if period not in time_periods:
                time_periods.append(period)

        return {
            "optimal_times": time_periods,
            "best_hour": best_hours[0] if best_hours else None,
            "message": f"Your best performance is typically in the {time_periods[0]}",
            "confidence": "high" if len(activities) > 50 else "medium"
        }

    # ============================================
    # Flask Route Registration
    # ============================================

    def register_routes(self, app):
        """Register adaptive learning routes with Flask app."""

        @app.route("/v1/adaptive/recommendations/<user_id>", methods=["GET"])
        def get_recommendations(user_id):
            """Get personalized learning recommendations."""
            try:
                result = self.get_recommendations(user_id)
                return jsonify(result), 200
            except Exception as e:
                self.logger.error(f"Error getting recommendations: {e}")
                return jsonify({"error": str(e)}), 500

        @app.route("/v1/adaptive/performance/<user_id>", methods=["GET"])
        def analyze_performance(user_id):
            """Analyze user's learning performance."""
            try:
                days = request.args.get("days", 14, type=int)
                result = self.analyze_performance(user_id, days)
                return jsonify(result), 200
            except Exception as e:
                self.logger.error(f"Error analyzing performance: {e}")
                return jsonify({"error": str(e)}), 500

        @app.route("/v1/adaptive/difficulty/<user_id>", methods=["GET"])
        def get_difficulty(user_id):
            """Get user's difficulty settings."""
            try:
                result = self.get_difficulty_settings(user_id)
                return jsonify(result), 200
            except Exception as e:
                self.logger.error(f"Error getting difficulty: {e}")
                return jsonify({"error": str(e)}), 500

        @app.route("/v1/adaptive/difficulty/<user_id>/adjust", methods=["POST"])
        def adjust_difficulty_route(user_id):
            """Manually trigger difficulty adjustment."""
            try:
                data = request.get_json()
                category = data.get("category", "vocabulary")
                score = data.get("score", 70)

                result = self.adjust_difficulty(user_id, category, score)
                return jsonify(result), 200
            except Exception as e:
                self.logger.error(f"Error adjusting difficulty: {e}")
                return jsonify({"error": str(e)}), 500

        @app.route("/v1/adaptive/optimal-time/<user_id>", methods=["GET"])
        def get_optimal_time(user_id):
            """Get optimal study time recommendations."""
            try:
                result = self.get_optimal_study_time(user_id)
                return jsonify(result), 200
            except Exception as e:
                self.logger.error(f"Error getting optimal time: {e}")
                return jsonify({"error": str(e)}), 500

        self.logger.info("Adaptive Learning routes registered")
