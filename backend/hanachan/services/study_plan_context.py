"""
Study Plan Context Provider for Hanachan AI Tutor

Provides study plan-aware context to the chat agent for personalized responses.
"""

import requests
import os
from typing import Dict, Any, Optional
from datetime import datetime

# Flask API URL for study plan endpoints
FLASK_API_URL = os.getenv("FLASK_API_URL", "http://localhost:5100")


class StudyPlanContextProvider:
    """
    Fetches and formats study plan context for the AI agent.
    """

    def __init__(self, user_id: str):
        self.user_id = user_id
        self._plan_cache: Optional[Dict] = None
        self._tasks_cache: Optional[Dict] = None

    def get_active_plan(self) -> Optional[Dict[str, Any]]:
        """Fetch the user's active study plan."""
        if self._plan_cache:
            return self._plan_cache

        try:
            response = requests.get(
                f"{FLASK_API_URL}/f-api/v1/study-plan/plans",
                params={"user_id": self.user_id, "status": "active"},
                timeout=5
            )

            if response.status_code == 200:
                data = response.json()
                plans = data.get("plans", [])
                if plans:
                    # Get the first active plan
                    plan_summary = plans[0]
                    # Fetch full plan details
                    plan_id = plan_summary["id"]
                    detail_response = requests.get(
                        f"{FLASK_API_URL}/f-api/v1/study-plan/plans/{plan_id}",
                        timeout=5
                    )
                    if detail_response.status_code == 200:
                        self._plan_cache = detail_response.json()
                        return self._plan_cache

            return None

        except requests.RequestException as e:
            print(f"[StudyPlanContext] Error fetching plan: {e}")
            return None

    def get_daily_tasks(self) -> Dict[str, Any]:
        """Fetch today's tasks for the user."""
        if self._tasks_cache:
            return self._tasks_cache

        try:
            response = requests.get(
                f"{FLASK_API_URL}/f-api/v1/study-plan/daily-tasks",
                params={"user_id": self.user_id},
                timeout=5
            )

            if response.status_code == 200:
                self._tasks_cache = response.json()
                return self._tasks_cache

            return {"tasks": [], "message": "No tasks available"}

        except requests.RequestException as e:
            print(f"[StudyPlanContext] Error fetching tasks: {e}")
            return {"tasks": [], "error": str(e)}

    def get_current_milestone(self) -> Optional[Dict[str, Any]]:
        """Get the current milestone from the active plan."""
        plan = self.get_active_plan()
        if not plan:
            return None

        current_id = plan.get("current_milestone_id")
        if not current_id:
            return None

        for milestone in plan.get("milestones", []):
            if milestone.get("id") == current_id:
                return milestone

        return None

    def get_context_summary(self) -> str:
        """
        Generate a text summary of the user's study plan context.
        This is injected into the AI system prompt.
        """
        plan = self.get_active_plan()

        if not plan:
            return "User has no active study plan."

        # Build context summary
        target_level = plan.get("target_level", "Unknown")
        days_remaining = plan.get("days_remaining", 0)
        progress = plan.get("overall_progress_percent", 0)
        exam_date = plan.get("exam_date", "Unknown")

        current_milestone = self.get_current_milestone()
        milestone_info = ""
        if current_milestone:
            milestone_info = (
                f"Current milestone: \"{current_milestone.get('title')}\" "
                f"({current_milestone.get('progress_percent', 0):.0f}% complete). "
                f"Focus area: {current_milestone.get('category', 'mixed')}."
            )

        tasks_data = self.get_daily_tasks()
        tasks = tasks_data.get("tasks", [])
        completed_tasks = sum(1 for t in tasks if t.get("status") == "completed")
        total_tasks = len(tasks)
        task_info = f"Today's tasks: {completed_tasks}/{total_tasks} completed."

        summary = f"""
USER STUDY PLAN CONTEXT:
- Target: JLPT {target_level}
- Exam Date: {exam_date}
- Days Remaining: {days_remaining}
- Overall Progress: {progress:.1f}%
- {milestone_info}
- {task_info}

Use this context to provide personalized study guidance. When the user asks
about their progress, what to study, or needs motivation, reference these details.
"""
        return summary.strip()

    # ============================================
    # Learner Progress Integration
    # ============================================

    def get_learner_progress(self) -> Optional[Dict[str, Any]]:
        """Fetch the user's comprehensive learning progress."""
        try:
            response = requests.get(
                f"{FLASK_API_URL}/f-api/v1/learner/progress/{self.user_id}",
                timeout=5
            )

            if response.status_code == 200:
                return response.json()

            return None

        except requests.RequestException as e:
            print(f"[StudyPlanContext] Error fetching learner progress: {e}")
            return None

    def get_recommendations(self) -> Optional[Dict[str, Any]]:
        """Fetch personalized learning recommendations."""
        try:
            response = requests.get(
                f"{FLASK_API_URL}/f-api/v1/adaptive/recommendations/{self.user_id}",
                timeout=5
            )

            if response.status_code == 200:
                return response.json()

            return None

        except requests.RequestException as e:
            print(f"[StudyPlanContext] Error fetching recommendations: {e}")
            return None

    def get_full_context_summary(self) -> str:
        """
        Generate a comprehensive text summary including study plan AND learner progress.
        This is the enhanced version injected into the AI system prompt.
        """
        plan_context = self.get_context_summary()
        
        # Add learner progress context
        progress_data = self.get_learner_progress()
        
        if progress_data:
            progress = progress_data.get("progress", {})
            weekly_stats = progress_data.get("weekly_stats", {})
            achievements_count = progress_data.get("achievements_count", 0)
            
            progress_context = f"""
USER LEARNING PROGRESS:
- Vocabulary Mastered: {progress.get('vocabulary_mastered', 0)} words
- Kanji Learned: {progress.get('kanji_mastered', 0)} characters
- Grammar Points: {progress.get('grammar_points_learned', 0)} patterns
- Current Study Streak: {progress.get('current_streak', 0)} days (Longest: {progress.get('longest_streak', 0)})
- Total Study Time: {progress.get('total_study_time_minutes', 0)} minutes
- Achievements Earned: {achievements_count}
- This Week: {weekly_stats.get('flashcard_reviews', 0)} card reviews, {weekly_stats.get('quizzes_completed', 0)} quizzes
"""
            plan_context = plan_context + "\n\n" + progress_context.strip()

        # Add recommendations context
        recommendations = self.get_recommendations()
        if recommendations:
            recs = recommendations.get("recommendations", [])
            if recs:
                focus = recommendations.get("focus_area", "vocabulary")
                rec_str = ", ".join([r.get("title", "") for r in recs[:3]])
                rec_context = f"""
RECOMMENDED ACTIVITIES:
- Focus Area: {focus}
- Suggested Activities: {rec_str}
- Daily Goal: {recommendations.get('daily_goal_minutes', 30)} minutes
"""
                plan_context = plan_context + "\n\n" + rec_context.strip()

        return plan_context

    def get_learner_progress_artifact(self) -> Optional[Dict[str, Any]]:
        """Generate a learner progress artifact for rich UI display."""
        progress_data = self.get_learner_progress()
        if not progress_data:
            return None

        progress = progress_data.get("progress", {})
        weekly_stats = progress_data.get("weekly_stats", {})
        achievements = progress_data.get("achievements", [])

        return {
            "type": "learner_progress",
            "title": "Your Learning Progress",
            "data": {
                "vocabulary_mastered": progress.get("vocabulary_mastered", 0),
                "kanji_mastered": progress.get("kanji_mastered", 0),
                "grammar_points_learned": progress.get("grammar_points_learned", 0),
                "current_streak": progress.get("current_streak", 0),
                "longest_streak": progress.get("longest_streak", 0),
                "total_study_time_minutes": progress.get("total_study_time_minutes", 0),
                "weekly_goals": progress.get("weekly_goals", {}),
                "weekly_stats": weekly_stats,
                "recent_achievements": achievements[:5]
            }
        }

    def get_recommendations_artifact(self) -> Optional[Dict[str, Any]]:
        """Generate a recommendations artifact for rich UI display."""
        recs = self.get_recommendations()
        if not recs:
            return None

        return {
            "type": "learning_recommendations",
            "title": "Recommended For You",
            "data": {
                "focus_area": recs.get("focus_area"),
                "daily_goal_minutes": recs.get("daily_goal_minutes"),
                "recommendations": recs.get("recommendations", [])[:5]
            }
        }

    def get_plan_status_artifact(self) -> Optional[Dict[str, Any]]:
        """
        Generate a study plan status artifact for rich UI display.
        """
        plan = self.get_active_plan()
        if not plan:
            return None

        current_milestone = self.get_current_milestone()
        tasks_data = self.get_daily_tasks()
        tasks = tasks_data.get("tasks", [])

        return {
            "type": "study_plan_status",
            "title": "Your Study Plan",
            "data": {
                "target_level": plan.get("target_level"),
                "exam_date": plan.get("exam_date"),
                "days_remaining": plan.get("days_remaining"),
                "overall_progress": plan.get("overall_progress_percent", 0),
                "current_milestone": {
                    "number": current_milestone.get("milestone_number") if current_milestone else None,
                    "title": current_milestone.get("title") if current_milestone else None,
                    "progress": current_milestone.get("progress_percent", 0) if current_milestone else 0,
                    "category": current_milestone.get("category") if current_milestone else None,
                } if current_milestone else None,
                "today_completed": sum(1 for t in tasks if t.get("status") == "completed"),
                "today_total": len(tasks),
            }
        }

    def get_daily_tasks_artifact(self) -> Dict[str, Any]:
        """
        Generate a daily tasks artifact for rich UI display.
        """
        tasks_data = self.get_daily_tasks()
        tasks = tasks_data.get("tasks", [])

        return {
            "type": "daily_tasks",
            "title": "Today's Tasks",
            "data": {
                "date": datetime.utcnow().strftime("%Y-%m-%d"),
                "tasks": [
                    {
                        "id": t.get("id"),
                        "title": t.get("title"),
                        "description": t.get("description"),
                        "minutes": t.get("estimated_minutes"),
                        "completed": t.get("status") == "completed",
                        "type": t.get("task_type"),
                    }
                    for t in tasks
                ]
            }
        }


