from pydantic import BaseModel
from typing import List, Dict, Optional, Any, Union

class PackageArtifact(BaseModel):
    id: str # The real DB ID
    type: str # flashcard, quiz, etc.
    title: str
    data: Dict[str, Any]
    metadata: Dict[str, Any] = {}

class PackageMessage(BaseModel):
    content: str
    role: str = "assistant"

class PackageTask(BaseModel):
    id: str
    title: str
    description: str

class UnifiedOutput(BaseModel):
    """
    Standardized package delivered by the system to the user.
    """
    session_id: str
    conversation_id: str
    message: PackageMessage
    artifacts: List[PackageArtifact] = []
    tasks: List[PackageTask] = []
    suggestions: List[str] = []
    metadata: Dict[str, Any] = {}

    def to_chat_dto(self):
        """Helper to convert to the existing API-level AgentResponse DTO if needed."""
        # This would bridge to schemas.chat.AgentResponse
        pass
