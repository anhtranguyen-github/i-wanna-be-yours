from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime, date
from typing import List, Dict, Any

class Speaker(Enum):
    USER = "user"
    AGENT = "hanachan"

@dataclass
class Turn:
    speaker: Speaker
    text: str
    timestamp: datetime = field(default_factory=datetime.utcnow)

class GoalStatus(Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    ON_HOLD = "on_hold"
    ARCHIVED = "archived"

@dataclass
class ProgressSnapshot:
    timestamp: datetime
    type: str  # e.g., 'quiz', 'conversation_practice'
    score: float
    feedback: str

@dataclass
class LearningGoal:
    goal_id: str
    topic: str
    status: GoalStatus
    proficiency_target: str
    start_date: date
    completion_date: date = None
    progress_history: List[ProgressSnapshot] = field(default_factory=list)

@dataclass
class UserProfile:
    id: str
    name: str
    native_language: str
    target_language: str
    proficiency_level: str
    interests: List[str] = field(default_factory=list)


@dataclass
class Document:
    document_id: str
    content: str
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class RetrievedKnowledgeItem:
    """Represents a single piece of retrieved information for the prompt context."""
    type: 'KnowledgeType'
    content: str
    source: str  
    metadata: Dict[str, Any] = field(default_factory=dict)

class KnowledgeType(Enum):
    """Enumeration for the different types of retrieved knowledge."""
    DOCUMENT = "document"
    NOTE = "note"
    SEARCH_RESULT = "search_result"

class QueryType(Enum):
    """Enumeration for the different types of user queries."""
    TEXT = "text"
    VOICE = "voice"
    VIDEO = "video"

@dataclass
class QueryPart:
    """Represents one part of a potentially multi-modal user query."""
    type: QueryType
    content: str # Can be text, a URL to a voice file, a URL to a video, etc.

@dataclass
class UserQuery:
    """Represents the user's input to the hanachan, which can be multi-modal."""
    parts: List[QueryPart]

@dataclass
class Prompt:
    system_prompt: Dict[str, Any] # SystemContext returns a dict
    user_profile: UserProfile
    conversation_history: List[Turn]
    learning_goals: LearningGoal
    retrieved_knowledge: List[RetrievedKnowledgeItem]
    user_query: UserQuery