def detect_study_plan_intent(prompt: str) -> Optional[str]:
    """
    Detect if the user's message is related to study planning or learning progress.
    Returns the intent type or None if not related.
    """
    prompt_lower = prompt.lower()

    # Progress check intents
    progress_keywords = [
        "progress", "how am i doing", "how's my progress",
        "am i on track", "behind", "ahead", "status",
        "how many words", "vocabulary count", "how much have i learned"
    ]
    if any(kw in prompt_lower for kw in progress_keywords):
        return "progress_check"

    # What to study intents
    study_keywords = [
        "what should i study", "what to study", "study next",
        "what's next", "recommend", "today's tasks", "daily tasks",
        "suggest something", "what do you recommend"
    ]
    if any(kw in prompt_lower for kw in study_keywords):
        return "study_recommendation"

    # Milestone intents
    milestone_keywords = [
        "milestone", "current goal", "next milestone",
        "milestone progress"
    ]
    if any(kw in prompt_lower for kw in milestone_keywords):
        return "milestone_info"

    # Exam prep intents
    exam_keywords = [
        "jlpt", "exam", "test", "n5", "n4", "n3", "n2", "n1",
        "days until", "time left", "exam date"
    ]
    if any(kw in prompt_lower for kw in exam_keywords):
        return "exam_info"

    # Motivation/help intents
    motivation_keywords = [
        "falling behind", "struggling", "help me", "motivate",
        "too hard", "give up", "overwhelmed"
    ]
    if any(kw in prompt_lower for kw in motivation_keywords):
        return "motivation"

    # Streak/achievement intents
    streak_keywords = [
        "streak", "achievement", "achievements", "badges",
        "how long have i studied", "days in a row", "my record"
    ]
    if any(kw in prompt_lower for kw in streak_keywords):
        return "streak_achievements"

    # Stats/analytics intents
    stats_keywords = [
        "statistics", "stats", "analytics", "performance",
        "how well", "success rate", "accuracy"
    ]
    if any(kw in prompt_lower for kw in stats_keywords):
        return "learning_stats"

    return None


