# Intent Detection & Safe Tool Architecture

**Date:** 2026-01-03  
**Purpose:** Implementation guide for extracting intent without LLM and securing tool execution

---

## Part 1: Intent Detection (Without LLM)

### 1.1 Three-Layer Intent Detection

```
User Input: "Can you make me some flashcards about N4 grammar?"
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
    ┌──────────┐       ┌──────────┐       ┌──────────┐
    │ Layer 1  │       │ Layer 2  │       │ Layer 3  │
    │ Keywords │       │  Regex   │       │ Semantic │
    │  (Fast)  │       │ Patterns │       │ (Embed)  │
    └──────────┘       └──────────┘       └──────────┘
         │                   │                   │
         ▼                   ▼                   ▼
    "flashcards"         CREATE_*           similarity
    → CREATE_FLASHCARDS  pattern match      search
```

### 1.2 Layer 1: Keyword Lookup (Fastest)

```python
# agent/intent/keywords.py

KEYWORD_MAP = {
    # Direct keywords → Intent
    "flashcards": "CREATE_FLASHCARDS",
    "flashcard": "CREATE_FLASHCARDS",
    "quiz": "CREATE_QUIZ",
    "test": "CREATE_EXAM",
    "exam": "CREATE_EXAM",
    "progress": "CHECK_PROGRESS",
    "streak": "CHECK_PROGRESS",
    "explain": "EXPLAIN_GRAMMAR",
    "meaning": "EXPLAIN_GRAMMAR",
    "translate": "TRANSLATE",
    "practice": "PRACTICE_CONVERSATION",
    "talk": "PRACTICE_CONVERSATION",
    "remember": "RECALL_PAST",
    "history": "VIEW_HISTORY",
    "plan": "CREATE_PLAN",
    "goals": "UPDATE_GOALS",
    "suggest": "GET_SUGGESTIONS",
}

def keyword_lookup(text: str) -> Optional[str]:
    """O(n) scan for keywords - very fast"""
    text_lower = text.lower()
    for keyword, intent in KEYWORD_MAP.items():
        if keyword in text_lower:
            return intent
    return None
```

### 1.3 Layer 2: Regex Patterns (More Precise)

```python
# agent/intent/patterns.py
import re

INTENT_PATTERNS = {
    "CREATE_FLASHCARDS": [
        r"(make|create|generate|build)\s+(me\s+)?(some\s+)?flashcards?",
        r"flashcards?\s+(for|about|on)\s+",
        r"I\s+(want|need|would like)\s+(some\s+)?flashcards?",
    ],
    "CREATE_QUIZ": [
        r"(make|create|give)\s+(me\s+)?(a\s+)?quiz",
        r"quiz\s+me\s+(on|about)",
        r"test\s+my\s+(knowledge|understanding)",
    ],
    "EXPLAIN_GRAMMAR": [
        r"(explain|what\s+is|how\s+do|tell\s+me\s+about)\s+.*(grammar|particle|form|conjugat)",
        r"(meaning|use|usage)\s+of\s+",
        r"difference\s+between\s+.+\s+and\s+",
        r"when\s+(do\s+I|should\s+I|to)\s+use\s+",
    ],
    "CHECK_PROGRESS": [
        r"(how\s+am\s+I|my\s+progress|how('m|\s+am)\s+I\s+doing)",
        r"(show|check|view)\s+(my\s+)?(progress|stats|streak)",
        r"am\s+I\s+(improving|getting\s+better)",
    ],
    "RECALL_PAST": [
        r"(remember|recall|last\s+time|we\s+(talked|discussed))",
        r"(what\s+did|when\s+did)\s+(I|we)\s+(learn|study|discuss)",
        r"(you\s+said|you\s+told\s+me|you\s+mentioned)",
    ],
    "PRACTICE_CONVERSATION": [
        r"(practice|let's\s+talk|conversation\s+practice)",
        r"(speak|talk)\s+(with|to)\s+me\s+in\s+(japanese|korean)",
        r"roleplay",
    ],
}

def pattern_match(text: str) -> Optional[str]:
    """Regex pattern matching - medium speed, high precision"""
    text_lower = text.lower()
    for intent, patterns in INTENT_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, text_lower):
                return intent
    return None
```

