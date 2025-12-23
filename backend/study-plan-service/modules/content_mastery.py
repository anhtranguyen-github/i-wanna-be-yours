"""
Content Mastery Module (Phase 0)

Source of truth for all content learned by users.
Tracks mastery status, SRS scheduling, and performance analytics.
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Any
from flask import Blueprint, request, jsonify
from pymongo import MongoClient, UpdateOne
from bson import ObjectId

# ============================================
# SRS Utility (SM-2 Variant)
# ============================================

def calculate_next_srs(
    current_interval: int, 
    current_ease: float, 
    quality: int, 
    current_stage: int
) -> Dict[str, Any]:
    """
    SM-2 Algorithm Variant
    quality: 0-5
    0: Blackout, 1: Wrong, 2: Correct (hard), 3: Correct (medium), 4: Correct (easy), 5: Perfect
    """
    # Default values
    new_ease = current_ease
    new_interval = current_interval
    new_stage = current_stage

    if quality < 3:
        # Incorrect answer
        new_interval = 1
        new_stage = 1
        # Moderate ease reduction
        new_ease = max(1.3, current_ease - 0.2)
    else:
        # Correct answer
        new_stage = current_stage + 1
        
        if current_stage == 1:
            new_interval = 1
        elif current_stage == 2:
            new_interval = 6
        else:
            new_interval = math.ceil(current_interval * current_ease)
            
        # Ease adjustment
        new_ease = current_ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        new_ease = max(1.3, new_ease)

    return {
        "interval_days": new_interval,
        "ease_factor": round(new_ease, 2),
        "next_review_date": datetime.now(timezone.utc) + timedelta(days=new_interval),
        "new_stage": new_stage
    }

import math

# ============================================
# Mastery Module Class
# ============================================

class ContentMasteryModule:
    def __init__(self, mongo_uri: str = "mongodb://localhost:27017/"):
        self.logger = logging.getLogger(__name__)
        self.client = MongoClient(mongo_uri)
        self.db = self.client["flaskStudyPlanDB"]
        
        # New Collections
        self.mastery = self.db["user_content_mastery"]
        self.interactions = self.db["content_interactions"]
        self.quiz_attempts = self.db["quiz_attempts"]
        self.sessions = self.db["study_sessions"]
        
        self._create_indexes()

    def _create_indexes(self):
        """Create indexes for performance."""
        try:
            self.mastery.create_index([("user_id", 1), ("content_type", 1), ("content_id", 1)], unique=True)
            self.mastery.create_index([("user_id", 1), ("status", 1)])
            self.mastery.create_index([("user_id", 1), ("srs.next_review_date", 1)])
            self.mastery.create_index([("user_id", 1), ("priority", 1)])
            
            self.interactions.create_index([("user_id", 1), ("timestamp", -1)])
            self.interactions.create_index([("mastery_id", 1), ("timestamp", -1)])
            
            self.quiz_attempts.create_index([("user_id", 1), ("timestamp", -1)])
            self.sessions.create_index([("user_id", 1), ("started_at", -1)])
            self.logger.info("Content Mastery indexes verified/created.")
        except Exception as e:
            self.logger.error(f"Error creating mastery indexes: {e}")

    def map_quality_to_srs(self, is_correct: bool, difficulty_rating: str) -> int:
        """Map frontend/user feedback to 0-5 quality score."""
        if not is_correct: return 1
        return {
            "hard": 2,
            "medium": 3,
            "easy": 4,
            "perfect": 5
        }.get(difficulty_rating, 3)

    def determine_performance(self, accuracy: float, streak: int) -> str:
        """Map performance to a string for the frontend."""
        if accuracy >= 100: return "perfect"
        if accuracy >= 90: return "high"
        if accuracy >= 70: return "medium"
        return "low"

    def determine_status(self, interval: int, accuracy: float, streak: int) -> str:
        """Calculate status based on SRS interval and performance."""
        if interval >= 120: return "burned"
        if interval >= 21 and accuracy >= 90: return "mastered"
        if streak >= 3 or accuracy >= 80: return "reviewing"
        return "learning"

    # ============================================
    # Statistics Helpers (for SMART/OKR)
    # ============================================

    def get_mastery_count(self, user_id: str, content_type: str = None, status: Optional[str] = "mastered") -> int:
        query = {"user_id": user_id}
        if status: query["status"] = status
        if content_type: query["content_type"] = content_type
        return self.mastery.count_documents(query)

    def get_review_count(self, user_id: str, since: datetime = None) -> int:
        query = {"user_id": user_id}
        if since: query["timestamp"] = {"$gte": since}
        return self.interactions.count_documents(query)

    def get_study_time(self, user_id: str, since: datetime = None) -> int:
        pipeline = [{"$match": {"user_id": user_id}}]
        if since: pipeline[0]["$match"]["started_at"] = {"$gte": since}
        pipeline.append({"$group": {"_id": None, "total": {"$sum": "$duration_minutes"}}})
        
        result = list(self.sessions.aggregate(pipeline))
        return result[0]["total"] if result else 0

    def register_routes(self, app):
        mastery_bp = Blueprint("mastery", __name__, url_prefix="/v1/mastery")

        @mastery_bp.route("/", methods=["GET"])
        def list_mastery():
            user_id = request.args.get("user_id")
            content_type = request.args.get("content_type")
            status = request.args.get("status")
            
            if not user_id: return jsonify({"error": "user_id required"}), 400
            
            query = {"user_id": user_id}
            if content_type: query["content_type"] = content_type
            if status: query["status"] = status
            
            records = list(self.mastery.find(query).limit(100))
            for r in records: r["_id"] = str(r["_id"])
            return jsonify(records)

        @mastery_bp.route("/stats", methods=["GET"])
        def get_stats():
            user_id = request.args.get("user_id")
            if not user_id: return jsonify({"error": "user_id required"}), 400
            
            pipeline = [
                {"$match": {"user_id": user_id}},
                {"$group": {
                    "_id": "$status",
                    "count": {"$sum": 1},
                    "avg_accuracy": {"$avg": "$stats.accuracy_percent"}
                }}
            ]
            stats = list(self.mastery.aggregate(pipeline))
            return jsonify(stats)

        @mastery_bp.route("/due", methods=["GET"])
        def get_due():
            user_id = request.args.get("user_id")
            if not user_id: return jsonify({"error": "user_id required"}), 400
            
            now = datetime.now(timezone.utc)
            query = {
                "user_id": user_id,
                "srs.next_review_date": {"$lte": now},
                "status": {"$ne": "burned"}
            }
            records = list(self.mastery.find(query).sort("srs.next_review_date", 1).limit(50))
            for r in records: r["_id"] = str(r["_id"])
            return jsonify(records)

        @mastery_bp.route("/<content_type>/<content_id>/start", methods=["POST"])
        def start_learning(content_type, content_id):
            data = request.json
            user_id = data.get("user_id")
            if not user_id: return jsonify({"error": "user_id required"}), 400
            
            now = datetime.now(timezone.utc)
            record = {
                "user_id": user_id,
                "content_type": content_type,
                "content_id": content_id,
                "status": "learning",
                "mastery_level": 0,
                "mastery_stage": 1,
                "srs": {
                    "ease_factor": 2.5,
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
                "first_seen_at": now,
                "created_at": now,
                "updated_at": now
            }
            
            try:
                self.mastery.update_one(
                    {"user_id": user_id, "content_type": content_type, "content_id": content_id},
                    {"$setOnInsert": record},
                    upsert=True
                )
                return jsonify({"message": "Started learning"}), 201
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @mastery_bp.route("/review", methods=["POST"])
        def log_review():
            data = request.json
            user_id = data.get("user_id")
            mastery_id = data.get("mastery_id")
            content_type = data.get("content_type")
            content_id = data.get("content_id")
            is_correct = data.get("is_correct")
            difficulty = data.get("difficulty", "medium") # hard, medium, easy, perfect
            
            if not user_id or (not mastery_id and not (content_type and content_id)):
                return jsonify({"error": "user_id and (mastery_id or content_id) required"}), 400
            
            query = {"user_id": user_id}
            if mastery_id: query["_id"] = ObjectId(mastery_id)
            else: query.update({"content_type": content_type, "content_id": content_id})
            
            doc = self.mastery.find_one(query)
            if not doc: return jsonify({"error": "Mastery record not found"}), 404
            
            # Calculate new SRS
            quality = self.map_quality_to_srs(is_correct, difficulty)
            srs_result = calculate_next_srs(
                doc["srs"]["interval_days"],
                doc["srs"]["ease_factor"],
                quality,
                doc.get("mastery_stage", 1)
            )
            
            now = datetime.now(timezone.utc)
            
            # Update Stats
            total = doc["stats"]["total_reviews"] + 1
            correct = doc["stats"]["correct_count"] + (1 if is_correct else 0)
            incorrect = doc["stats"]["incorrect_count"] + (0 if is_correct else 1)
            accuracy = (correct / total) * 100
            streak = (doc["srs"]["correct_streak"] + 1) if is_correct else 0
            lapse = doc["srs"]["lapse_count"] + (1 if (not is_correct and doc["status"] == "mastered") else 0)
            
            new_status = self.determine_status(srs_result["interval_days"], accuracy, streak)
            
            # Update Document
            update_data = {
                "status": new_status,
                "mastery_stage": srs_result["new_stage"],
                "srs.interval_days": srs_result["interval_days"],
                "srs.ease_factor": srs_result["ease_factor"],
                "srs.next_review_date": srs_result["next_review_date"],
                "srs.review_count": total,
                "srs.correct_streak": streak,
                "srs.lapse_count": lapse,
                "stats.total_reviews": total,
                "stats.correct_count": correct,
                "stats.incorrect_count": incorrect,
                "stats.accuracy_percent": round(accuracy, 2),
                "last_rating": difficulty,
                "performance": self.determine_performance(accuracy, streak),
                "last_reviewed_at": now,
                "updated_at": now
            }
            
            if new_status == "mastered" and doc["status"] != "mastered":
                update_data["mastered_at"] = now
            elif not is_correct:
                update_data["last_error_type"] = data.get("error_type", "other")
            
            self.mastery.update_one({"_id": doc["_id"]}, {"$set": update_data})
            
            # Log Interaction
            interaction = {
                "user_id": user_id,
                "mastery_id": doc["_id"],
                "interaction_type": data.get("interaction_type", "flashcard_review"),
                "content_type": doc["content_type"],
                "content_id": doc["content_id"],
                "is_correct": is_correct,
                "timestamp": now,
                "srs_change": {
                    "old_interval": doc["srs"]["interval_days"],
                    "new_interval": srs_result["interval_days"],
                    "old_stage": doc.get("mastery_stage", 1),
                    "new_stage": srs_result["new_stage"]
                }
            }
            self.interactions.insert_one(interaction)
            
            return jsonify({
                "status": new_status,
                "next_review": srs_result["next_review_date"]
            })

        app.register_blueprint(mastery_bp)
