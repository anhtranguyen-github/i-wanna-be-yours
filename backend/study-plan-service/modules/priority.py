"""
Priority Matrix Module (Phase 5)

RED/YELLOW/GREEN classification for content items.
Analyzes error rates and learning patterns to prioritize study focus.
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from flask import Blueprint, request, jsonify
from pymongo import MongoClient
from bson import ObjectId

class PriorityMatrixModule:
    def __init__(self, mongo_uri: str = "mongodb://localhost:27017/"):
        self.logger = logging.getLogger(__name__)
        self.client = MongoClient(mongo_uri)
        self.db = self.client["flaskStudyPlanDB"]
        
        # Collections
        self.queue = self.db["priority_queue"]
        self.errors = self.db["error_analysis"]
        self.mastery = self.db["user_content_mastery"]
        self.interactions = self.db["content_interactions"]
        
        self._create_indexes()

    def _create_indexes(self):
        try:
            self.queue.create_index([("user_id", 1)], unique=True)
            self.errors.create_index([("user_id", 1), ("timestamp", -1)])
            self.errors.create_index([("content_id", 1)])
            self.logger.info("Priority Matrix indexes verified/created.")
        except Exception as e:
            self.logger.error(f"Error creating priority matrix indexes: {e}")

    # ============================================
    # Priority Calculation
    # ============================================

    def calculate_item_priority(self, user_id: str, content_id: str) -> Dict[str, Any]:
        now = datetime.now()
        since = now - timedelta(days=7)
        
        # Get recent interactions
        query = {
            "user_id": user_id, 
            "content_id": content_id, 
            "timestamp": {"$gte": since}
        }
        recent = list(self.interactions.find(query).sort("timestamp", 1))
        
        if not recent:
            return {"priority": "yellow", "score": 50, "reason": "No recent data"}
            
        total = len(recent)
        err_count = sum(1 for r in recent if not r.get("is_correct"))
        error_rate = err_count / total
        
        # Determine trend
        trend = "stable"
        if total >= 4:
            half = total // 2
            old_errs = sum(1 for r in recent[:half] if not r.get("is_correct"))
            new_errs = sum(1 for r in recent[half:] if not r.get("is_correct"))
            if new_errs > old_errs: trend = "worsening"
            elif new_errs < old_errs: trend = "improving"
            
        # Determine priority
        if error_rate > 0.6 or (error_rate > 0.4 and trend == "worsening"):
            priority = "red"
            action = "deep_teaching"
        elif error_rate > 0.3 or trend == "worsening":
            priority = "yellow"
            action = "drill_practice"
        else:
            priority = "green"
            action = "maintain_review"
            
        return {
            "priority": priority,
            "score": int((1 - error_rate) * 100),
            "trend": trend,
            "recommended_action": action,
            "error_rate": round(error_rate * 100, 1)
        }

    def calculate_time_allocation(self, items: List[Dict[str, Any]]) -> Dict[str, int]:
        counts = {"red": 0, "yellow": 0, "green": 0}
        for it in items:
            counts[it["priority"]] += 1
            
        total_items = len(items)
        if total_items == 0:
            return {"red": 33, "yellow": 34, "green": 33}
            
        # Weighted split
        red_w = counts["red"] * 4
        yellow_w = counts["yellow"] * 2
        green_w = counts["green"] * 1
        total_w = red_w + yellow_w + green_w
        
        if total_w == 0: return {"red": 33, "yellow": 34, "green": 33}
        
        return {
            "red": round((red_w / total_w) * 100),
            "yellow": round((yellow_w / total_w) * 100),
            "green": round((green_w / total_w) * 100)
        }

    # ============================================
    # Routes
    # ============================================

    def register_routes(self, app):
        priority_bp = Blueprint("priority", __name__, url_prefix="/v1/priority-matrix")

        @priority_bp.route("/", methods=["GET"])
        def get_matrix():
            user_id = request.args.get("user_id")
            if not user_id: return jsonify({"error": "user_id required"}), 400
            
            matrix = self.queue.find_one({"user_id": user_id})
            if not matrix:
                # Run initial calculation if missing
                return self.recalculate_matrix(user_id)
                
            matrix["_id"] = str(matrix["_id"])
            return jsonify(matrix)

        @priority_bp.route("/recalculate", methods=["POST"])
        def trigger_recalculate():
            user_id = request.json.get("user_id")
            if not user_id: return jsonify({"error": "user_id required"}), 400
            return self.recalculate_matrix(user_id)

        @priority_bp.route("/errors", methods=["POST"])
        def log_error():
            data = request.json
            user_id = data.get("user_id")
            if not user_id: return jsonify({"error": "user_id required"}), 400
            
            error_entry = {
                "user_id": user_id,
                "timestamp": datetime.now(),
                "content_id": data.get("content_id"),
                "content_type": data.get("content_type"),
                "question_type": data.get("question_type"),
                "error_type": data.get("error_type", "knowledge_gap"),
                "user_answer": data.get("user_answer"),
                "correct_answer": data.get("correct_answer"),
                "context_checkin_id": ObjectId(data["context_checkin_id"]) if data.get("context_checkin_id") else None
            }
            
            self.errors.insert_one(error_entry)
            return jsonify({"message": "Error logged"}), 201

        app.register_blueprint(priority_bp)

    def recalculate_matrix(self, user_id: str):
        # 1. Find all items with status learning/reviewing/mastered
        active_items = list(self.mastery.find({
            "user_id": user_id,
            "status": {"$in": ["learning", "reviewing", "mastered"]}
        }))
        
        matrix_items = []
        for item in active_items:
            priority_info = self.calculate_item_priority(user_id, item["content_id"])
            matrix_items.append({
                "content_id": item["content_id"],
                "content_type": item["content_type"],
                "title": item.get("title", item["content_id"]),
                "priority": priority_info["priority"],
                "priority_score": priority_info["score"],
                "trend": priority_info["trend"],
                "recommended_action": priority_info["recommended_action"],
                "last_review_date": item.get("last_reviewed_at")
            })
            
            # Update item priority in mastery doc
            self.mastery.update_one(
                {"_id": item["_id"]},
                {"$set": {"priority": priority_info["priority"]}}
            )
            
        allocation = self.calculate_time_allocation(matrix_items)
        
        matrix_doc = {
            "user_id": user_id,
            "items": matrix_items,
            "recommended_time_allocation": allocation,
            "last_calculated": datetime.now()
        }
        
        self.queue.update_one(
            {"user_id": user_id},
            {"$set": matrix_doc},
            upsert=True
        )
        
        if "_id" in matrix_doc: matrix_doc["_id"] = str(matrix_doc["_id"])
        # Fetch it back to get the string id if it was an upsert
        new_matrix = self.queue.find_one({"user_id": user_id})
        new_matrix["_id"] = str(new_matrix["_id"])
        
        return jsonify(new_matrix)
