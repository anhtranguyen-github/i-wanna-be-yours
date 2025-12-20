"""
Review Cycles Module (Phase 6)

Daily, weekly, and phase reviews.
Aggregates metrics from all other modules to provide high-level insights.
"""

import logging
from datetime import datetime, timedelta, date
from typing import Dict, List, Optional, Any
from flask import Blueprint, request, jsonify
from pymongo import MongoClient
from bson import ObjectId

class ReviewCyclesModule:
    def __init__(self, mongo_uri: str = "mongodb://localhost:27017/"):
        self.logger = logging.getLogger(__name__)
        self.client = MongoClient(mongo_uri)
        self.db = self.client["flaskStudyPlanDB"]
        
        # Collections
        self.reviews = self.db["review_cycles"]
        self.sessions = self.db["study_sessions"]
        self.mastery = self.db["user_content_mastery"]
        self.interactions = self.db["content_interactions"]
        self.commitments = self.db["pact_commitments"]
        self.queue = self.db["priority_queue"]
        
        self._create_indexes()

    def _create_indexes(self):
        try:
            self.reviews.create_index([("user_id", 1), ("cycle_type", 1), ("period_end", -1)])
            self.logger.info("Review Cycles indexes verified/created.")
        except Exception as e:
            self.logger.error(f"Error creating review cycles indexes: {e}")

    # ============================================
    # Metrics Aggregation
    # ============================================

    def calculate_period_metrics(self, user_id: str, start: datetime, end: datetime) -> Dict[str, Any]:
        # Study Sessions
        sessions = list(self.sessions.find({
            "user_id": user_id,
            "started_at": {"$gte": start, "$lt": end}
        }))
        total_mins = sum(s.get("duration_minutes", 0) for s in sessions)
        count = len(sessions)
        
        # Interactions / Accuracy
        interactions = list(self.interactions.find({
            "user_id": user_id,
            "timestamp": {"$gte": start, "$lt": end}
        }))
        total_int = len(interactions)
        correct = sum(1 for i in interactions if i.get("is_correct"))
        accuracy = (correct / total_int * 100) if total_int > 0 else 0
        
        # Mastery promotion (simplified: status changed to 'mastered' in this period)
        # In a real system we'd check history, for now we check 'mastered_at'
        promoted = self.mastery.count_documents({
            "user_id": user_id,
            "status": "mastered",
            "mastered_at": {"$gte": start, "$lt": end}
        })
        
        # Priority distribution (current)
        matrix = self.queue.find_one({"user_id": user_id})
        counts = {"red": 0, "yellow": 0, "green": 0}
        if matrix:
            for item in matrix.get("items", []):
                p = item.get("priority", "yellow")
                if p in counts: counts[p] += 1
                
        # Streak
        pact = self.commitments.find_one({"user_id": user_id})
        streak = pact.get("streak_current", 0) if pact else 0
        
        return {
            "total_study_minutes": total_mins,
            "session_count": count,
            "avg_accuracy": round(accuracy, 2),
            "items_promoted": promoted,
            "red_items_count": counts["red"],
            "yellow_items_count": counts["yellow"],
            "green_items_count": counts["green"],
            "streak_maintained": streak > 0,
            "current_streak": streak
        }

    # ============================================
    # Routes
    # ============================================

    def register_routes(self, app):
        review_bp = Blueprint("reviews", __name__, url_prefix="/v1/reviews")

        @review_bp.route("/generate", methods=["POST"])
        def generate_review():
            data = request.json
            user_id = data.get("user_id")
            cycle_type = data.get("cycle_type", "weekly")
            if not user_id: return jsonify({"error": "user_id required"}), 400
            
            now = datetime.now()
            if cycle_type == "daily":
                start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
                days = 1
            elif cycle_type == "weekly":
                start_date = now - timedelta(days=now.weekday())
                start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
                days = 7
            else: # phase
                start_date = now - timedelta(days=30)
                days = 30
                
            metrics = self.calculate_period_metrics(user_id, start_date, now)
            
            # Wins & Challenges Detection
            wins = []
            if metrics["avg_accuracy"] > 80: wins.append("High accuracy maintained!")
            if metrics["items_promoted"] > 5: wins.append(f"Mastered {metrics['items_promoted']} items!")
            if metrics["streak_maintained"]: wins.append("Kept your study streak alive!")
            
            challenges = []
            if metrics["avg_accuracy"] < 70 and metrics["session_count"] > 0:
                challenges.append("Accuracy is below target - consider reviewing RED items.")
            if metrics["red_items_count"] > 10:
                challenges.append("Large backlog of RED items needing attention.")
                
            review = {
                "user_id": user_id,
                "cycle_type": cycle_type,
                "period_start": start_date,
                "period_end": now,
                "metrics": metrics,
                "wins": wins,
                "challenges": challenges,
                "ai_insights": "You're showing consistent effort! Keep focusing on your weak points.",
                "created_at": now
            }
            
            res = self.reviews.insert_one(review)
            review["_id"] = str(res.inserted_id)
            
            return jsonify(review), 201

        @review_bp.route("/latest", methods=["GET"])
        def get_latest():
            user_id = request.args.get("user_id")
            cycle_type = request.args.get("cycle_type", "weekly")
            if not user_id: return jsonify({"error": "user_id required"}), 400
            
            review = self.reviews.find_one(
                {"user_id": user_id, "cycle_type": cycle_type},
                sort=[("period_end", -1)]
            )
            if not review: return jsonify({"error": "No reviews found"}), 404
            
            review["_id"] = str(review["_id"])
            return jsonify(review)

        app.register_blueprint(review_bp)