### 1.4 Layer 3: Semantic Similarity (Fallback)

```python
# agent/intent/semantic.py

# Pre-computed embeddings for intent descriptions
INTENT_EMBEDDINGS = {
    "CREATE_FLASHCARDS": embed("create study flashcards for vocabulary"),
    "CREATE_QUIZ": embed("make a quiz to test knowledge"),
    "EXPLAIN_GRAMMAR": embed("explain grammar rules and language concepts"),
    "CHECK_PROGRESS": embed("check study progress and performance"),
    "RECALL_PAST": embed("remember past conversations and history"),
    # ...
}

def semantic_match(text: str, threshold: float = 0.7) -> Optional[str]:
    """Embedding similarity - slower but catches edge cases"""
    text_embedding = embed(text)
    
    best_intent = None
    best_score = 0
    
    for intent, intent_embedding in INTENT_EMBEDDINGS.items():
        score = cosine_similarity(text_embedding, intent_embedding)
        if score > best_score and score > threshold:
            best_score = score
            best_intent = intent
    
    return best_intent
```

### 1.5 Combined Intent Classifier

```python
# agent/intent/classifier.py

class IntentClassifier:
    def __init__(self, use_semantic: bool = False):
        self.use_semantic = use_semantic
        if use_semantic:
            self._load_intent_embeddings()
    
    def classify(self, text: str) -> Tuple[str, float]:
        """
        Returns (intent, confidence)
        Confidence: 1.0 = keyword, 0.9 = regex, 0.7+ = semantic
        """
        
        # Layer 1: Keywords (fastest, highest confidence)
        intent = keyword_lookup(text)
        if intent:
            return intent, 1.0
        
        # Layer 2: Regex patterns (fast, high confidence)
        intent = pattern_match(text)
        if intent:
            return intent, 0.9
        
        # Layer 3: Semantic similarity (optional, slower)
        if self.use_semantic:
            intent = semantic_match(text)
            if intent:
                return intent, 0.7
        
        # Fallback: General chat
        return "CHAT", 0.5
```

---

## Part 2: Entity Extraction (Without LLM)

### 2.1 Named Entity Recognition

```python
# agent/intent/entities.py

import re

# Level patterns (JLPT)
LEVEL_PATTERN = r"\b(N[1-5]|n[1-5]|level\s*[1-5]|jlpt\s*[1-5])\b"

# Topic patterns
TOPIC_KEYWORDS = {
    "grammar": ["grammar", "particle", "conjugation", "form", "tense"],
    "vocabulary": ["vocab", "vocabulary", "words", "kanji"],
    "verbs": ["verb", "verbs", "動詞"],
    "particles": ["particle", "particles", "助詞"],
    "keigo": ["keigo", "honorific", "polite", "formal"],
    "counters": ["counter", "counters", "助数詞"],
}

# Count patterns
COUNT_PATTERN = r"(\d+)\s*(flashcards?|questions?|cards?|items?)"

def extract_entities(text: str, intent: str) -> Dict[str, Any]:
    """Extract structured entities from user input"""
    entities = {}
    text_lower = text.lower()
    
    # Extract JLPT level
    level_match = re.search(LEVEL_PATTERN, text_lower)
    if level_match:
        level = level_match.group(1).upper()
        if not level.startswith("N"):
            level = f"N{level[-1]}"
        entities["level"] = level
    
    # Extract topic
    for topic, keywords in TOPIC_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            entities["topic"] = topic
            break
    
    # Extract count
    count_match = re.search(COUNT_PATTERN, text_lower)
    if count_match:
        entities["count"] = int(count_match.group(1))
    
    # Intent-specific extraction
    if intent == "EXPLAIN_GRAMMAR":
        # Try to extract the specific grammar point
        grammar_match = re.search(r"(explain|what is|about)\s+(.+?)(\?|$)", text_lower)
        if grammar_match:
            entities["grammar_point"] = grammar_match.group(2).strip()
    
    return entities
```

---

## Part 3: Safe Tool Architecture

### 3.1 Current (Unsafe) Tool Usage