def enrich_agent_response(
    response: Dict[str, Any],
    user_id: str,
    intent: Optional[str]
) -> Dict[str, Any]:
    """
    Enrich the agent response with study plan and learning progress artifacts 
    based on detected intent.
    """
    if not intent:
        return response

    provider = StudyPlanContextProvider(user_id)

    artifacts = response.get("artifacts", [])

    if intent == "progress_check":
        # Add both study plan status and learner progress
        status_artifact = provider.get_plan_status_artifact()
        if status_artifact:
            artifacts.append(status_artifact)
        progress_artifact = provider.get_learner_progress_artifact()
        if progress_artifact:
            artifacts.append(progress_artifact)

    elif intent == "study_recommendation":
        # Add recommendations and daily tasks
        recs_artifact = provider.get_recommendations_artifact()
        if recs_artifact:
            artifacts.append(recs_artifact)
        tasks_artifact = provider.get_daily_tasks_artifact()
        artifacts.append(tasks_artifact)

    elif intent == "milestone_info":
        status_artifact = provider.get_plan_status_artifact()
        if status_artifact:
            artifacts.append(status_artifact)

    elif intent == "exam_info":
        status_artifact = provider.get_plan_status_artifact()
        if status_artifact:
            artifacts.append(status_artifact)

    elif intent == "streak_achievements":
        progress_artifact = provider.get_learner_progress_artifact()
        if progress_artifact:
            artifacts.append(progress_artifact)

    elif intent == "learning_stats":
        progress_artifact = provider.get_learner_progress_artifact()
        if progress_artifact:
            artifacts.append(progress_artifact)

    elif intent == "motivation":
        # Provide both progress (to show accomplishments) and recommendations
        progress_artifact = provider.get_learner_progress_artifact()
        if progress_artifact:
            artifacts.append(progress_artifact)
        recs_artifact = provider.get_recommendations_artifact()
        if recs_artifact:
            artifacts.append(recs_artifact)

    response["artifacts"] = artifacts
    return response

