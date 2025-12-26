"""
UI Preferences and Study Session Module

Handles:
- User UI preferences (card collapse states)
- Study session logging
- Reflection entries
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional
from flask import Blueprint, request, jsonify
from pymongo import MongoClient
from bson import ObjectId
from utils.auth import login_required


class UserPreferencesModule:
    """
    Handles user UI preferences and study session tracking.
    """

    def __init__(self, mongo_uri: str = "mongodb://localhost:27017/"):
        self.logger = logging.getLogger(__name__)
        self.client = MongoClient(mongo_uri)
        self.db = self.client["flaskStudyPlanDB"]
        
        # Collections
        self.ui_preferences = self.db["ui_preferences"]
        self.study_sessions = self.db["study_sessions"]
        self.reflections = self.db["reflection_entries"]
        
        self._create_indexes()

    def _create_indexes(self):
        try:
            self.ui_preferences.create_index([("user_id", 1)], unique=True)
            self.study_sessions.create_index([("user_id", 1), ("created_at", -1)])
            self.study_sessions.create_index([("skill", 1)])
            self.reflections.create_index([("user_id", 1), ("week_start_date", -1)])
            self.logger.info("User preferences indexes created")
        except Exception as e:
            self.logger.error(f"Error creating indexes: {e}")

    # ============================================
    # UI Preferences
    # ============================================

    def get_preferences(self, user_id: str) -> Dict:
        """Get user's UI preferences."""
        prefs = self.ui_preferences.find_one({"user_id": user_id})
        if not prefs:
            return {
                "user_id": user_id,
                "expanded_cards": {},
                "theme": "light",
                "created_at": datetime.now(timezone.utc)
            }
        prefs["_id"] = str(prefs["_id"])
        return prefs

    def update_preferences(self, user_id: str, updates: Dict) -> Dict:
        """Update user's UI preferences."""
        now = datetime.now(timezone.utc)
        
        result = self.ui_preferences.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    **updates,
                    "updated_at": now
                },
                "$setOnInsert": {
                    "user_id": user_id,
                    "created_at": now
                }
            },
            upsert=True
        )
        
        return {"success": True, "modified": result.modified_count > 0}

    # ============================================
    # Study Sessions
    # ============================================

    def log_session(self, user_id: str, session_data: Dict) -> str:
        """Log a study session."""
        now = datetime.now(timezone.utc)
        
        session = {
            "user_id": user_id,
            "skill": session_data.get("skill", "mixed"),
            "effort_level": session_data.get("effort_level", "focused"),
            "duration_minutes": session_data.get("duration_minutes", 0),
            "linked_key_result_id": session_data.get("linked_key_result_id"),
            "notes": session_data.get("notes"),
            "created_at": now
        }
        
        result = self.study_sessions.insert_one(session)
        return str(result.inserted_id)

    def get_sessions(self, user_id: str, limit: int = 20, skill: Optional[str] = None) -> List[Dict]:
        """Get user's recent study sessions."""
        query = {"user_id": user_id}
        if skill:
            query["skill"] = skill
            
        sessions = list(
            self.study_sessions.find(query)
            .sort("created_at", -1)
            .limit(limit)
        )
        
        for s in sessions:
            s["_id"] = str(s["_id"])
            s["id"] = s["_id"]
            
        return sessions

    def get_streak(self, user_id: str) -> Dict:
        """Calculate study streak based on sessions."""
        sessions = list(
            self.study_sessions.find({"user_id": user_id})
            .sort("created_at", -1)
            .limit(100)
        )
        
        if not sessions:
            return {"current": 0, "longest": 0}
        
        # Group by date
        from collections import defaultdict
        days = defaultdict(int)
        for s in sessions:
            date_key = s["created_at"].date()
            days[date_key] += s.get("duration_minutes", 0)
        
        # Calculate streak
        today = datetime.now(timezone.utc).date()
        current_streak = 0
        longest_streak = 0
        temp_streak = 0
        
        sorted_days = sorted(days.keys(), reverse=True)
        
        for i, day in enumerate(sorted_days):
            if i == 0:
                # Check if studied today or yesterday
                diff = (today - day).days
                if diff <= 1:
                    temp_streak = 1
                else:
                    break
            else:
                prev_day = sorted_days[i - 1]
                if (prev_day - day).days == 1:
                    temp_streak += 1
                else:
                    break
        
        current_streak = temp_streak
        longest_streak = max(current_streak, longest_streak)
        
        return {"current": current_streak, "longest": longest_streak}

    # ============================================
    # Reflections
    # ============================================

    def create_reflection(self, user_id: str, content: str, week_start: Optional[datetime] = None) -> str:
        """Create a weekly reflection entry."""
        now = datetime.now(timezone.utc)
        
        # Default to start of current week
        if not week_start:
            week_start = now - timedelta(days=now.weekday())
            week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
        
        reflection = {
            "user_id": user_id,
            "week_start_date": week_start,
            "content": content,
            "created_at": now
        }
        
        result = self.reflections.insert_one(reflection)
        return str(result.inserted_id)

    def get_reflections(self, user_id: str, limit: int = 10) -> List[Dict]:
        """Get user's recent reflections."""
        reflections = list(
            self.reflections.find({"user_id": user_id})
            .sort("created_at", -1)
            .limit(limit)
        )
        
        for r in reflections:
            r["_id"] = str(r["_id"])
            r["id"] = r["_id"]
            
        return reflections

    # ============================================
    # Routes
    # ============================================

    def register_routes(self, app):
        prefs_bp = Blueprint("user_prefs", __name__, url_prefix="/v1/user")

        @prefs_bp.route("/ui-preferences", methods=["GET"])
        def get_ui_preferences():
            user_id = request.args.get("user_id")
            if not user_id:
                return jsonify({"error": "user_id required"}), 400
            
            prefs = self.get_preferences(user_id)
            return jsonify(prefs)

        @prefs_bp.route("/ui-preferences", methods=["PATCH"])
        def update_ui_preferences():
            data = request.json
            user_id = data.get("user_id")
            if not user_id:
                return jsonify({"error": "user_id required"}), 400
            
            updates = {k: v for k, v in data.items() if k != "user_id"}
            result = self.update_preferences(user_id, updates)
            return jsonify(result)

        @prefs_bp.route("/sessions", methods=["POST"])
        def log_study_session():
            data = request.json
            user_id = data.get("user_id")
            if not user_id:
                return jsonify({"error": "user_id required"}), 400
            
            session_id = self.log_session(user_id, data)
            return jsonify({"id": session_id}), 201

        @prefs_bp.route("/sessions", methods=["GET"])
        def get_study_sessions():
            user_id = request.args.get("user_id")
            if not user_id:
                return jsonify({"error": "user_id required"}), 400
            
            limit = int(request.args.get("limit", 20))
            skill = request.args.get("skill")
            
            sessions = self.get_sessions(user_id, limit, skill)
            return jsonify({"sessions": sessions})

        @prefs_bp.route("/streak", methods=["GET"])
        def get_study_streak():
            user_id = request.args.get("user_id")
            if not user_id:
                return jsonify({"error": "user_id required"}), 400
            
            streak = self.get_streak(user_id)
            return jsonify(streak)

        @prefs_bp.route("/reflections", methods=["POST"])
        def create_reflection():
            data = request.json
            user_id = data.get("user_id")
            content = data.get("content")
            
            if not user_id or not content:
                return jsonify({"error": "user_id and content required"}), 400
            
            reflection_id = self.create_reflection(user_id, content)
            return jsonify({"id": reflection_id}), 201

        @prefs_bp.route("/reflections", methods=["GET"])
        def get_reflections():
            user_id = request.args.get("user_id")
            if not user_id:
                return jsonify({"error": "user_id required"}), 400
            
            limit = int(request.args.get("limit", 10))
            reflections = self.get_reflections(user_id, limit)
            return jsonify({"reflections": reflections})

        app.register_blueprint(prefs_bp)