```python
# CURRENT - LLM decides which tool to call
response = self.llm_with_tools.invoke(messages)
if response.tool_calls:
    for tc in response.tool_calls:
        tool = tool_map.get(tc['name'])  # LLM chose this
        result = tool.invoke(tc['args'])  # LLM provided args
```

**Problems:**
- LLM can call any tool
- LLM provides unvalidated arguments
- No permission checks
- No rate limiting
- No audit trail

### 3.2 Proposed Safe Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER REQUEST                                 │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    1. INTENT → ALLOWED TOOLS                         │
│                                                                      │
│   Intent: CREATE_FLASHCARDS                                         │
│   Allowed: [create_study_flashcards]                                │
│   NOT allowed: [recalibrate_study_priorities, perform_detailed_audit]│
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    2. PERMISSION CHECK                               │
│                                                                      │
│   User Role: "user"                                                 │
│   Tool: create_study_flashcards                                     │
│   Permission: ✅ ALLOWED                                            │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    3. RATE LIMIT CHECK                               │
│                                                                      │
│   User: test-user-alpha                                             │
│   Tool: create_study_flashcards                                     │
│   Limit: 10/hour, Used: 3                                           │
│   Status: ✅ ALLOWED                                                │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    4. ARGUMENT VALIDATION                            │
│                                                                      │
│   Schema: FlashcardParams(level: str, topic: str, count: int)       │
│   Input: {level: "N4", topic: "grammar", count: 5}                  │
│   Validation: ✅ PASSED                                             │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    5. EXECUTE TOOL (SYSTEM CONTROLLED)               │
│                                                                      │
│   Tool: create_study_flashcards                                     │
│   Args: {user_id: "...", level: "N4", topic: "grammar", count: 5}   │
│   Result: {artifact_id: "...", title: "..."}                        │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.3 Implementation: Tool Registry

```python
# agent/tools/registry.py

from dataclasses import dataclass
from typing import List, Dict, Callable, Optional
from pydantic import BaseModel
from enum import Enum

class UserRole(Enum):
    GUEST = "guest"
    USER = "user"
    PREMIUM = "premium"
    ADMIN = "admin"

@dataclass
class ToolDefinition:
    """Metadata for a registered tool"""
    name: str
    function: Callable
    description: str
    
    # Safety constraints
    allowed_roles: List[UserRole]
    rate_limit: int  # calls per hour
    requires_auth: bool
    
    # Validation schema (Pydantic model)
    params_schema: Optional[type[BaseModel]]
    
    # Audit settings
    log_invocations: bool = True
    sensitive_params: List[str] = None  # params to redact in logs

class ToolRegistry:
    def __init__(self):
        self.tools: Dict[str, ToolDefinition] = {}
        self._rate_limits: Dict[str, Dict[str, int]] = {}  # user_id -> tool -> count
    
    def register(self, tool_def: ToolDefinition):
        self.tools[tool_def.name] = tool_def
    
    def get_allowed_tools(self, intent: str) -> List[str]:
        """Returns tools allowed for a given intent"""
        return INTENT_TOOL_MAP.get(intent, [])
    
    def can_user_call(self, tool_name: str, user_role: UserRole) -> bool:
        """Check if user role can call this tool"""
        tool = self.tools.get(tool_name)
        if not tool:
            return False
        return user_role in tool.allowed_roles
    
    def check_rate_limit(self, tool_name: str, user_id: str) -> bool:
        """Check if user is within rate limit"""
        tool = self.tools.get(tool_name)
        if not tool:
            return False
        
        user_limits = self._rate_limits.get(user_id, {})
        current_count = user_limits.get(tool_name, 0)
        return current_count < tool.rate_limit
    
    def increment_rate_limit(self, tool_name: str, user_id: str):
        """Increment usage counter"""
        if user_id not in self._rate_limits:
            self._rate_limits[user_id] = {}
        self._rate_limits[user_id][tool_name] = self._rate_limits[user_id].get(tool_name, 0) + 1

# Intent → Allowed Tools mapping
INTENT_TOOL_MAP = {
    "CREATE_FLASHCARDS": ["create_study_flashcards"],
    "CREATE_QUIZ": ["create_study_quiz"],
    "CREATE_EXAM": ["create_practice_exam"],
    "CHECK_PROGRESS": ["audit_study_progress", "get_habit_consistency_report"],
    "VIEW_HISTORY": ["query_learning_records"],
    "GET_SUGGESTIONS": ["generate_suggested_goals"],
    "UPDATE_GOALS": ["update_goal_progress", "recalibrate_study_priorities"],
    "EXPLAIN_GRAMMAR": [],  # No tools, just LLM
    "CHAT": [],  # No tools
}
```

