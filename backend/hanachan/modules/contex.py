from typing import Any, Dict, List
from dataclasses import asdict
from datetime import date
from enum import Enum


from modules.data_models import (
    CurrentConversationGoal, Prompt, LearningGoal, RetrievedKnowledgeItem, 
    Speaker, Turn, UserProfileModel, UserQuery, QueryType, 
    QueryPart, GoalStatus, KnowledgeType
)

# --- Context Component Implementations ---

class UserProfile:
    def __init__(self):
        pass

    def _get_profile_data(self, user_id: str) -> UserProfileModel:
        """Core logic to fetch user profile data, including learning goals."""
        
        goals = [
            LearningGoal(
                goal_id="goal789",
                topic="JLPT N4 Vocabulary",
                status=GoalStatus.ACTIVE,
                proficiency_target="N4",
                start_date=date(2023, 10, 1)
            )
        ]

        profile = UserProfileModel(
            id=user_id,
            name="Alex Doe",
            native_language="English",
            target_language="Japanese",
            proficiency_level="B1",
            interests=["anime", "technology", "travel"],
            learning_goals=goals
        )
        return profile

class ConversationGoalTracker:
    def __init__(self):
        pass

    def _get_current_goal_data(self, session_id: str) -> CurrentConversationGoal:
        """Core logic to determine and retrieve the current, narrow goal of the conversation."""
        return CurrentConversationGoal(
            goal_id=f"chat_{session_id}",
            goal_description="Explain the difference between 'wa' and 'ga' with examples.",
            is_completed=False
        )

class SystemContext:
    def __init__(self):
        pass

    def _get_instructions_data(self) -> Dict[str, Any]:
        """Core logic to fetch ONLY the main system prompt/instructions."""
        instructions = {
            "system_prompt": "You are a helpful and encouraging language learning assistant. Your goal is to help the user achieve their current conversation goal and overall learning goals. Be sure to reference the retrieved knowledge where applicable.",
        }
        return instructions

class ConversationHistory:
    def __init__(self):
        pass

    def _get_history_data(self, session_id: str) -> List[Turn]:
        """Core logic to fetch conversation history data."""
        turns = [
            Turn(speaker=Speaker.USER, text="Hello!"),
            Turn(speaker=Speaker.AGENT, text="Hi there! How can I help you learn today?")
        ]
        return turns

class RetrievedKnowledge:
    def __init__(self):
        pass

    def search(self, query: str) -> List[RetrievedKnowledgeItem]:
        """Searches for knowledge relevant to the user's query."""
        if "wa" in query.lower() or "ga" in query.lower():
            return [
                RetrievedKnowledgeItem(type=KnowledgeType.DOCUMENT, content="The particle 'wa' is used for topic marking, while 'ga' is used for subject marking.", source="internal_grammar_db:doc_123")
            ]
        return []

