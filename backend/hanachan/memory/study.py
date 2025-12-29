from typing import Optional, List, Dict, Any
import logging
from services.study_service import StudyServiceClient
from memory.semantic import SemanticMemory

logger = logging.getLogger("hanachan.memory.study")

class StudyMemory:
    """
    Isolated memory module that provides learner-specific study context.
    Fetches real-time data from the Study Plan Service.
    """
    def __init__(self):
        self.client = StudyServiceClient()
        self.semantic = SemanticMemory()

    def retrieve_learner_context(self, user_id: str, token: Optional[str] = None) -> str:
        """
        Retrieves a formatted string containing the user's current study status.
        """
        if not user_id:
            return ""

        plan = self.client.get_active_plan_summary(user_id, token=token)
        if not plan:
            return ""
        
        # Some methods in StudyServiceClient already have token support (from my previous edit or existing)
        # Let's ensure we pass it to all that need it.
        goals = self.client.get_daily_goals(user_id, token=token)
        stats = self.client.get_learner_stats(user_id, token=token)
        perf_history = self.client.get_performance_history(user_id, token=token)
        perf_trends = self.client.get_performance_trends(user_id, token=token)
        activity_records = self.client.get_user_activity_records(user_id, token=token)
        
        # Retrieve persistent struggle points from Semantic Memory
        # We query for nodes the user STRUGGLES_WITH
        semantic_struggles = self._retrieve_struggles(user_id)

        context = [
            "### LEARNER PROFILE & STUDY PROGRESS ###",
            f"Active Plan: {plan.get('title')} ({plan.get('target_level')})",
            f"Overall Progress: {plan.get('progress_percent')}%",
            f"Health Status: {plan.get('health_status')}",
            f"Current Focus: {plan.get('current_milestone')}",
            f"Days left until Exam: {self._days_until(plan.get('exam_date'))}"
        ]

        if activity_records:
            context.append("\nRECENT LEARNING ACTIVITIES (Record Vault):")
            for rec in activity_records[:5]:
                context.append(f"- {rec.get('date')}: {rec.get('type')} ({rec.get('output')}, Score: {rec.get('score')})")

        if perf_history:
            context.append("\nPREVIOUS AGENT PERFORMANCE AUDITS:")
            for p in perf_history[:3]:
                context.append(f"- {p.get('timestamp')}: Quality: {p.get('note_quality_score')}/10. Summary: {p.get('summary')}")

        if semantic_struggles:
            context.append("\nLONG-TERM KNOWLEDGE GAPS (from Graph Memory):")
            context.append(f"- The user persistently struggles with: {', '.join(semantic_struggles)}")

        if perf_trends and perf_trends.get("identified_struggles"):
            context.append("\nRECENT PERFORMANCE TRENDS (Struggle Points):")
            context.append(f"- Identified struggles: {', '.join(perf_trends['identified_struggles'])}")
            context.append(f"- Recent note quality: {perf_trends.get('avg_note_quality', 0)}/10")
            context.append("- ACTION: Use 'recalibrate_study_priorities' to address these gaps.")

        if goals:
            context.append("\nTODAY'S STUDY GOALS:")
            for goal in goals:
                status = "✅" if goal.get("completed") else "⏳"
                context.append(f"{status} {goal.get('title')} ({goal.get('skill_category')}) [ID: {goal.get('_id') or goal.get('id')}]")

        if stats and stats.get("streak"):
            context.append(f"\nStudy Streak: {stats['streak'].get('current', 0)} days")

        if plan.get("recommendations"):
            context.append("\nAI STUDY ADVICE:")
            for rec in plan["recommendations"]:
                context.append(f"- {rec.get('message')}")

        return "\n".join(context)

    def _days_until(self, date_str: Optional[str]) -> str:
        if not date_str:
            return "N/A"
        try:
            from datetime import datetime
            exam_date = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
            delta = exam_date.date() - datetime.now().date()
            return f"{max(0, delta.days)} days"
        except:
            return "N/A"

    def _retrieve_struggles(self, user_id: str) -> List[str]:
        """Queries Neo4j for nodes connected to User via STRUGGLES_WITH."""
        if not self.semantic or not self.semantic.graph:
            return []
        try:
            cypher = """
                MATCH (u:User {id: $user_id})-[:STRUGGLES_WITH]->(n)
                RETURN n.id as topic
            """
            results = self.semantic.graph.query(cypher, {"user_id": str(user_id)})
            return [r["topic"] for r in results]
        except Exception as e:
            logger.error(f"Failed to retrieve struggles from Neo4j: {e}")
            return []