### 3.4 Implementation: Safe Tool Executor

```python
# agent/tools/executor.py

from typing import Dict, Any
import logging

logger = logging.getLogger("hanachan.tools")

class ToolExecutionError(Exception):
    pass

class SafeToolExecutor:
    def __init__(self, registry: ToolRegistry):
        self.registry = registry
    
    def execute(
        self,
        tool_name: str,
        args: Dict[str, Any],
        user_id: str,
        user_role: UserRole,
        intent: str
    ) -> Dict[str, Any]:
        """
        Execute a tool with full safety checks.
        Raises ToolExecutionError if any check fails.
        """
        
        # 1. Check tool exists
        tool_def = self.registry.tools.get(tool_name)
        if not tool_def:
            raise ToolExecutionError(f"Unknown tool: {tool_name}")
        
        # 2. Check intent allows this tool
        allowed_tools = self.registry.get_allowed_tools(intent)
        if tool_name not in allowed_tools:
            logger.warning(f"[SECURITY] Tool {tool_name} not allowed for intent {intent}")
            raise ToolExecutionError(f"Tool not allowed for this action")
        
        # 3. Check user permission
        if not self.registry.can_user_call(tool_name, user_role):
            logger.warning(f"[SECURITY] User role {user_role} cannot call {tool_name}")
            raise ToolExecutionError(f"Permission denied")
        
        # 4. Check rate limit
        if not self.registry.check_rate_limit(tool_name, user_id):
            logger.warning(f"[RATE_LIMIT] User {user_id} exceeded limit for {tool_name}")
            raise ToolExecutionError(f"Rate limit exceeded")
        
        # 5. Validate arguments
        if tool_def.params_schema:
            try:
                validated = tool_def.params_schema(**args)
                args = validated.model_dump()
            except Exception as e:
                logger.warning(f"[VALIDATION] Invalid args for {tool_name}: {e}")
                raise ToolExecutionError(f"Invalid parameters: {e}")
        
        # 6. Inject system params (user_id)
        args["user_id"] = user_id
        
        # 7. Execute
        try:
            logger.info(f"[TOOL] Executing {tool_name} for user {user_id}")
            result = tool_def.function(**args)
            
            # 8. Record for rate limiting
            self.registry.increment_rate_limit(tool_name, user_id)
            
            # 9. Audit log
            if tool_def.log_invocations:
                self._audit_log(tool_name, user_id, args, result, tool_def.sensitive_params)
            
            return {"success": True, "result": result}
            
        except Exception as e:
            logger.error(f"[TOOL] Execution failed: {tool_name} - {e}")
            return {"success": False, "error": str(e)}
    
    def _audit_log(self, tool: str, user: str, args: Dict, result: Any, sensitive: List[str]):
        """Write to audit log with sensitive data redacted"""
        safe_args = {k: "[REDACTED]" if sensitive and k in sensitive else v 
                     for k, v in args.items()}
        logger.info(f"[AUDIT] tool={tool} user={user} args={safe_args}")
```

### 3.5 Tool Registration Example

