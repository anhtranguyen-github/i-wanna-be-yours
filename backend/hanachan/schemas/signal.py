from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from enum import Enum
import uuid
from datetime import datetime

class SignalPriority(str, Enum):
    CRITICAL = "P0"
    HIGH = "P1"
    NORMAL = "P2"
    BACKGROUND = "P3"

class Signal(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    trace_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str  # e.g., "task.completed", "streak.broken"
    priority: SignalPriority
    user_id: str
    payload: Dict[str, Any] = {}
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
