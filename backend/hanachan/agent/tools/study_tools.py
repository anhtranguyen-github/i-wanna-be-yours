from typing import List, Dict, Any, Optional
from langchain_core.tools import tool
from services.study_service import StudyServiceClient
import json

study_client = StudyServiceClient()

@tool
def generate_suggested_goals(user_id: str, focus_area: Optional[str] = None, token: Optional[str] = None) -> str:
    """
    Analyzes the user's current study plan AND long-term memory to suggest 3 actionable SMART goals.
    Use this when the user asks 'What should I study today?' or if they seem lost.
    It takes into account persistent struggle points identified in the learner context.
    """
    summary = study_client.get_active_plan_summary(user_id, token=token)
    if not summary:
        return "No active study plan found. I recommend creating one first!"
    
    # We rely on the core_agent providing the 'learner_context' which includes struggles.
    # However, tools don't directly see the system prompt context. 
    # The agent uses its 'thought' process to merge them.
    # But we can also proactively fetch trends here.
    trends = study_client.get_performance_trends(user_id, token=token)
    struggles = trends.get("identified_struggles", [])
    
    suggestion = f"Based on your N{summary.get('target_level')} plan focus on '{summary.get('current_milestone')}', "
    if struggles:
        suggestion += f"and your persistent struggle points ({', '.join(struggles)}), I suggest these prioritized goals:\n"
        suggestion += f"1. Intensive review of {struggles[0]} logic (High Priority).\n"
    else:
        suggestion += "I suggest these goals:\n"
        suggestion += "1. Master 15 new vocabulary items related to this milestone.\n"
        
    suggestion += "2. Complete 1 practice quiz with a score of >80%.\n"
    suggestion += "3. Review 5 kanji you previously struggled with."
    
    return suggestion

@tool
def audit_study_progress(user_id: str, token: Optional[str] = None) -> str:
    """
    Performs a deep audit of the user's study habits and progress health.
    Returns strengths, weaknesses, and habit-score based on recent sessions.
    """
    stats = study_client.get_learner_stats(user_id, token=token)
    summary = study_client.get_active_plan_summary(user_id, token=token)
    
    if not stats or not summary:
        return "I need more study data before I can perform a meaningful audit."
    
    streak = stats['streak'].get('current', 0)
    health = summary.get('health_status', 'on_track')
    
    status_map = {
        "on_track": "Neural pathways are forming at the expected rate. Excellent consistency.",
        "ahead": "You are surpassing the baseline synchronization speed! Perhaps we can increase the challenge?",
        "slightly_behind": "The signal is weakening. A 15-minute review session today could stabilize your progress.",
        "significantly_behind": "Critical sync loss imminent. Let's recalibrate your milestones to something more manageable."
    }
    
    return (
        f"### STUDY AUDIT REPORT ###\n"
        f"Status: {health.upper()}\n"
        f"Streak: {streak} days\n"
        f"Analysis: {status_map.get(health, 'Status unknown.')}\n"
        f"Recommendation: Keep your {streak}-day momentum going with a quick vocabulary drill."
    )

@tool
def prepare_milestone_exam(user_id: str, token: Optional[str] = None) -> str:
    """
    Generates a mock exam structure based on the current milestone contents.
    The output should be used to guide the next phase of tutoring.
    """
    summary = study_client.get_active_plan_summary(user_id, token=token)
    if not summary:
        return "I can only prepare exams for users with an active study plan."
        
    milestone = summary.get('current_milestone', 'General Review')
    level = summary.get('target_level', 'Unknown')
    
    return (
        f"### {level} MILESTONE EXAM: {milestone} ###\n"
        "I have constructed a mock assessment with 10 questions covering:\n"
        "- Reading comprehension (3 questions)\n"
        "- Grammar structure (4 questions)\n"
        "- Vocabulary context (3 questions)\n\n"
        "Shall we begin the first section, or would you like a quick review first?"
    )

@tool
def perform_detailed_audit(user_id: str, summary: str, note_quality_score: int, note_audit_details: str, quantitative_stats: Optional[Dict[str, Any]] = None) -> str:
    """
    Dumps a comprehensive performance audit into the 'Performance trackings' collection.
    Use this after evaluating the user's performance, including their note quality and quantitative stats.
    - summary: High-level summary of the audit.
    - note_quality_score: 1-10 score for the user's note/writing quality.
    - note_audit_details: Specific feedback on the user's notes.
    - quantitative_stats: (Optional) Dictionary containing stats like correct_answers, time_spent, etc.
    """
    data = {
        "type": "detailed_audit",
        "summary": summary,
        "note_quality_score": note_quality_score,
        "note_audit_details": note_audit_details,
        "quantitative_stats": quantitative_stats or {},
        "raw_agent_analysis": f"Audit performed by Hanachan. Quality: {note_quality_score}/10."
    }
    success = study_client.save_performance_tracking(user_id, data)
    if success:
        return "Performance audit successfully dumped to 'Performance trackings' collection."
    return "Failed to save performance audit."

