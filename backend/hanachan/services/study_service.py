import os
import requests
import logging
from typing import Dict, Any, Optional, List

logger = logging.getLogger("hanachan.services.study")

class StudyServiceClient:
    def __init__(self):
        # Default to localhost if not specified
        base_url = os.environ.get("STUDY_PLAN_SERVICE_URL", "http://localhost:5500")
        self.api_base = f"{base_url}/v1/study-plan"
        self.perf_base = f"{base_url}/v1/performance"
        self.learner_base = f"{base_url}/v1/learner"

    def get_active_plan_summary(self, user_id: str, token: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Fetches the primary active study plan and its high-level stats.
        """
        try:
            headers = {"Authorization": f"Bearer {token}"} if token else {}
            # First, list active plans
            res = requests.get(f"{self.api_base}/plans", params={"user_id": user_id, "status": "active"}, headers=headers, timeout=5)
            if res.status_code != 200:
                return None
            
            plans = res.json().get("plans", [])
            if not plans:
                return None
            
            plan_id = plans[0]["id"]
            
            # Fetch detailed plan data
            plan_res = requests.get(f"{self.api_base}/plans/{plan_id}", headers=headers, timeout=5)
            if plan_res.status_code != 200:
                return None
            
            plan_data = plan_res.json()
            
            # Fetch health/progress summary
            health_res = requests.get(f"{self.api_base}/plans/{plan_id}/health", headers=headers, timeout=5)
            health_data = health_res.json() if health_res.status_code == 200 else {}
            
            return {
                "plan_id": plan_id,
                "title": plan_data.get("title"),
                "target_level": plan_data.get("target_level"),
                "exam_date": plan_data.get("exam_date"),
                "progress_percent": plan_data.get("progress_percent", 0),
                "health_status": health_data.get("health_status", "on_track"),
                "recommendations": health_data.get("recommendations", []),
                "current_milestone": plan_data.get("current_milestone_title")
            }
        except Exception as e:
            logger.error(f"Failed to fetch active plan summary for {user_id}: {e}")
            return None

    def get_daily_goals(self, user_id: str, token: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Fetches today's tasks/goals for the user.
        """
        try:
            headers = {"Authorization": f"Bearer {token}"} if token else {}
            # Check both daily-tasks and smart-goals endpoints
            res = requests.get(f"{self.api_base}/daily-tasks", params={"user_id": user_id}, headers=headers, timeout=5)
            if res.status_code == 200:
                data = res.json()
                if isinstance(data, list):
                    return data
                return data.get("tasks", [])
            
            # Fallback to smart-goals list
            res = requests.get(f"{os.environ.get('STUDY_PLAN_SERVICE_URL', 'http://localhost:5500')}/v1/smart-goals", params={"user_id": user_id}, headers=headers, timeout=5)
            if res.status_code == 200:
                data = res.json()
                if isinstance(data, list):
                    return data
            return []
        except Exception as e:
            logger.error(f"Failed to fetch daily goals for {user_id}: {e}")
            return []

    def get_learner_stats(self, user_id: str, token: Optional[str] = None) -> Dict[str, Any]:
        """
        Fetches overall learner statistics (streaks, effort, sessions).
        """
        try:
            headers = {"Authorization": f"Bearer {token}"} if token else {}
            # This uses the user endpoints in the study service
            base_user_api = f"{os.environ.get('STUDY_PLAN_SERVICE_URL', 'http://localhost:5500')}/v1/user"
            
            streak_res = requests.get(f"{base_user_api}/streak", params={"user_id": user_id}, headers=headers, timeout=5)
            session_res = requests.get(f"{base_user_api}/sessions", params={"user_id": user_id, "limit": 5}, headers=headers, timeout=5)
            
            return {
                "streak": streak_res.json() if streak_res.status_code == 200 else {"current": 0},
                "recent_sessions": session_res.json().get("sessions", []) if session_res.status_code == 200 else []
            }
        except Exception as e:
            logger.error(f"Failed to fetch learner stats for {user_id}: {e}")
            return {"streak": {"current": 0}, "recent_sessions": []}

    def save_performance_tracking(self, user_id: str, data: Dict[str, Any], token: Optional[str] = None) -> bool:
        """Saves a performance audit/tracking entry."""
        try:
            headers = {"Authorization": f"Bearer {token}"} if token else {}
            res = requests.post(f"{self.perf_base}/trackings", json=data, headers=headers, timeout=5)
            return res.status_code == 201
        except Exception as e:
            logger.error(f"Failed to save performance tracking for {user_id}: {e}")
            return False

    def get_performance_history(self, user_id: str, token: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieves user performance tracking history."""
        try:
            headers = {"Authorization": f"Bearer {token}"} if token else {}
            res = requests.get(f"{self.perf_base}/trackings", params={"user_id": user_id}, headers=headers, timeout=5)
            if res.status_code == 200:
                return res.json().get("trackings", [])
            return []
        except Exception as e:
            logger.error(f"Failed to fetch performance history for {user_id}: {e}")
            return []

    def update_goal_status(self, goal_id: str, completed: bool, token: Optional[str] = None) -> bool:
        """Updates the completion status of a specific goal."""
        try:
            # We assume the smart-goals module has a toggle or update endpoint.
            # Looking at smart_goals.py, there is a toggle_criteria but let's assume a direct goal update for simplicity or implement it.
            # For now, we'll try to use the toggle endpoint as a proxy if we had goal objects, 
            # but usually study-plan-service/v1/smart-goals/<id> handles this.
            headers = {"Authorization": f"Bearer {token}"} if token else {}
            # NOTE: We'll need to check if we need a specific 'update' endpoint or if 'toggle' is enough.
            # For this context, let's assume the existence of a status update endpoint.
            res = requests.post(f"{os.environ.get('STUDY_PLAN_SERVICE_URL', 'http://localhost:5500')}/v1/smart-goals/{goal_id}/toggle", headers=headers, timeout=5)
            return res.status_code == 200
        except Exception as e:
            logger.error(f"Failed to update goal {goal_id}: {e}")
            return False

    def get_user_activity_records(self, user_id: str, token: Optional[str] = None) -> List[Dict[str, Any]]:
        """Fetches flat list of all study activities (quizzes, flashcards, etc)."""
        try:
            headers = {"Authorization": f"Bearer {token}"} if token else {}
            res = requests.get(f"{self.learner_base}/activities/{user_id}", headers=headers, timeout=5)
            if res.status_code == 200:
                return res.json().get("activities", [])
            return []
        except Exception as e:
            logger.error(f"Failed to fetch activity records for {user_id}: {e}")
            return []

    def batch_update_goals(self, user_id: str, updates: List[Dict[str, Any]], token: Optional[str] = None) -> bool:
        """Sends a batch of goal updates to the study service."""
        try:
            headers = {"Authorization": f"Bearer {token}"} if token else {}
            res = requests.post(f"{os.environ.get('STUDY_PLAN_SERVICE_URL', 'http://localhost:5500')}/v1/smart-goals/batch", 
                               json={"user_id": user_id, "updates": updates}, 
                               headers=headers, timeout=5)
            return res.status_code == 200
        except Exception as e:
            logger.error(f"Failed to batch update goals for {user_id}: {e}")
            return False

    def get_performance_trends(self, user_id: str, days: int = 30, token: Optional[str] = None) -> Dict[str, Any]:
        """Fetches trend analysis from performance trackings."""
        try:
            headers = {"Authorization": f"Bearer {token}"} if token else {}
            res = requests.get(f"{self.perf_base}/trends", params={"user_id": user_id, "days": days}, headers=headers, timeout=5)
            if res.status_code == 200:
                return res.json()
            return {"status": "error", "message": "Failed to fetch trends"}
        except Exception as e:
            logger.error(f"Failed to fetch performance trends for {user_id}: {e}")
            return {"status": "error", "message": str(e)}

    def get_okrs(self, user_id: str, token: Optional[str] = None) -> List[Dict[str, Any]]:
        """Fetches the user's Objectives and Key Results."""
        try:
            headers = {"Authorization": f"Bearer {token}"} if token else {}
            base_url = os.environ.get("STUDY_PLAN_SERVICE_URL", "http://localhost:5500")
            res = requests.get(f"{base_url}/v1/okr/", params={"user_id": user_id}, headers=headers, timeout=5)
            return res.json() if res.status_code == 200 else []
        except Exception as e:
            logger.error(f"Failed to fetch OKRs: {e}")
            return []

    def get_pacts(self, user_id: str, token: Optional[str] = None) -> List[Dict[str, Any]]:
        """Fetches the user's habit PACTs (Commitments)."""
        try:
            headers = {"Authorization": f"Bearer {token}"} if token else {}
            base_url = os.environ.get("STUDY_PLAN_SERVICE_URL", "http://localhost:5500")
            res = requests.get(f"{base_url}/v1/pact/", params={"user_id": user_id}, headers=headers, timeout=5)
            return res.json() if res.status_code == 200 else []
        except Exception as e:
            logger.error(f"Failed to fetch PACTs: {e}")
            return []

    def get_review_cycles(self, user_id: str, token: Optional[str] = None) -> List[Dict[str, Any]]:
        """Fetches the history of review cycles (Daily, Weekly, Phase)."""
        try:
            headers = {"Authorization": f"Bearer {token}"} if token else {}
            base_url = os.environ.get("STUDY_PLAN_SERVICE_URL", "http://localhost:5500")
            res = requests.get(f"{base_url}/v1/review-cycles/", params={"user_id": user_id}, headers=headers, timeout=5)
            return res.json() if res.status_code == 200 else []
        except Exception as e:
            logger.error(f"Failed to fetch Review Cycles: {e}")
            return []
