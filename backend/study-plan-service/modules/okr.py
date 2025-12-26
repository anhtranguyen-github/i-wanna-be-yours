"""
OKR System Module (Phase 2)

Objectives and Key Results.
Tracks high-level objectives and automatically updates Key Results from activity data.
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Any
from flask import Blueprint, request, jsonify
from pymongo import MongoClient
from bson import ObjectId
import math
from typing import Dict, List, Optional, Any, Union

def ensure_aware(dt):
    if dt is None: return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt

class OKRModule:
    def __init__(self, mastery_module, mongo_uri: str = "mongodb://localhost:27017/", client: Optional[MongoClient] = None):
        self.logger = logging.getLogger(__name__)
        self.client = client or MongoClient(mongo_uri)
        self.db = self.client["flaskStudyPlanDB"]
        self.mastery = mastery_module
        
        # Collections
        self.objectives = self.db["okr_objectives"]
        
        # External DB Connections
        self.jmdict_db = self.client["jmdictDatabase"]
        self.grammar_db = self.client["zenRelationshipsAutomated"]
        
        if not isinstance(self.client, MongoClient) or self.client.address is not None:
             # Only create indexes if it's a real client or mongomock client that supports it
             # mongomock address is usually None or dummy
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
            current = self.mastery.get_mastery_count(user_id, "vocabulary", status=None)
        elif source == "grammar":
            current = self.mastery.get_mastery_count(user_id, "grammar", status=None)
        elif source == "kanji":
            current = self.mastery.get_mastery_count(user_id, "kanji", status=None)
        elif source == "study_time":
            current = self.mastery.get_study_time(user_id)
        elif source == "flashcards":
            current = self.mastery.get_review_count(user_id)
        
        # Update history
        now = datetime.now(timezone.utc)
        history = kr.get("history", [])
        # Ensure old history dates are aware
        for h in history:
            h["date"] = ensure_aware(h["date"])
            
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
        deadline = ensure_aware(okr.get("deadline"))
        if not deadline: return "low"
        
        now = datetime.now(timezone.utc)
        created = ensure_aware(okr.get("created_at")) or now
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
            
            now = datetime.now(timezone.utc)
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
                needs_update = False
                for kr in o["key_results"]:
                    # Recalculate 'current' and 'progress_percent' for vocab/grammar/kanji sources
                    old_current = kr.get("current")
                    self.refresh_key_result(kr, user_id)
                    if kr.get("current") != old_current:
                        needs_update = True
                        
                    kr["id"] = str(kr["id"])
                    
                    # Attach underlying mastered items for the popup
                    source = kr.get("data_source")
                    if source in ["vocabulary", "grammar", "kanji"]:
                        items = list(self.mastery.mastery.find({
                            "user_id": user_id,
                            "content_type": source
                        }).limit(50))
                        
                        for item in items:
                            item["_id"] = str(item["_id"])
                            item["id"] = item.get("_id")
                            
                            # Real Join logic
                            title = item.get("content_id")
                            level = "N3" # Fallback
                            
                            if source == "vocabulary":
                                # Try to find in jmdict
                                entry = None
                                try:
                                    if ObjectId.is_valid(item.get("content_id")):
                                        entry = self.jmdict_db.entries.find_one({"_id": ObjectId(item.get("content_id"))})
                                    if not entry:
                                        entry = self.jmdict_db.entries.find_one({"expression": item.get("content_id")})
                                except:
                                    pass
                                
                                if entry:
                                    title = entry.get("expression") or entry.get("reading")
                                    # JMDict doesn't have levels easy, we can try to guess from tags but N3 is safe for now
                            
                            elif source == "grammar":
                                entry = None
                                try:
                                    if ObjectId.is_valid(item.get("content_id")):
                                        entry = self.grammar_db.grammars.find_one({"_id": ObjectId(item.get("content_id"))})
                                    if not entry:
                                        entry = self.grammar_db.grammars.find_one({"title": item.get("content_id")})
                                except:
                                    pass
                                
                                if entry:
                                    title = entry.get("title")
                                    tag = entry.get("p_tag", "")
                                    if "N" in tag: level = tag.split("_")[-1]

                            item["title"] = title
                            item["level"] = level
                            item["type"] = source
                            # Ensure frontend compatibility
                            if "performance" not in item:
                                accuracy = item.get("stats", {}).get("accuracy_percent", 0)
                                streak = item.get("stats", {}).get("streak", 0)
                                if accuracy >= 100: item["performance"] = "perfect"
                                elif accuracy >= 90: item["performance"] = "high"
                                elif accuracy >= 60: item["performance"] = "medium"
                                else: item["performance"] = "low"
                            
                        kr["items"] = items
                
                if needs_update:
                    self.objectives.update_one({"_id": ObjectId(o["_id"])}, {"$set": {"key_results": o["key_results"]}})
                    # Also update aggregate progress
                    o["progress_percent"] = sum(kr["progress_percent"] for kr in o["key_results"]) / len(o["key_results"]) if o["key_results"] else 0
                    self.objectives.update_one({"_id": ObjectId(o["_id"])}, {"$set": {"progress_percent": o["progress_percent"]}})

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
            okr["updated_at"] = datetime.now(timezone.utc)
            
            self.objectives.update_one({"_id": ObjectId(id)}, {"$set": okr})
            return jsonify({"message": "Refreshed", "progress": okr["progress_percent"]})

        app.register_blueprint(okr_bp)
