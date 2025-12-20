"""
PACT Commitment Module (Phase 3)

Purpose, Actions, Continuous, Trackable.
Tracks daily habits, completion rates, and streak management.
"""

import logging
from datetime import datetime, date, timedelta
from typing import Dict, List, Optional, Any
from flask import Blueprint, request, jsonify
from pymongo import MongoClient
from bson import ObjectId

class PACTModule:
    def __init__(self, mongo_uri: str = "mongodb://localhost:27017/"):
        self.logger = logging.getLogger(__name__)
        self.client = MongoClient(mongo_uri)
        self.db = self.client["flaskStudyPlanDB"]
        
        # Collections
        self.commitments = self.db["pact_commitments"]
        self.actions_log = self.db["pact_actions_log"]
        self.sessions = self.db["study_sessions"]
        self.progress = self.db["learner_progress"]
        
        self._create_indexes()

    def _create_indexes(self):
        try:
            self.commitments.create_index([("user_id", 1)], unique=True)
            self.actions_log.create_index([("user_id", 1), ("date", 1)])
            self.logger.info("PACT indexes verified/created.")
        except Exception as e:
            self.logger.error(f"Error creating PACT indexes: {e}")

    # ============================================
    # Streak Logic
    # ============================================

    def update_streak(self, user_id: str):
        commitment = self.commitments.find_one({"user_id": user_id})
        if not commitment: return
        
        now = datetime.now()
        today = now.date()
        yesterday = today - timedelta(days=1)
        
        # Check completion for yesterday
        yesterday_logs = list(self.actions_log.find({
            "user_id": user_id,
            "date": {"$gte": datetime.combine(yesterday, datetime.min.time()),
                     "$lte": datetime.combine(yesterday, datetime.max.time())}
        }))
        
        active_actions = [a for a in commitment.get("actions", []) if a.get("is_active")]
        if not active_actions: return
        
        completed_ids = [str(l["action_id"]) for l in yesterday_logs if l.get("completed")]
        required_ids = [str(a["id"]) for a in active_actions]
        
        # Match count
        matches = sum(1 for rid in required_ids if rid in completed_ids)
        completion_rate = matches / len(required_ids)
        
        # Threshold 80%
        if completion_rate >= 0.8:
            new_streak = commitment.get("streak_current", 0) + 1
            longest = max(new_streak, commitment.get("streak_longest", 0))
            self.commitments.update_one(
                {"user_id": user_id},
                {"$set": {"streak_current": new_streak, "streak_longest": longest}}
            )
            # Sync to learner_progress
            self.progress.update_one(
                {"user_id": user_id},
                {"$set": {"current_streak": new_streak, "longest_streak": longest}},
                upsert=True
            )
        else:
            # Streak broken
            if commitment.get("streak_current", 0) > 0:
                history_entry = {
                    "start_date": now - timedelta(days=commitment["streak_current"]),
                    "end_date": yesterday,
                    "length": commitment["streak_current"],
                    "broken_reason": "incomplete_actions"
                }
                self.commitments.update_one(
                    {"user_id": user_id},
                    {
                        "$set": {"streak_current": 0},
                        "$push": {"streak_history": history_entry}
                    }
                )
                self.progress.update_one(
                    {"user_id": user_id},
                    {"$set": {"current_streak": 0}},
                    upsert=True
                )

    # ============================================
    # Routes
    # ============================================

    def register_routes(self, app):
        pact_bp = Blueprint("pact", __name__, url_prefix="/v1/pact")

        @pact_bp.route("/commitment", methods=["POST", "PUT"])
        def upsert_commitment():
            data = request.json
            user_id = data.get("user_id")
            if not user_id: return jsonify({"error": "user_id required"}), 400
            
            now = datetime.now()
            
            # Prepare actions
            actions = []
            for a_data in data.get("actions", []):
                actions.append({
                    "id": ObjectId() if not a_data.get("id") else ObjectId(a_data["id"]),
                    "description": a_data.get("description"),
                    "action_type": a_data.get("action_type", "study"),
                    "target_minutes": a_data.get("target_minutes", 15),
                    "best_time_of_day": a_data.get("best_time_of_day"),
                    "completion_rate": 0,
                    "is_active": a_data.get("is_active", True)
                })

            update_doc = {
                "purpose": data.get("purpose"),
                "purpose_alignment_score": data.get("purpose_alignment_score", 0),
                "actions": actions,
                "preferred_session_length": data.get("preferred_session_length", 25),
                "low_energy_fallback": data.get("low_energy_fallback"),
                "updated_at": now
            }
            
            res = self.commitments.update_one(
                {"user_id": user_id},
                {"$set": update_doc, "$setOnInsert": {"user_id": user_id, "streak_current": 0, "streak_longest": 0, "created_at": now}},
                upsert=True
            )
            
            return jsonify({"message": "Commitment saved"}), 201

        @pact_bp.route("/commitment", methods=["GET"])
        def get_commitment():
            user_id = request.args.get("user_id")
            if not user_id: return jsonify({"error": "user_id required"}), 400
            
            commitment = self.commitments.find_one({"user_id": user_id})
            if not commitment: return jsonify({"error": "No commitment found"}), 404
            
            commitment["_id"] = str(commitment["_id"])
            for a in commitment.get("actions", []):
                a["id"] = str(a["id"])
            return jsonify(commitment)

        @pact_bp.route("/actions/<action_id>/complete", methods=["POST"])
        def complete_action(action_id):
            data = request.json
            user_id = data.get("user_id")
            if not user_id: return jsonify({"error": "user_id required"}), 400
            
            now = datetime.now()
            today = datetime.combine(now.date(), datetime.min.time())
            
            log_entry = {
                "user_id": user_id,
                "commitment_id": None, # Will lookup if needed
                "action_id": ObjectId(action_id),
                "date": today,
                "completed": True,
                "completed_at": now,
                "context_snapshot": {
                    "energy_level": data.get("energy_level"),
                    "mood": data.get("mood"),
                    "actual_minutes": data.get("actual_minutes", 0)
                }
            }
            
            self.actions_log.update_one(
                {"user_id": user_id, "action_id": ObjectId(action_id), "date": today},
                {"$set": log_entry},
                upsert=True
            )
            
            # Check if this completion fulfills a daily goal check
            return jsonify({"message": "Action logged"})

        @pact_bp.route("/daily-status", methods=["GET"])
        def get_daily_status():
            user_id = request.args.get("user_id")
            if not user_id: return jsonify({"error": "user_id required"}), 400
            
            commitment = self.commitments.find_one({"user_id": user_id})
            if not commitment: return jsonify({"error": "No commitment"}), 404
            
            today = datetime.combine(date.today(), datetime.min.time())
            logs = {str(l["action_id"]): l for l in self.actions_log.find({"user_id": user_id, "date": today})}
            
            status = []
            for a in commitment.get("actions", []):
                a_id = str(a["id"])
                status.append({
                    "id": a_id,
                    "description": a["description"],
                    "completed": a_id in logs,
                    "completed_at": logs[a_id]["completed_at"] if a_id in logs else None
                })
            
            return jsonify(status)

        app.register_blueprint(pact_bp)
