"""
SMART Goals Module (Phase 1)

Specific, Measurable, Achievable, Relevant, and Time-bound goal system.
Integrates with Content Mastery to calculate real-time progress.
"""

import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from flask import Blueprint, request, jsonify
from pymongo import MongoClient
from bson import ObjectId

class SmartGoalsModule:
    def __init__(self, mongo_uri: str = "mongodb://localhost:27017/"):
        self.logger = logging.getLogger(__name__)
        self.client = MongoClient(mongo_uri)
        self.db = self.client["flaskStudyPlanDB"]
        
        # Collections
        self.goals = self.db["smart_goals"]
        self.mastery = self.db["user_content_mastery"]
        self.quiz_db = self.client["flaskQuizDB"]
        self.quiz_attempts = self.db["quiz_attempts"] # Also from mastery interactions
        self.sessions = self.db["study_sessions"]
        
        self._create_indexes()

    def _create_indexes(self):
        try:
            self.goals.create_index([("user_id", 1), ("status", 1)])
            self.goals.create_index([("plan_id", 1)])
            self.logger.info("SMART Goals indexes verified/created.")
        except Exception as e:
            self.logger.error(f"Error creating SMART goals indexes: {e}")

    # ============================================
    # Progress Calculation Handlers
    # ============================================

    def get_vocab_count(self, user_id: str, since: datetime) -> int:
        return self.mastery.count_documents({
            "user_id": user_id,
            "content_type": "vocabulary",
            "status": {"$in": ["mastered", "reviewing"]},
            "last_reviewed_at": {"$gte": since}
        })

    def get_kanji_count(self, user_id: str, since: datetime) -> int:
        return self.mastery.count_documents({
            "user_id": user_id,
            "content_type": "kanji",
            "status": {"$in": ["mastered", "reviewing"]},
            "last_reviewed_at": {"$gte": since}
        })

    def get_grammar_count(self, user_id: str, since: datetime) -> int:
        return self.mastery.count_documents({
            "user_id": user_id,
            "content_type": "grammar",
            "status": {"$in": ["mastered", "reviewing"]},
            "last_reviewed_at": {"$gte": since}
        })

    def get_quiz_average(self, user_id: str, since: datetime) -> float:
        pipeline = [
            {"$match": {"user_id": user_id, "timestamp": {"$gte": since}}},
            {"$group": {"_id": None, "avg": {"$avg": "$score_percent"}}}
        ]
        result = list(self.quiz_attempts.aggregate(pipeline))
        return round(result[0]["avg"], 2) if result else 0.0

    def get_total_study_time(self, user_id: str, since: datetime) -> int:
        pipeline = [
            {"$match": {"user_id": user_id, "started_at": {"$gte": since}}},
            {"$group": {"_id": None, "total": {"$sum": "$duration_minutes"}}}
        ]
        result = list(self.sessions.aggregate(pipeline))
        return result[0]["total"] if result else 0

    def calculate_progress(self, goal: Dict[str, Any]) -> Dict[str, Any]:
        metric = goal.get("measurable_metric")
        user_id = goal.get("user_id")
        created_at = goal.get("created_at") or datetime.now()
        
        handlers = {
            "vocabulary_count": self.get_vocab_count,
            "kanji_count": self.get_kanji_count,
            "grammar_points": self.get_grammar_count,
            "quiz_average": self.get_quiz_average,
            "study_minutes": self.get_total_study_time
        }
        
        handler = handlers.get(metric)
        current_value = handler(user_id, created_at) if handler else 0
        
        baseline = goal.get("measurable_baseline", 0)
        target = goal.get("measurable_target", 1)
        
        if target <= baseline:
            progress_percent = 100 if current_value >= target else 0
        else:
            progress_percent = ((current_value - baseline) / (target - baseline)) * 100
            
        progress_percent = min(max(progress_percent, 0), 100)
        
        return {
            "current_value": current_value,
            "progress_percent": round(progress_percent, 2),
            "is_completed": progress_percent >= 100
        }

    # ============================================
    # Routes
    # ============================================

    def register_routes(self, app):
        smart_bp = Blueprint("smart_goals", __name__, url_prefix="/v1/smart-goals")

        @smart_bp.route("/", methods=["POST"])
        def create_goal():
            data = request.json
            user_id = data.get("user_id")
            if not user_id: return jsonify({"error": "user_id required"}), 400
            
            now = datetime.now(timezone.utc)
            deadline = data.get("time_bound_deadline")
            if deadline:
                deadline = datetime.fromisoformat(deadline.replace("Z", "+00:00"))

            goal = {
                "user_id": user_id,
                "plan_id": ObjectId(data["plan_id"]) if data.get("plan_id") else None,
                "title": data.get("title"),
                "specific": data.get("specific"),
                "measurable_metric": data.get("measurable_metric"),
                "measurable_target": data.get("measurable_target"),
                "measurable_baseline": data.get("measurable_baseline", 0),
                "achievable_confidence": 0,
                "relevant_jlpt_section": data.get("relevant_jlpt_section"),
                "time_bound_deadline": deadline,
                "success_criteria": [],
                "status": "active",
                "priority": data.get("priority", 1), # 1: normal, 2: high, 3: urgent
                "progress_percent": 0,
                "created_at": now,
                "updated_at": now
            }
            
            # Initial success criteria
            if data.get("success_criteria"):
                for sc in data["success_criteria"]:
                    goal["success_criteria"].append({
                        "id": ObjectId(),
                        "description": sc.get("description"),
                        "metric_type": sc.get("metric_type"),
                        "target_value": sc.get("target_value"),
                        "current_value": 0,
                        "completed": False
                    })

            res = self.goals.insert_one(goal)
            return jsonify({"id": str(res.inserted_id)}), 201

        @smart_bp.route("/", methods=["GET"])
        def list_goals():
            user_id = request.args.get("user_id")
            if not user_id: return jsonify({"error": "user_id required"}), 400
            
            query = {"user_id": user_id}
            active_only = request.args.get("active") == "true"
            if active_only: query["status"] = "active"
            
            goals = list(self.goals.find(query))
            for g in goals:
                # Add real-time progress
                progress = self.calculate_progress(g)
                g.update(progress)
                
                g["_id"] = str(g["_id"])
                if g.get("plan_id"): g["plan_id"] = str(g["plan_id"])
                for sc in g.get("success_criteria", []):
                    sc["id"] = str(sc["id"])
                    
            return jsonify(goals)

        @smart_bp.route("/<goal_id>", methods=["GET"])
        def get_goal(goal_id):
            goal = self.goals.find_one({"_id": ObjectId(goal_id)})
            if not goal: return jsonify({"error": "Goal not found"}), 404
            
            progress = self.calculate_progress(goal)
            goal.update(progress)
            
            goal["_id"] = str(goal["_id"])
            if goal.get("plan_id"): goal["plan_id"] = str(goal["plan_id"])
            for sc in goal.get("success_criteria", []):
                sc["id"] = str(sc["id"])
                
            return jsonify(goal)

        @smart_bp.route("/<goal_id>/criteria/<criteria_id>/toggle", methods=["POST"])
        def toggle_criteria(goal_id, criteria_id):
            goal = self.goals.find_one({"_id": ObjectId(goal_id)})
            if not goal: return jsonify({"error": "Goal not found"}), 404
            
            criteria_list = goal.get("success_criteria", [])
            for sc in criteria_list:
                if str(sc["id"]) == criteria_id:
                    sc["completed"] = not sc.get("completed", False)
                    sc["completed_at"] = datetime.now() if sc["completed"] else None
                    break
            
            self.goals.update_one(
                {"_id": ObjectId(goal_id)},
                {"$set": {"success_criteria": criteria_list, "updated_at": datetime.now()}}
            )
            return jsonify({"message": "Toggled criteria successfully"})

        @smart_bp.route("/<goal_id>", methods=["DELETE"])
        def delete_goal(goal_id):
            res = self.goals.delete_one({"_id": ObjectId(goal_id)})
            if res.deleted_count == 0: return jsonify({"error": "Goal not found"}), 404
            return jsonify({"message": "Deleted successfully"})

        @smart_bp.route("/batch", methods=["POST"])
        def batch_update_goals():
            data = request.json
            user_id = data.get("user_id")
            updates = data.get("updates", [])
            
            if not user_id: return jsonify({"error": "user_id required"}), 400
            
            results = []
            now = datetime.now(timezone.utc)
            
            for item in updates:
                goal_id = item.get("id")
                if goal_id:
                    # Update existing - use user_id from request body
                    result = self.goals.update_one(
                        {"_id": ObjectId(goal_id), "user_id": user_id},
                        {"$set": {**item.get("fields", {}), "updated_at": now}}
                    )
                    if result.modified_count > 0:
                        results.append(goal_id)
                else:
                    # Create new (optional behavior for batch)
                    # For now just handle updates of existing
                    pass
                    
            return jsonify({"updated_count": len(results), "ids": results}), 200


        app.register_blueprint(smart_bp)
