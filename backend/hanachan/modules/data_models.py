from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime, date
from typing import List, Dict, Any



class Speaker(Enum):
    USER = "USER"
    AGENT = "AGENT"

class GoalStatus(Enum):
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"

class QueryType(Enum):
    TEXT = "TEXT"
    IMAGE = "IMAGE"

class KnowledgeType(Enum):
    DOCUMENT = "DOCUMENT"
    API_RESULT = "API_RESULT"

@dataclass
class Turn:
    speaker: Speaker
    text: str

@dataclass
class LearningGoal:
    goal_id: str
    topic: str
    status: GoalStatus
    proficiency_target: str
    start_date: date

@dataclass
class RetrievedKnowledgeItem:
    type: KnowledgeType
    content: str
    source: str

@dataclass
class QueryPart:
    type: QueryType
    content: str

@dataclass
class UserQuery:
    parts: List[QueryPart]

@dataclass
class UserProfileModel: # Renamed from original for clarity
    id: str
    name: str
    native_language: str
    target_language: str
    proficiency_level: str
    interests: List[str]
    learning_goals: List[LearningGoal] # Updated to include goals!

@dataclass
class CurrentConversationGoal:
    """Represents the immediate, short-term goal of the current chat session."""
    goal_id: str
    goal_description: str
    is_completed: bool

@dataclass
class ToolDefinition:
    """Defines a tool the agent can use."""
    name: str
    description: str
    input_schema: Dict[str, Any] # For function calling definition

@dataclass
class Prompt:
    system_prompt: Dict[str, Any] # Includes core instructions
    user_profile: UserProfileModel
    conversation_history: List[Turn]
    current_chat_goal: CurrentConversationGoal # NEW FIELD
    available_tools: List[ToolDefinition] # NEW FIELD
    retrieved_knowledge: List[RetrievedKnowledgeItem]
    user_query: UserQuery