@tool
def update_goal_progress(user_id: str, goal_id: str, completed: bool = True) -> str:
    """
    Automatically updates the completion status of a daily study goal.
    Use this when the user successfully completes a task during the interaction.
    """
    success = study_client.update_goal_status(goal_id, completed)
    if success:
        status = "completed" if completed else "active"
        return f"Goal {goal_id} successfully marked as {status}."
    return f"Failed to update goal {goal_id}."

@tool
def query_learning_records(user_id: str, query_type: str, token: Optional[str] = None) -> str:
    """
    Queries past learning records for specific items like 'exams', 'flashcards', 'games', 'attempts', or 'results'.
    Use this when the user asks specific questions about their history.
    - query_type: One of ['exams', 'flashcards', 'games', 'attempts', 'results']
    """
    records = study_client.get_user_activity_records(user_id, token=token)
    if not records:
        return "No learning records found."
    
    # Filter based on query type (simplified logic)
    filtered = [r for r in records if query_type.lower() in r.get('type', '').lower() or query_type.lower() in r.get('activity_type', '').lower()]
    
    if not filtered:
        return f"I couldn't find any specific records for '{query_type}'."
    
    result = [f"Found {len(filtered)} records for '{query_type}':"]
    for r in filtered[:5]:
        result.append(f"- {r.get('date')}: {r.get('type')} (Output: {r.get('output')}, Score: {r.get('score')})")
    
    return "\n".join(result)

@tool
def recalibrate_study_priorities(user_id: str, prioritized_topics: List[str], adjustments: Optional[List[Dict[str, Any]]] = None, token: Optional[str] = None) -> str:
    """
    Proactively updates the study plan's daily goals and priorities based on long-term trends.
    Use this when you identify that the user is struggling with specific topics (from LTM) that aren't being addressed.
    - prioritized_topics: List of strings (e.g., ['particles', 'passive_form']) to focus on.
    - adjustments: (Optional) List of dicts, e.g., [{'id': 'goal_id', 'fields': {'priority': 3}}]
    """
    import requests
    import os
    import logging
    
    logger = logging.getLogger(__name__)
    
    base_url = os.environ.get("STUDY_PLAN_SERVICE_URL", "http://localhost:5500")
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    
    # 1. Fetch user's goals
    try:
        res = requests.get(f"{base_url}/v1/smart-goals/", headers=headers, params={"user_id": user_id}, timeout=5)
        logger.info(f"🔍 [Recalibrate] Fetched goals: status={res.status_code}")
        if res.status_code != 200:
            return f"Failed to fetch goals: {res.text}"
        goals = res.json()
        logger.info(f"🔍 [Recalibrate] Found {len(goals)} goals for user {user_id}")
    except Exception as e:
        return f"Error fetching goals: {str(e)}"
    
    if not goals:
        return "No goals found to recalibrate."
    
    # 2. Match goals to prioritized topics and prepare updates
    updates_to_make = []
    topics_lower = [t.lower() for t in prioritized_topics]
    
    for goal in goals:
        goal_title_lower = goal.get("title", "").lower()
        goal_id = goal.get("_id")
        logger.info(f"🔍 [Recalibrate] Checking goal: '{goal_title_lower}' (id: {goal_id})")
        
        # Check if any prioritized topic keyword appears in the goal title
        for topic in topics_lower:
            # Split topic into words for flexible matching
            topic_words = topic.replace("_", " ").split()
            for word in topic_words:
                if len(word) >= 4 and word in goal_title_lower:  # Require word length >= 4 to avoid short matches
                    logger.info(f"✅ [Recalibrate] Matched word '{word}' from topic '{topic}' to goal '{goal_title_lower}'")
                    updates_to_make.append({
                        "id": goal_id,
                        "fields": {"priority": 3}  # Set to high priority
                    })
                    break
            else:
                continue  # Continue if inner loop didn't break
            break  # Break outer loop if inner loop broke

    
    if not updates_to_make:
        return f"No goals matched the prioritized topics: {', '.join(prioritized_topics)}. Consider creating new goals for these areas."
    
    logger.info(f"🔍 [Recalibrate] Sending {len(updates_to_make)} updates to batch endpoint")
    
    # 3. Batch update the matched goals
    success = study_client.batch_update_goals(user_id, updates_to_make, token=token)
    logger.info(f"🔍 [Recalibrate] Batch update result: {success}")
    
    if not success:
        return "Failed to update goal priorities."
    
    topics_str = ", ".join(prioritized_topics)
    return f"Recalibration complete. I have elevated the priority of {len(updates_to_make)} goals related to: {topics_str}. Your study plan is now optimized for your current struggle points."


