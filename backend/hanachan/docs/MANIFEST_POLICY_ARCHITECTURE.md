# Manifest & Policy Schema Architecture

**Date:** 2026-01-03  
**Concept:** Declarative system configuration that separates "What exists" from "What's allowed"

---

## 1. Core Concept

```
┌─────────────────────────────────────────────────────────────────────┐
│                      SYSTEM BEHAVIOR                                 │
│                                                                      │
│   ┌─────────────────────┐        ┌─────────────────────┐            │
│   │      MANIFEST       │        │       POLICY        │            │
│   │   "What exists"     │        │   "What's allowed"  │            │
│   │                     │        │                     │            │
│   │  - Tools            │        │  - Permissions      │            │
│   │  - Memory stores    │        │  - Rate limits      │            │
│   │  - Intents          │        │  - Guardrails       │            │
│   │  - Specialists      │        │  - Memory rules     │            │
│   └─────────────────────┘        └─────────────────────┘            │
│              │                              │                        │
│              └──────────────┬───────────────┘                        │
│                             ▼                                        │
│                    ┌─────────────────┐                              │
│                    │  POLICY ENGINE  │                              │
│                    │  (Enforcement)  │                              │
│                    └─────────────────┘                              │
└─────────────────────────────────────────────────────────────────────┘
```

**Manifest** = Declarative definition of system capabilities  
**Policy** = Declarative rules that constrain behavior  
**Engine** = Runtime that enforces policies against manifest

---

## 2. Manifest Schema

### 2.1 Full Manifest Structure

```yaml
# config/manifest.yaml

version: "1.0"
name: "hanachan-agent"
description: "AI Japanese Language Tutor"

# ═══════════════════════════════════════════════════════════════
# MEMORY STORES - What memory systems exist
# ═══════════════════════════════════════════════════════════════
memory:
  stores:
    - id: "episodic"
      type: "vector"
      backend: "qdrant"
      collection: "episodic_memory"
      embedding_dim: 768
      description: "Timestamped conversation memories"
      
    - id: "semantic"
      type: "graph"
      backend: "neo4j"
      description: "User knowledge graph (facts, goals, preferences)"
      
    - id: "resources"
      type: "vector"
      backend: "qdrant"
      collection: "resource_vectors"
      embedding_dim: 768
      description: "Uploaded document chunks"
      
    - id: "stm"
      type: "relational"
      backend: "postgresql"
      tables: ["conversations", "chat_messages"]
      description: "Active conversation state"

# ═══════════════════════════════════════════════════════════════
# INTENTS - What user intentions the system recognizes
# ═══════════════════════════════════════════════════════════════
intents:
  - id: "create_flashcards"
    description: "User wants to create study flashcards"
    triggers:
      keywords: ["flashcard", "flashcards"]
      patterns:
        - "(make|create|generate)\\s+(me\\s+)?flashcards?"
        - "flashcards?\\s+(for|about)"
    entities:
      - name: "topic"
        type: "string"
        required: true
      - name: "level"
        type: "jlpt_level"
        default: "N5"
      - name: "count"
        type: "integer"
        min: 1
        max: 20
        default: 5

  - id: "explain_grammar"
    description: "User wants grammar explanation"
    triggers:
      keywords: ["explain", "grammar", "meaning", "what is"]
      patterns:
        - "(explain|what is|how do)\\s+.*(grammar|particle)"
        - "meaning of"
    entities:
      - name: "grammar_point"
        type: "string"
        required: true

  - id: "check_progress"
    description: "User wants to see their study progress"
    triggers:
      keywords: ["progress", "streak", "stats", "how am I doing"]
      patterns:
        - "(show|check|view)\\s+(my\\s+)?progress"
        - "how('m|\\s+am)\\s+I\\s+doing"

  - id: "recall_past"
    description: "User asking about past conversations"
    triggers:
      keywords: ["remember", "last time", "we discussed", "you said"]
      patterns:
        - "(remember|recall|last\\s+time)"
        - "what did (we|I) (learn|study)"

  - id: "chat"
    description: "General conversation (fallback)"
    triggers:
      fallback: true

# ═══════════════════════════════════════════════════════════════
# TOOLS - What functions the system can execute
# ═══════════════════════════════════════════════════════════════
tools:
  - id: "create_study_flashcards"
    function: "agent.tools.study_tools.create_study_flashcards"
    description: "Generate flashcard deck for a topic"
    params:
      topic: { type: "string", required: true }
      level: { type: "string", pattern: "^N[1-5]$", default: "N5" }
      count: { type: "integer", min: 1, max: 20, default: 5 }
    returns: "artifact"
    
  - id: "create_study_quiz"
    function: "agent.tools.study_tools.create_study_quiz"
    description: "Generate quiz questions"
    params:
      topic: { type: "string", required: true }
      level: { type: "string", default: "N5" }
      count: { type: "integer", min: 1, max: 10, default: 3 }
    returns: "artifact"

  - id: "audit_study_progress"
    function: "agent.tools.study_tools.audit_study_progress"
    description: "Analyze user's learning progress"
    params: {}
    returns: "report"
    
  - id: "recalibrate_study_priorities"
    function: "agent.tools.study_tools.recalibrate_study_priorities"
    description: "Modify study plan priorities"
    params:
      prioritized_topics: { type: "array", items: "string", required: true }
    returns: "confirmation"
    sensitive: true  # Mark as sensitive operation

# ═══════════════════════════════════════════════════════════════
# SPECIALISTS - What sub-agents exist
# ═══════════════════════════════════════════════════════════════
specialists:
  - id: "sensei"
    name: "Sensei"
    description: "Grammar teacher and explainer"
    persona: "Patient, encouraging teacher who breaks down concepts"
    handles_intents: ["explain_grammar"]
    uses_tools: []
    memory_access:
      read: ["episodic", "resources"]
      write: []

  - id: "curator"
    name: "Curator"
    description: "Content creator (flashcards, quizzes)"
    persona: "Creative designer of engaging study materials"
    handles_intents: ["create_flashcards", "create_quiz"]
    uses_tools: ["create_study_flashcards", "create_study_quiz"]
    memory_access:
      read: ["episodic"]
      write: []

  - id: "evaluator"
    name: "Evaluator"
    description: "Progress analyzer and auditor"
    persona: "Objective analyst with data-driven insights"
    handles_intents: ["check_progress"]
    uses_tools: ["audit_study_progress"]
    memory_access:
      read: ["episodic", "semantic"]
      write: []

  - id: "archivist"
    name: "Archivist"
    description: "Memory recall specialist"
    persona: "Perfect memory of all past interactions"
    handles_intents: ["recall_past"]
    uses_tools: []
    memory_access:
      read: ["episodic", "semantic", "stm"]
      write: []
```

