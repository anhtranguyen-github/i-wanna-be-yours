from typing import Any, Dict, List
from dataclasses import asdict
from datetime import date
from enum import Enum

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

# Assuming this imports all necessary dataclasses (Prompt, UserProfileModel, etc.)
from modules.data_models import (
    CurrentConversationGoal, Prompt, LearningGoal, RetrievedKnowledgeItem, 
    Speaker, ToolDefinition, Turn, UserProfileModel, UserQuery, QueryType, 
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

class ToolContext:
    def __init__(self):
        pass

    def _get_available_tools_data(self) -> List[ToolDefinition]:
        """Core logic to fetch system tools and their definitions."""
        return [
            ToolDefinition(
                name="create_quiz",
                description="Creates a short multiple-choice quiz based on the conversation topic.",
                input_schema={"type": "object", "properties": {"num_questions": {"type": "integer"}}}
            ),
            ToolDefinition(
                name="find_reading_material",
                description="Searches a knowledge base for relevant articles or texts.",
                input_schema={"type": "object", "properties": {"topic": {"type": "string"}}}
            ),
            ToolDefinition(
                name="explain_grammar",
                description="Provides a detailed, structured explanation of a grammar point.",
                input_schema={"type": "object", "properties": {"grammar_point": {"type": "string"}}}
            )
        ]

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

# --- ContextManager (FastAPI Integration) ---

# Pydantic models for request validation
class QueryPartModel(BaseModel):
    # Pydantic automatically handles conversion from string (e.g., "text") to Enum (QueryType.TEXT)
    type: QueryType = Field(..., description="The type of content, e.g., 'TEXT', 'IMAGE'.") 
    content: str = Field(..., description="The actual content of the query part.")

class UserQueryModel(BaseModel):
    parts: List[QueryPartModel] = Field(default_factory=list)

class BuildPromptRequest(BaseModel):
    user_id: str
    session_id: str
    query: UserQueryModel


class ContextManager:
    def __init__(self, user_profile: 'UserProfile', conversation_history: 'ConversationHistory', 
                 system_context: 'SystemContext', retrieved_knowledge: 'RetrievedKnowledge',
                 tool_context: 'ToolContext', conversation_goal_tracker: 'ConversationGoalTracker'):
        
        # ... (dependencies are correctly injected here)
        self.user_profile = user_profile
        self.conversation_history = conversation_history
        self.system_context = system_context
        self.retrieved_knowledge = retrieved_knowledge
        self.tool_context = tool_context
        self.conversation_goal_tracker = conversation_goal_tracker

    def build_prompt_data(self, user_id: str, session_id: str, user_query_model: UserQueryModel) -> Prompt:
        """
        Gathers context from all modules and returns a structured Prompt object.
        - Simplified QueryType handling due to Pydantic usage.
        """
        
        # 1. Map Pydantic request to dataclass QueryPart objects
        # The list comprehension is cleaner and leverages the Pydantic-handled Enum.
        query_parts = [
            QueryPart(type=part.type, content=part.content)
            for part in user_query_model.parts
        ]
        user_query = UserQuery(parts=query_parts)

        # 2. Extract search query (first TEXT part)
        search_query = next(
            (
                part.content 
                for part in user_query.parts 
                if part.type == QueryType.TEXT
            ),
            "" # Default to empty string if no text part is found
        )

        # 3. Assemble the final Prompt dataclass
        prompt_data = Prompt(
            # Using private methods for clarity, but public methods are generally preferred for components
            system_prompt=self.system_context._get_instructions_data(),
            user_profile=self.user_profile._get_profile_data(user_id),
            conversation_history=self.conversation_history._get_history_data(session_id),
            current_chat_goal=self.conversation_goal_tracker._get_current_goal_data(session_id),
            available_tools=self.tool_context._get_available_tools_data(),
            retrieved_knowledge=self.retrieved_knowledge.search(search_query),
            user_query=user_query
        )
        return prompt_data
    
    # --- FastAPI Endpoint remains the same ---
    # The separation of `build_prompt_data` (core logic) and `build_prompt` (API logic) is excellent.
    
    def build_prompt(self, request_data: BuildPromptRequest):
        """The FastAPI endpoint that handles the POST request."""
        try:
            prompt_data = self.build_prompt_data(
                request_data.user_id, 
                request_data.session_id, 
                request_data.query
            )
            # Use asdict to serialize the dataclass for JSON response
            return asdict(prompt_data) 
        except Exception as e:
            # Added a critical log message placeholder
            # logging.error(f"Error processing build_prompt request: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Internal context error: Failed to assemble prompt data.")