```python
# agent/tools/definitions.py

from pydantic import BaseModel, Field
from agent.tools.registry import ToolDefinition, ToolRegistry, UserRole
from agent.tools.study_tools import (
    create_study_flashcards,
    create_study_quiz,
    audit_study_progress,
)

# Validation schemas
class FlashcardParams(BaseModel):
    topic: str = Field(..., min_length=1, max_length=100)
    level: str = Field(default="N5", pattern=r"^N[1-5]$")
    count: int = Field(default=5, ge=1, le=20)

class QuizParams(BaseModel):
    topic: str = Field(..., min_length=1, max_length=100)
    level: str = Field(default="N5", pattern=r"^N[1-5]$")
    count: int = Field(default=3, ge=1, le=10)

# Create registry
tool_registry = ToolRegistry()

# Register tools with safety metadata
tool_registry.register(ToolDefinition(
    name="create_study_flashcards",
    function=create_study_flashcards,
    description="Create flashcards for studying",
    allowed_roles=[UserRole.USER, UserRole.PREMIUM, UserRole.ADMIN],
    rate_limit=20,  # 20 per hour
    requires_auth=True,
    params_schema=FlashcardParams,
))

tool_registry.register(ToolDefinition(
    name="create_study_quiz",
    function=create_study_quiz,
    description="Create a quiz for practice",
    allowed_roles=[UserRole.USER, UserRole.PREMIUM, UserRole.ADMIN],
    rate_limit=15,
    requires_auth=True,
    params_schema=QuizParams,
))

tool_registry.register(ToolDefinition(
    name="recalibrate_study_priorities",
    function=recalibrate_study_priorities,
    description="Modify study plan priorities",
    allowed_roles=[UserRole.PREMIUM, UserRole.ADMIN],  # Premium only!
    rate_limit=5,
    requires_auth=True,
    params_schema=RecalibrateParams,
    sensitive_params=["prioritized_topics"],  # Redact in logs
))
```

---

## Part 4: Migration Path

### 4.1 Current → New Architecture

```python
# Current (LLM decides)
class HanachanAgent:
    def invoke(self, prompt, ...):
        # LLM picks tools
        response = self.llm_with_tools.invoke(messages)
        if response.tool_calls:
            for tc in response.tool_calls:
                tool = tool_map[tc['name']]
                result = tool.invoke(tc['args'])

# NEW (System decides)
class HanachanAgent:
    def __init__(self):
        self.classifier = IntentClassifier()
        self.tool_registry = tool_registry
        self.executor = SafeToolExecutor(self.tool_registry)
    
    def invoke(self, prompt, user_id, user_role, ...):
        # 1. System classifies intent
        intent, confidence = self.classifier.classify(prompt)
        
        # 2. System extracts entities
        entities = extract_entities(prompt, intent)
        
        # 3. System determines which tool to use
        allowed_tools = self.tool_registry.get_allowed_tools(intent)
        
        if allowed_tools:
            # 4. System executes tool (with safety checks)
            tool_name = allowed_tools[0]  # Primary tool for intent
            result = self.executor.execute(
                tool_name=tool_name,
                args=entities,
                user_id=user_id,
                user_role=user_role,
                intent=intent
            )
            
            # 5. LLM formats response
            return self._format_response(result, intent)
        else:
            # 6. Pure conversation (LLM only)
            return self._chat_response(prompt, ...)
```

### 4.2 Gradual Migration

```python
# Feature flag for A/B testing
USE_SYSTEM_FIRST = os.environ.get("SYSTEM_FIRST_ARCHITECTURE", "false") == "true"

class HanachanAgent:
    def invoke(self, prompt, ...):
        if USE_SYSTEM_FIRST:
            return self._invoke_system_first(prompt, ...)
        else:
            return self._invoke_llm_first(prompt, ...)  # Current behavior
```

---

## Part 5: Summary

### Before vs After

| Aspect | LLM-First (Current) | System-First (New) |
|--------|---------------------|---------------------|
| **Intent Detection** | LLM interprets | Pattern + Regex |
| **Tool Selection** | LLM decides | Intent → Tool map |
| **Permission Check** | None | Role-based |
| **Rate Limiting** | None | Per-user limits |
| **Argument Validation** | None | Pydantic schemas |
| **Audit Trail** | None | Full logging |
| **LLM Calls** | 2+ per request | 1 (response only) |

### Security Improvements

✅ LLM cannot bypass tool restrictions  
✅ Users cannot call tools above their role  
✅ Rate limits prevent abuse  
✅ Invalid inputs rejected before execution  
✅ All tool calls are audited  
✅ Sensitive data redacted in logs