---

## 3. Policy Schema

### 3.1 Full Policy Structure

```yaml
# config/policy.yaml

version: "1.0"
name: "hanachan-policy"
description: "Security and behavior policies"

# ═══════════════════════════════════════════════════════════════
# ROLES - User permission levels
# ═══════════════════════════════════════════════════════════════
roles:
  - id: "guest"
    description: "Unauthenticated user"
    level: 0
    
  - id: "user"
    description: "Standard authenticated user"
    level: 1
    
  - id: "premium"
    description: "Premium subscriber"
    level: 2
    
  - id: "admin"
    description: "System administrator"
    level: 3

# ═══════════════════════════════════════════════════════════════
# TOOL PERMISSIONS - Who can use which tools
# ═══════════════════════════════════════════════════════════════
tool_permissions:
  create_study_flashcards:
    allowed_roles: ["user", "premium", "admin"]
    rate_limit: { requests: 20, window: "1h" }
    
  create_study_quiz:
    allowed_roles: ["user", "premium", "admin"]
    rate_limit: { requests: 15, window: "1h" }
    
  audit_study_progress:
    allowed_roles: ["user", "premium", "admin"]
    rate_limit: { requests: 30, window: "1h" }
    
  recalibrate_study_priorities:
    allowed_roles: ["premium", "admin"]  # Premium only!
    rate_limit: { requests: 5, window: "1h" }
    requires_confirmation: true
    
  perform_detailed_audit:
    allowed_roles: ["admin"]  # Admin only!
    audit_log: true

# ═══════════════════════════════════════════════════════════════
# MEMORY POLICIES - Rules for memory access (CRITICAL)
# ═══════════════════════════════════════════════════════════════
memory_policies:
  # Core principle: LLM cannot decide memory operations
  core_principle: "system_decides_memory"
  
  # Read policies
  read:
    # Always filter by user_id
    user_isolation: true
    
    # System decides what stores to query based on intent
    intent_mapping:
      explain_grammar: ["episodic", "resources"]
      create_flashcards: ["episodic"]
      recall_past: ["episodic", "semantic", "stm"]
      check_progress: ["episodic", "semantic"]
      chat: ["episodic", "stm"]
    
    # Query limits
    max_results:
      episodic: 5
      semantic: 10
      resources: 5
    
    # LLM does NOT control retrieval scope
    llm_cannot:
      - "select_store"
      - "set_query_params"
      - "bypass_user_filter"

  # Write policies
  write:
    # What triggers memory writes
    triggers:
      episodic:
        event: "interaction_complete"
        condition: "system_evaluation"  # NOT LLM
        
      semantic:
        event: "interaction_complete"
        condition: "pattern_match_permanent"  # NOT LLM
        
      stm:
        event: "message_sent"
        condition: "always"

    # Pattern-based save decisions (SYSTEM, not LLM)
    save_rules:
      permanent:
        patterns:
          - "\\b(my name is|I am)\\s+\\w+"
          - "\\b(my goal|I want to|I hope to)\\b"
          - "\\b(I prefer|I like|my favorite)\\b"
          - "\\b(JLPT\\s*)?N[1-5]\\b"
          - "\\b(\\d+)\\s*(years old|歳)\\b"
        action: "save_to_semantic"
        
      session:
        patterns:
          - "\\b(pretend|roleplay|imagine)\\b"
          - "\\b(for now|temporarily)\\b"
        action: "save_to_episodic"
        ttl: "24h"
        
      episodic:
        condition: "message_length > 50"
        action: "summarize_and_save"
        
      ignore:
        patterns:
          - "^(hi|hello|hey|thanks|bye|ok)$"
          - "^.{0,15}$"
        action: "skip"

    # LLM does NOT control write decisions
    llm_cannot:
      - "decide_is_memorable"
      - "decide_scope"
      - "decide_category"
      - "block_save"
      - "force_save"

# ═══════════════════════════════════════════════════════════════
# GUARDRAILS - Safety constraints
# ═══════════════════════════════════════════════════════════════
guardrails:
  input:
    max_length: 4000
    blocked_patterns:
      - "ignore previous instructions"
      - "forget everything"
      - "pretend you are"
      - "jailbreak"
    
  output:
    max_length: 8000
    blocked_content:
      - pii_detection: true
      - profanity_filter: true
    
  agent:
    max_tool_calls_per_turn: 3
    max_iterations: 5
    timeout_seconds: 60

# ═══════════════════════════════════════════════════════════════
# AUDIT - Logging requirements
# ═══════════════════════════════════════════════════════════════
audit:
  log_level: "info"
  
  log_events:
    - intent_classification
    - tool_invocation
    - memory_read
    - memory_write
    - permission_denied
    - rate_limit_exceeded
    
  sensitive_fields:
    redact:
      - "password"
      - "token"
      - "api_key"
    hash:
      - "user_id"
```

