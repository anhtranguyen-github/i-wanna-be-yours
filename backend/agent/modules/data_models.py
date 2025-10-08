from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime, date
from typing import List, Dict, Any

class Speaker(Enum):
    USER = "user"
    AGENT = "agent"

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
class Prompt:
    system_prompt: Dict[str, Any] # SystemContext returns a dict
    user_profile: UserProfile
    conversation_history: List[Turn]
    learning_goals: LearningGoal
    retrieved_knowledge: List[str]
    current_query: str