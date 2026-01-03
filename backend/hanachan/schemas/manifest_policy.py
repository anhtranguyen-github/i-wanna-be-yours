from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any, Union

# ═══════════════════════════════════════════════════════════════
# MANIFEST SCHEMAS
# ═══════════════════════════════════════════════════════════════

class MemoryStore(BaseModel):
    id: str
    type: str # vector, graph, relational, document, api
    backend: str
    collection: Optional[str] = None
    description: Optional[str] = None

class IntentTriggers(BaseModel):
    keywords: List[str] = []
    patterns: List[str] = []
    fallback: bool = False

class Intent(BaseModel):
    id: str
    description: str
    triggers: IntentTriggers

class Tool(BaseModel):
    id: str
    function: str
    description: str
    produces: Optional[str] = None # e.g., "artifact"

class Specialist(BaseModel):
    id: str
    name: str
    description: str
    handles_intents: List[str]
    uses_tools: List[str] = []
    memory_access: List[str] = []

class Manifest(BaseModel):
    version: str
    name: str
    description: str
    memory: Dict[str, List[MemoryStore]]
    intents: List[Intent]
    tools: List[Tool]
    specialists: List[Specialist]

# ═══════════════════════════════════════════════════════════════
# POLICY SCHEMAS
# ═══════════════════════════════════════════════════════════════

class GlobalPolicy(BaseModel):
    enforce_isolation: bool = True
    max_loop_iterations: int = 5
    fire_and_forget_memory: bool = True

class IdentityType(BaseModel):
    id: str
    isolation_level: str
    tool_access: Union[str, List[str]] # "*" or list of tool ids
    memory_access: List[str]
    resource_access: Union[str, List[str]]

class IdentityPolicy(BaseModel):
    types: List[IdentityType]

class MemorySaveRule(BaseModel):
    type: str
    patterns: List[str] = []
    condition: Optional[str] = None
    action: str
    priority: int = 1

class MemoryGovernance(BaseModel):
    save_rules: List[MemorySaveRule]

class ToolGuardrail(BaseModel):
    tool_id: str
    requires_approval: bool = False
    rate_limit: Optional[str] = None
    max_output_tokens: Optional[int] = None
    requires_context: List[str] = []

class Policy(BaseModel):
    global_policy: GlobalPolicy = Field(alias="global")
    identity: IdentityPolicy
    memory_governance: MemoryGovernance
    tool_guardrails: List[ToolGuardrail] = []

    class Config:
        populate_by_name = True
