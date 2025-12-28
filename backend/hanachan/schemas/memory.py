
from pydantic import BaseModel, Field
from typing import List, Dict, Any

class Node(BaseModel):
    id: str = Field(description="Unique identifier for the node")
    type: str = Field(description="The type of the node")
    properties: Dict[str, Any] = Field(default_factory=dict)

class Relationship(BaseModel):
    source: Node
    target: Node
    type: str
    properties: Dict[str, Any] = Field(default_factory=dict)

class KnowledgeGraph(BaseModel):
    relationships: List[Relationship] = Field(default_factory=list)
