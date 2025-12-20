"""
Context Tracking Module (Phase 4)

Tracks user mood, energy, and stress.
Provides AI-powered session recommendations based on physical/mental state.
"""

import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from flask import Blueprint, request, jsonify
from pymongo import MongoClient
from bson import ObjectId

class ContextModule:
    def __init__(self, mongo_uri: str = "mongodb://localhost:27017/"):
        self.logger = logging.getLogger(__name__)
        self.client = MongoClient(mongo_uri)
        self.db = self.client["flaskStudyPlanDB"]
        
        # Collections
        self.checkins = self.db["context_checkins"]
        self.sessions = self.db["study_sessions"]
        
        self._create_indexes()

    def _create_indexes(self):
        try:
            self.checkins.create_index([("user_id", 1), ("timestamp", -1)])
            self.logger.info("Context indexes verified/created.")
        except Exception as e:
            self.logger.error(f"Error creating context indexes: {e}")

    # ============================================
    # AI Recommendation Logic
    # ============================================

    def generate_recommendation(self, checkin: Dict[str, Any]) -> Dict[str, Any]:
        energy = checkin.get("energy_level", 5)
        sleep = checkin.get("sleep_quality", "fair")
        mood = checkin.get("mood", "neutral")
        stress = checkin.get("stress_level", "medium")
        
        sleep_map = {"poor": 2, "fair": 5, "good": 8, "excellent": 10}
        mood_map = {"unmotivated": 2, "neutral": 5, "focused": 8, "energized": 10}
        stress_map = {"high": 3, "medium": 6, "low": 10}
        
        intensity_score = (
            energy * 0.4 +
            sleep_map.get(sleep, 5) * 0.3 +
            mood_map.get(mood, 5) * 0.2 +
            stress_map.get(stress, 6) * 0.1
        )
        
        if intensity_score < 4:
            return {
                "session_type": "review",
                "suggested_duration": 10,
                "reasoning": "Low energy. Focus on light review.",
                "suggested_activity": "flashcard_review"
            }
        elif intensity_score < 6:
            return {
                "session_type": "practice",
                "suggested_duration": 20,
                "reasoning": "Moderate energy. Good for reinforcement.",
                "suggested_activity": "quiz_practice"
            }
        elif intensity_score < 8:
            return {
                "session_type": "new_content",
                "suggested_duration": 30,
                "reasoning": "Good energy for new material.",
                "suggested_activity": "grammar_lesson"
            }
        else:
            return {
                "session_type": "challenge",
                "suggested_duration": 45,
                "reasoning": "Optimal state for challenges!",
                "suggested_activity": "jlpt_mock_test"
            }

    # ============================================
    # Routes
    # ============================================

    def register_routes(self, app):
        ctx_bp = Blueprint("context", __name__, url_prefix="/v1/context")

        @ctx_bp.route("/checkin", methods=["POST"])
        def submit_checkin():
            data = request.json
            user_id = data.get("user_id")
            if not user_id: return jsonify({"error": "user_id required"}), 400
            
            now = datetime.now()
            checkin = {
                "user_id": user_id,
                "timestamp": now,
                "sleep_quality": data.get("sleep_quality"),
                "energy_level": data.get("energy_level"),
                "mood": data.get("mood"),
                "stress_level": data.get("stress_level"),
                "focus_notes": data.get("focus_notes", "")
            }
            
            # Generate recommendation
            checkin["ai_session_recommendation"] = self.generate_recommendation(checkin)
            
            res = self.checkins.insert_one(checkin)
            checkin["_id"] = str(res.inserted_id)
            
            return jsonify(checkin), 201

        @ctx_bp.route("/checkin/latest", methods=["GET"])
        def get_latest_checkin():
            user_id = request.args.get("user_id")
            if not user_id: return jsonify({"error": "user_id required"}), 400
            
            checkin = self.checkins.find_one({"user_id": user_id}, sort=[("timestamp", -1)])
            if not checkin: return jsonify({"error": "No check-ins found"}), 404
            
            checkin["_id"] = str(checkin["_id"])
            if checkin.get("session_id"): checkin["session_id"] = str(checkin["session_id"])
            return jsonify(checkin)

        @ctx_bp.route("/checkin/<id>/link-session", methods=["POST"])
        def link_session(id):
            data = request.json
            session_id = data.get("session_id")
            if not session_id: return jsonify({"error": "session_id required"}), 400
            
            # Get session details for outcome
            session = self.sessions.find_one({"_id": ObjectId(session_id)})
            outcome = {}
            if session:
                outcome = {
                    "actual_duration": session.get("duration_minutes"),
                    "completion_rate": 100, # Assume full completion if session ended
                    "performance_score": session.get("accuracy_percent")
                }
            
            self.checkins.update_one(
                {"_id": ObjectId(id)},
                {"$set": {"session_id": ObjectId(session_id), "session_outcome": outcome}}
            )
            return jsonify({"message": "Session linked successfully"})

        @ctx_bp.route("/analytics", methods=["GET"])
        def get_analytics():
            user_id = request.args.get("user_id")
            if not user_id: return jsonify({"error": "user_id required"}), 400
            
            pipeline = [
                {"$match": {"user_id": user_id, "session_id": {"$exists": True}}},
                {"$group": {
                    "_id": "$energy_level",
                    "avg_accuracy": {"$avg": "$session_outcome.performance_score"},
                    "count": {"$sum": 1}
                }},
                {"$sort": {"_id": 1}}
            ]
            results = list(self.checkins.aggregate(pipeline))
            return jsonify(results)

        app.register_blueprint(ctx_bp)
