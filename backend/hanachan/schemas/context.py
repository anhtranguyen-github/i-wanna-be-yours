from pydantic import BaseModel
from typing import List, Dict, Optional, Any

class ResourceChunk(BaseModel):
    title: str
    content: str
    source_id: str

class MemorySnippet(BaseModel):
    summary: str
    timestamp: Optional[str] = None
    relevance: float = 0.0

class ArtifactReference(BaseModel):
    artifact_id: str
    type: str
    title: str
    description: Optional[str] = None
    created_at: str

class StudyState(BaseModel):
    active_plan: Optional[str] = None
    current_milestone: Optional[str] = None
    health: str = "unknown"
    struggles: List[str] = []
    recent_performance: Dict[str, Any] = {}

class LearnerContext(BaseModel):
    """
    The unified 'Situation Report' provided to the LLM.
    Hides all DB identifiers and internal technical metadata.
    """
    resources: List[ResourceChunk] = []
    memories: List[MemorySnippet] = []
    artifacts: List[ArtifactReference] = []
    study_state: Optional[StudyState] = None
    
    def to_system_narrative(self) -> str:
        """Converts the structured context into a human-readable narrative for the system prompt."""
        sections = ["## LEARNER SITUATION REPORT"]
        
        if self.study_state:
            s = self.study_state
            sections.append(f"### CURRENT PROGRESS: {s.health.upper()}")
            sections.append(f"Plan: {s.active_plan or 'None'}")
            sections.append(f"Milestone: {s.current_milestone or 'None'}")
            if s.struggles:
                sections.append(f"Identified Struggle Points: {', '.join(s.struggles)}")
        
        if self.resources:
            sections.append("### RELEVANT KNOWLEDGE FROM RESOURCES:")
            for r in self.resources:
                sections.append(f"From '{r.title}': {r.content}")
        
        if self.memories:
            sections.append("### RELEVANT PAST CONVERSATIONS:")
            for m in self.memories:
                sections.append(f"- {m.summary}")
                
        if self.artifacts:
            sections.append("### CREATED LEARNING PRODUCTS (ARTIFACTS):")
            for a in self.artifacts:
                sections.append(f"- {a.title} ({a.type}) - Created: {a.created_at}")
                
        return "\n\n".join(sections)
