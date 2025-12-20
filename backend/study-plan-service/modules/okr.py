"""
OKR System Module (Phase 2)

Objectives and Key Results.
Tracks high-level objectives and automatically updates Key Results from activity data.
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from flask import Blueprint, request, jsonify
from pymongo import MongoClient
from bson import ObjectId

class OKRModule:
    def __init__(self, mastery_module, mongo_uri: str = "mongodb://localhost:27017/"):
        self.logger = logging.getLogger(__name__)
        self.client = MongoClient(mongo_uri)
        self.db = self.client["flaskStudyPlanDB"]
        self.mastery = mastery_module
        
        # Collections
        self.objectives = self.db["okr_objectives"]
        
        self._create_indexes()

    def _create_indexes(self):
        try:
            self.objectives.create_index([("user_id", 1), ("on_track", 1)])
            self.logger.info("OKR indexes verified/created.")
        except Exception as e:
            self.logger.error(f"Error creating OKR indexes: {e}")

    # ============================================
    # Key Result Calculation
    # ============================================

    def refresh_key_result(self, kr: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        source = kr.get("data_source")
        
        current = 0
        if source == "vocabulary":
            current = self.mastery.get_mastery_count(user_id, "vocabulary")
        elif source == "grammar":
            current = self.mastery.get_mastery_count(user_id, "grammar")
        elif source == "kanji":
            current = self.mastery.get_mastery_count(user_id, "kanji")
        elif source == "study_time":
            current = self.mastery.get_study_time(user_id)
        elif source == "flashcards":
            current = self.mastery.get_review_count(user_id)
        
        # Update history
        now = datetime.now()
        history = kr.get("history", [])
        history.append({"date": now, "value": current})
        # Keep last 10 entries for velocity
        if len(history) > 10: history = history[-10:]
        
        # Calculate velocity (units per day)
        velocity = 0
        if len(history) >= 2:
            days = (history[-1]["date"] - history[0]["date"]).days or 1
            velocity = (history[-1]["value"] - history[0]["value"]) / days
            
        # Projected completion
        target = kr.get("target", 1)
        remaining = target - current
        projected = None
        if velocity > 0:
            days_to_go = remaining / velocity
            projected = now + timedelta(days=days_to_go)
            
        kr.update({
            "current": current,
            "velocity": round(velocity, 2),
            "projected_completion": projected,
            "history": history,
            "progress_percent": round((current / target) * 100, 2) if target > 0 else 0
        })
        return kr

    def assess_risk(self, okr: Dict[str, Any]) -> str:
        deadline = okr.get("deadline")
        if not deadline: return "low"
        
        now = datetime.now()
        created = okr.get("created_at") or now
        total_days = (deadline - created).days or 1
        days_passed = (now - created).days
        
        expected_progress = (days_passed / total_days) * 100
        actual_progress = okr.get("progress_percent", 0)
        
        gap = expected_progress - actual_progress
        if gap > 20: return "high"
        if gap > 10: return "medium"
        return "low"

    # ============================================
    # Routes
    # ============================================

    def register_routes(self, app):
        okr_bp = Blueprint("okr", __name__, url_prefix="/v1/okr")

        @okr_bp.route("/objectives", methods=["POST"])
        def create_okr():
            data = request.json
            user_id = data.get("user_id")
            if not user_id: return jsonify({"error": "user_id required"}), 400
            
            now = datetime.now()
            deadline = data.get("deadline")
            if deadline:
                deadline = datetime.fromisoformat(deadline.replace("Z", "+00:00"))

            okr = {
                "user_id": user_id,
                "plan_id": ObjectId(data["plan_id"]) if data.get("plan_id") else None,
                "parent_smart_goal_id": ObjectId(data["parent_smart_goal_id"]) if data.get("parent_smart_goal_id") else None,
                "objective": data.get("objective"),
                "description": data.get("description"),
                "category": data.get("category"),
                "key_results": [],
                "progress_percent": 0,
                "risk_level": "low",
                "on_track": True,
                "deadline": deadline,
                "created_at": now,
                "updated_at": now
            }
            
            for kr_data in data.get("key_results", []):
                kr = {
                    "id": ObjectId(),
                    "title": kr_data.get("title"),
                    "metric_type": kr_data.get("metric_type"),
                    "target": kr_data.get("target"),
                    "unit": kr_data.get("unit"),
                    "data_source": kr_data.get("data_source"),
                    "current": 0,
                    "history": []
                }
                okr["key_results"].append(self.refresh_key_result(kr, user_id))
                
            # Aggregate progress
            if okr["key_results"]:
                okr["progress_percent"] = sum(kr["progress_percent"] for kr in okr["key_results"]) / len(okr["key_results"])
                
            res = self.objectives.insert_one(okr)
            return jsonify({"id": str(res.inserted_id)}), 201

        @okr_bp.route("/objectives", methods=["GET"])
        def list_okrs():
            user_id = request.args.get("user_id")
            if not user_id: return jsonify({"error": "user_id required"}), 400
            
            okrs = list(self.objectives.find({"user_id": user_id}))
            for o in okrs:
                o["_id"] = str(o["_id"])
                if o.get("plan_id"): o["plan_id"] = str(o["plan_id"])
                if o.get("parent_smart_goal_id"): o["parent_smart_goal_id"] = str(o["parent_smart_goal_id"])
                for kr in o["key_results"]:
                    kr["id"] = str(kr["id"])
            return jsonify(okrs)

        @okr_bp.route("/objectives/<id>/refresh", methods=["POST"])
        def refresh_okr(id):
            okr = self.objectives.find_one({"_id": ObjectId(id)})
            if not okr: return jsonify({"error": "OKR not found"}), 404
            
            user_id = okr["user_id"]
            for kr in okr["key_results"]:
                # Convert back to ObjectId for local manipulation if needed (usually kr ids are generated)
                self.refresh_key_result(kr, user_id)
                
            okr["progress_percent"] = sum(kr["progress_percent"] for kr in okr["key_results"]) / len(okr["key_results"])
            okr["risk_level"] = self.assess_risk(okr)
            okr["on_track"] = okr["risk_level"] != "high"
            okr["updated_at"] = datetime.now()
            
            self.objectives.update_one({"_id": ObjectId(id)}, {"$set": okr})
            return jsonify({"message": "Refreshed", "progress": okr["progress_percent"]})

        app.register_blueprint(okr_bp)