---

## 4. Policy Engine

### 4.1 Engine Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER REQUEST                                 │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       POLICY ENGINE                                  │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 1. LOAD MANIFEST + POLICY                                    │   │
│  │    - Parse YAML/JSON                                         │   │
│  │    - Validate schemas                                        │   │
│  │    - Cache in memory                                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 2. CLASSIFY INTENT (using manifest.intents)                  │   │
│  │    - Match triggers.keywords                                 │   │
│  │    - Match triggers.patterns                                 │   │
│  │    - Extract entities                                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 3. CHECK PERMISSIONS (using policy.tool_permissions)         │   │
│  │    - Verify user role                                        │   │
│  │    - Check rate limits                                       │   │
│  │    - Validate parameters                                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 4. DETERMINE MEMORY ACCESS (using policy.memory_policies)    │   │
│  │    - Map intent → allowed stores                             │   │
│  │    - Apply user isolation                                    │   │
│  │    - Set query limits                                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 5. EXECUTE (manifest.tools + manifest.specialists)           │   │
│  │    - Route to specialist                                     │   │
│  │    - Execute allowed tools                                   │   │
│  │    - LLM generates response                                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 6. POST-PROCESS (using policy.memory_policies.write)         │   │
│  │    - Pattern match for permanent facts                       │   │
│  │    - System decides what to save                             │   │
│  │    - Log audit events                                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Engine Implementation

