"""
Performance Module (Phase 1)

Handles dumping and retrieval of semi-structured performance audits from the Agent.
Includes note quality auditing and quantitative performance summaries.
"""

import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from flask import Blueprint, request, jsonify
from pymongo import MongoClient
from bson import ObjectId
from utils.auth import login_required

class PerformanceModule:
    def __init__(self, mongo_uri: str = "mongodb://localhost:27017/"):
        self.logger = logging.getLogger(__name__)
        self.client = MongoClient(mongo_uri)
        self.db = self.client["flaskStudyPlanDB"]
        
        # Collections
        self.performance_trackings = self.db["performance_trackings"]
        
        self._create_indexes()

    def _create_indexes(self):
        try:
            self.performance_trackings.create_index([("user_id", 1), ("timestamp", -1)])
            self.logger.info("Performance trackings indexes verified.")
        except Exception as e:
            self.logger.error(f"Error creating performance indexes: {e}")

    def log_tracking(self, user_id: str, data: Dict[str, Any]) -> str:
        entry = {
            "user_id": user_id,
            "timestamp": datetime.now(timezone.utc),
            "type": data.get("type", "general_audit"),
            "summary": data.get("summary"),
            "note_quality_score": data.get("note_quality_score"),
            "note_audit_details": data.get("note_audit_details"),
            "quantitative_stats": data.get("quantitative_stats", {}),
            "raw_agent_analysis": data.get("raw_agent_analysis"),
            "metadata": data.get("metadata", {})
        }
        res = self.performance_trackings.insert_one(entry)
        return str(res.inserted_id)

    def get_user_history(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        cursor = self.performance_trackings.find({"user_id": user_id}).sort("timestamp", -1).limit(limit)
        results = []
        for doc in cursor:
            doc["_id"] = str(doc["_id"])
            if isinstance(doc.get("timestamp"), datetime):
                doc["timestamp"] = doc["timestamp"].isoformat()
            results.append(doc)
        return results

    def get_trends(self, user_id: str, days: int = 30) -> Dict[str, Any]:
        """Analyzes historical audits for persistent weak points or trends."""
        from datetime import timedelta
        since = datetime.now(timezone.utc) - timedelta(days=days)
        
        cursor = self.performance_trackings.find({
            "user_id": user_id,
            "timestamp": {"$gte": since}
        }).sort("timestamp", -1)
        
        audits = list(cursor)
        if not audits:
            return {"status": "no_data", "trends": []}
            
        # Basic trend analysis: average note quality
        scores = [a.get("note_quality_score") for a in audits if a.get("note_quality_score") is not None]
        avg_quality = sum(scores) / len(scores) if scores else 0
        
        # Extract common struggle keywords from audit details (simplified)
        # In a real app, this might use NLP or structured fields
        struggle_points = []
        for a in audits:
            details = a.get("note_audit_details", "").lower()
            summary = a.get("summary", "").lower()
            text_to_check = details + " " + summary
            
            if "passive" in text_to_check: struggle_points.append("passive_form")
            if "particle" in text_to_check: struggle_points.append("particles")
            if "kanji" in text_to_check: struggle_points.append("kanji_recall")
            
        # Most frequent struggle points
        from collections import Counter
        common_struggles = [item for item, count in Counter(struggle_points).most_common(3)]
        
        return {
            "status": "success",
            "period_days": days,
            "audit_count": len(audits),
            "avg_note_quality": round(avg_quality, 2),
            "identified_struggles": common_struggles,
            "latest_audit_summary": audits[0].get("summary") if audits else None
        }

    def register_routes(self, app):
        perf_bp = Blueprint("performance", __name__, url_prefix="/v1/performance")

        @perf_bp.route("/trackings", methods=["POST"])
        @login_required
        def create_tracking():
            user_id = request.user.get("userId") or request.user.get("id")
            data = request.json
            tracking_id = self.log_tracking(user_id, data)
            return jsonify({"id": tracking_id, "message": "Performance tracking saved"}), 201

        @perf_bp.route("/trackings", methods=["GET"])
        @login_required
        def list_trackings():
            user_id = request.user.get("userId") or request.user.get("id")
            limit = request.args.get("limit", 10, type=int)
            history = self.get_user_history(user_id, limit)
            return jsonify({"trackings": history})

        @perf_bp.route("/trends", methods=["GET"])
        @login_required
        def get_user_trends():
            user_id = request.user.get("userId") or request.user.get("id")
            days = request.args.get("days", 30, type=int)
            trends = self.get_trends(user_id, days)
            return jsonify(trends)

        app.register_blueprint(perf_bp)