```python
# agent/engine/policy_engine.py

from dataclasses import dataclass
from typing import Dict, List, Any, Optional
import yaml
import re

@dataclass
class PolicyDecision:
    allowed: bool
    reason: str
    memory_stores: List[str]
    tools: List[str]
    rate_limit_remaining: int

class PolicyEngine:
    def __init__(self, manifest_path: str, policy_path: str):
        self.manifest = self._load_yaml(manifest_path)
        self.policy = self._load_yaml(policy_path)
        self._build_intent_index()
        self._rate_limits = {}  # user_id -> tool -> count
    
    def evaluate(
        self,
        prompt: str,
        user_id: str,
        user_role: str
    ) -> PolicyDecision:
        """Main entry point - evaluate request against policies"""
        
        # 1. Classify intent
        intent, entities = self._classify_intent(prompt)
        
        # 2. Get allowed tools for this intent
        allowed_tools = self._get_tools_for_intent(intent)
        
        # 3. Filter by role permissions
        permitted_tools = []
        for tool_id in allowed_tools:
            if self._check_tool_permission(tool_id, user_role, user_id):
                permitted_tools.append(tool_id)
        
        # 4. Get allowed memory stores for this intent
        memory_stores = self._get_memory_for_intent(intent)
        
        return PolicyDecision(
            allowed=True,
            reason=f"Intent: {intent}",
            memory_stores=memory_stores,
            tools=permitted_tools,
            rate_limit_remaining=self._get_rate_limit_remaining(user_id)
        )
    
    def should_save_memory(
        self,
        user_message: str,
        agent_response: str
    ) -> Dict[str, Any]:
        """SYSTEM decides memory saving - NOT LLM"""
        
        text = f"{user_message} {agent_response}"
        save_rules = self.policy["memory_policies"]["write"]["save_rules"]
        
        # Check ignore patterns first
        for pattern in save_rules.get("ignore", {}).get("patterns", []):
            if re.search(pattern, user_message, re.IGNORECASE):
                return {"save": False, "reason": "Matches ignore pattern"}
        
        # Check permanent patterns
        for pattern in save_rules.get("permanent", {}).get("patterns", []):
            if re.search(pattern, text, re.IGNORECASE):
                return {
                    "save": True,
                    "scope": "permanent",
                    "action": "save_to_semantic",
                    "reason": f"Matched permanent pattern: {pattern[:30]}..."
                }
        
        # Check session patterns
        for pattern in save_rules.get("session", {}).get("patterns", []):
            if re.search(pattern, text, re.IGNORECASE):
                return {
                    "save": True,
                    "scope": "session",
                    "action": "save_to_episodic",
                    "ttl": save_rules["session"].get("ttl", "24h"),
                    "reason": f"Matched session pattern"
                }
        
        # Default: episodic if substantial
        episodic_rule = save_rules.get("episodic", {})
        if len(user_message) > 50:
            return {
                "save": True,
                "scope": "episodic",
                "action": "summarize_and_save",
                "reason": "Substantial interaction"
            }
        
        return {"save": False, "reason": "No matching rules"}
    
    def _classify_intent(self, prompt: str) -> Tuple[str, Dict]:
        """Match prompt against manifest.intents"""
        prompt_lower = prompt.lower()
        
        for intent in self.manifest["intents"]:
            triggers = intent.get("triggers", {})
            
            # Keyword matching
            for kw in triggers.get("keywords", []):
                if kw.lower() in prompt_lower:
                    entities = self._extract_entities(prompt, intent)
                    return intent["id"], entities
            
            # Pattern matching
            for pattern in triggers.get("patterns", []):
                if re.search(pattern, prompt_lower):
                    entities = self._extract_entities(prompt, intent)
                    return intent["id"], entities
        
        # Fallback
        return "chat", {}
    
    def _get_memory_for_intent(self, intent_id: str) -> List[str]:
        """Get allowed memory stores from policy"""
        intent_mapping = self.policy["memory_policies"]["read"]["intent_mapping"]
        return intent_mapping.get(intent_id, ["episodic", "stm"])
    
    def _check_tool_permission(
        self,
        tool_id: str,
        user_role: str,
        user_id: str
    ) -> bool:
        """Check if role can use tool and within rate limit"""
        tool_perms = self.policy["tool_permissions"].get(tool_id, {})
        
        # Role check
        allowed_roles = tool_perms.get("allowed_roles", [])
        if user_role not in allowed_roles:
            return False
        
        # Rate limit check
        rate_limit = tool_perms.get("rate_limit", {})
        if rate_limit:
            current = self._rate_limits.get(user_id, {}).get(tool_id, 0)
            if current >= rate_limit["requests"]:
                return False
        
        return True
```

---

## 5. Benefits of Manifest + Policy

| Aspect | Before (Code-Driven) | After (Schema-Driven) |
|--------|---------------------|----------------------|
| **Adding new intent** | Edit Python code | Add to manifest.yaml |
| **Changing permissions** | Edit code, redeploy | Edit policy.yaml, reload |
| **Understanding system** | Read scattered code | Read manifest.yaml |
| **Auditing security** | Code review | Policy review |
| **Multi-environment** | Different code branches | Different policy files |
| **LLM control** | Scattered checks | Explicit `llm_cannot` lists |

---

## 6. File Structure

```
config/
├── manifest.yaml           # What exists
├── policy.yaml             # What's allowed
├── policy.production.yaml  # Production overrides
└── policy.development.yaml # Dev overrides

agent/
├── engine/
│   ├── policy_engine.py    # Policy enforcement
│   ├── manifest_loader.py  # Load & validate manifest
│   └── policy_loader.py    # Load & validate policy
├── core_agent.py           # Uses PolicyEngine
└── ...
```

---

## 7. Summary

**Manifest** answers: "What CAN the system do?"
- Intents, Tools, Specialists, Memory stores

**Policy** answers: "What SHOULD the system do?"
- Permissions, Rate limits, Memory rules, Guardrails

**Core Principle Enforcement:**
```yaml
memory_policies:
  write:
    llm_cannot:
      - "decide_is_memorable"
      - "decide_scope"
      - "decide_category"
```

This makes the rule **explicit and auditable**.
