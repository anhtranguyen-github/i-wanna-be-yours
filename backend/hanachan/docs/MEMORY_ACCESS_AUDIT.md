# Memory Access Audit Report

**Date:** 2026-01-03  
**Principle Under Test:** "The LLM must never decide what memory to read or write"

---

## Executive Summary

| Area | Status | Violations |
|------|--------|------------|
| **Memory Reading** | ⚠️ PARTIAL VIOLATION | LLM query used for retrieval |
| **Memory Writing** | 🔴 VIOLATION | LLM decides if memory is saved |
| **Scope Selection** | 🔴 VIOLATION | LLM decides permanent vs session |
| **Filtering** | ✅ COMPLIANT | System filters by user_id |

---

## Detailed Findings

### 1. Memory READING (Retrieval)

**Location:** `agent/core_agent.py` lines 111-117

```python
# Current Code
memory_context = self.memory_manager.retrieve_context(prompt, user_id=user_id, token=token)
```

**Analysis:**

| Decision | Who Makes It? | Violation? |
|----------|---------------|------------|
| Whether to retrieve memory | System (LTM_ENABLED env var) | ✅ OK |
| Which user's memory | System (user_id) | ✅ OK |
| What query to use | **LLM's prompt** is passed | ⚠️ PARTIAL |
| How many results | System (hardcoded limit) | ✅ OK |

**Issue:** The user's prompt (potentially influenced by LLM's interpretation) is used as the similarity search query.

```python
# In memory/manager.py line 148
episodic_context = self.episodic.retrieve(query, user_id=user_id)
#                                          ^^^^^ This is the user's prompt
```

**Risk:** While the LLM doesn't directly control retrieval, the prompt shapes what's retrieved. A manipulated prompt could:
- Surface irrelevant memories
- Influence what context is injected

---

### 2. Memory WRITING (Save Decision)

**Location:** `tasks/memory.py` lines 60-76 + `services/memory_evaluator.py`

```python
# Current Code - LLM DECIDES IF MEMORY IS SAVED
evaluator = MemoryEvaluator()
eval_result = evaluator.evaluate_interaction(user_message, agent_response)
is_memorable = eval_result.get("is_memorable", False)  # LLM decides!
scope = eval_result.get("scope", "none")  # LLM decides!

if not is_memorable or scope == "none":
    logger.info(f"⏭️ [GATEKEEPER] Skipping memory for session {session_id}")
    return True
```

**Analysis:**

| Decision | Who Makes It? | Violation? |
|----------|---------------|------------|
| Whether to save | **LLM** (MemoryEvaluator) | 🔴 VIOLATION |
| Permanent vs Session | **LLM** (scope field) | 🔴 VIOLATION |
| Category classification | **LLM** (category field) | 🔴 VIOLATION |
| What user_id to associate | System | ✅ OK |
| What metadata to add | System (timestamp, session_id) | ✅ OK |

**MemoryEvaluator** (`services/memory_evaluator.py`):
```python
# LLM is asked to decide memory fate
self.system_prompt = """You are the 'Memory Gatekeeper' for Hanachan...
JSON OUTPUT ONLY:
{{
  "is_memorable": boolean,  <-- LLM decides
  "scope": "permanent" | "session" | "none",  <-- LLM decides
  ...
}}"""
```

**This is a DIRECT VIOLATION of the core principle.**

---

### 3. Memory Content (What Gets Written)

**Location:** `tasks/memory.py` lines 78-94

```python
# LLM generates the summary that gets stored
summary_prompt = ChatPromptTemplate.from_messages([
    ("system", "Summarize this interaction in a single, descriptive sentence..."),
    ("human", "{interaction}")
])
summary = llm.invoke(messages).content  # LLM generates what gets stored

episodic.add_memory(summary, user_id=user_id, metadata=meta)
```

**Analysis:**

| Decision | Who Makes It? | Violation? |
|----------|---------------|------------|
| Summary content | **LLM** | ⚠️ Acceptable (LLM generates text) |
| Whether summarization runs | Prior LLM decision (is_memorable) | 🔴 VIOLATION |

**Note:** The LLM generating the summary itself is acceptable (it's a text generation task). But the LLM deciding WHETHER to summarize is the violation.

---

### 4. Semantic Memory (Knowledge Graph)

**Location:** `tasks/memory.py` lines 99-127

```python
# Only run semantic extraction if scope is permanent
if scope == "permanent":  # scope was decided by LLM!
    extraction_prompt = ChatPromptTemplate.from_messages([...])
    response = llm.invoke(messages).content
    kg_data = _parse_json_safely(response)
    if kg_data and "relationships" in kg_data:
        semantic.add_relationships(valid_rels, user_id=user_id)
```

**Analysis:**

| Decision | Who Makes It? | Violation? |
|----------|---------------|------------|
| Whether to extract KG | **LLM** (scope == "permanent") | 🔴 VIOLATION |
| What relationships to extract | **LLM** (extraction prompt) | ⚠️ Acceptable |
| Who owns the relationships | System (user_id) | ✅ OK |

---

## Violation Summary

### 🔴 Critical Violations

1. **MemoryEvaluator**: LLM decides `is_memorable` (whether to save)
2. **MemoryEvaluator**: LLM decides `scope` (permanent vs session vs none)
3. **MemoryEvaluator**: LLM decides `category` (fact, preference, goal)
4. **Semantic extraction**: Gated by LLM's `scope` decision

### ⚠️ Partial Concerns

1. **Retrieval query**: User prompt used for similarity search
   - Mitigation: This is acceptable if prompt isn't manipulated by LLM

### ✅ Compliant Areas

1. **User isolation**: Always filtered by user_id
2. **Metadata**: System controls timestamps, session_ids
3. **Storage location**: System decides Qdrant vs Neo4j
4. **Rate of retrieval**: System controls frequency

---

## Recommended Fixes

### Fix 1: Replace LLM MemoryEvaluator with Rule-Based System

```python
# NEW: services/memory_evaluator.py

class SystemMemoryEvaluator:
    """Rule-based memory evaluation - NO LLM"""
    
    # Keywords that indicate permanent memory
    PERMANENT_INDICATORS = [
        r"\b(my name is|I am|I'm)\s+\w+",
        r"\b(I work|my job|I'm a|profession)\b",
        r"\b(my goal|I want to|I hope to|I plan to)\b",
        r"\b(years old|my age|I am \d+)\b",
        r"\b(I prefer|I like|I don't like|my favorite)\b",
        r"\b(JLPT\s*)?N[1-5]\b",  # JLPT level mentions
    ]
    
    # Keywords that indicate session-only memory
    SESSION_INDICATORS = [
        r"\b(pretend|roleplay|imagine|let's say)\b",
        r"\b(for now|just for this|temporarily)\b",
    ]
    
    # Keywords that indicate NO memory needed
    IGNORE_INDICATORS = [
        r"^(hi|hello|hey|thanks|thank you|bye|goodbye|ok|okay|sure|yes|no)$",
        r"^.{0,10}$",  # Very short messages
    ]
    
    def evaluate_interaction(self, user_message: str, agent_response: str) -> Dict[str, Any]:
        """SYSTEM decides - NO LLM CALL"""
        text = f"{user_message} {agent_response}".lower()
        
        # Check ignore patterns first
        if any(re.search(p, user_message.lower()) for p in self.IGNORE_INDICATORS):
            return {"is_memorable": False, "scope": "none", "reason": "Greeting/short message"}
        
        # Check permanent indicators
        for pattern in self.PERMANENT_INDICATORS:
            if re.search(pattern, text, re.IGNORECASE):
                return {
                    "is_memorable": True, 
                    "scope": "permanent", 
                    "reason": f"Matched pattern: {pattern[:20]}..."
                }
        
        # Check session indicators
        for pattern in self.SESSION_INDICATORS:
            if re.search(pattern, text, re.IGNORECASE):
                return {
                    "is_memorable": True, 
                    "scope": "session", 
                    "reason": f"Session context: {pattern[:20]}..."
                }
        
        # Default: Save to episodic with low priority
        if len(user_message) > 50:  # Substantial message
            return {"is_memorable": True, "scope": "temporary", "reason": "Substantial interaction"}
        
        return {"is_memorable": False, "scope": "none", "reason": "No significant content"}
```

### Fix 2: System-Controlled Memory Scope

```python
# NEW: Scope is ALWAYS determined by configuration, not LLM

class MemoryScope(Enum):
    PERMANENT = "permanent"   # User profile, goals, preferences
    SESSION = "session"       # Roleplay context, temp instructions
    EPISODIC = "episodic"     # Conversation history summaries
    NONE = "none"             # Don't store

# System configuration for memory behavior
MEMORY_CONFIG = {
    "always_save_episodic": True,      # Always save conversation summaries
    "permanent_requires_match": True,   # Only save to permanent if pattern matches
    "max_episodic_per_session": 50,    # Cap on episodic memories per session
    "semantic_extraction_enabled": True,
}
```

### Fix 3: Decouple LLM from Memory Decisions

```python
# NEW tasks/memory.py

def process_interaction(session_id: str, user_id: str, user_message: str, agent_response: str):
    """SYSTEM decides all memory operations"""
    
    # 1. SYSTEM evaluates (no LLM)
    evaluator = SystemMemoryEvaluator()
    eval_result = evaluator.evaluate_interaction(user_message, agent_response)
    
    # 2. SYSTEM decides if we save
    if not eval_result["is_memorable"]:
        return True
    
    # 3. SYSTEM decides scope based on rules
    scope = eval_result["scope"]
    
    # 4. LLM only generates TEXT (summary) - not decisions
    if scope in ["permanent", "episodic"]:
        summary = generate_summary(user_message, agent_response)  # LLM for text only
        episodic.add_memory(summary, user_id=user_id, metadata={...})
    
    # 5. SYSTEM decides if semantic extraction runs
    if scope == "permanent" and MEMORY_CONFIG["semantic_extraction_enabled"]:
        # LLM extracts relationships (text task, not decision)
        relationships = extract_relationships(user_message, agent_response)
        semantic.add_relationships(relationships, user_id=user_id)
```

---

## Action Items

| Priority | Task | Effort |
|----------|------|--------|
| 🔴 HIGH | Replace MemoryEvaluator with rule-based system | 2 hours |
| 🔴 HIGH | Remove LLM scope decision | 1 hour |
| 🟡 MED | Add memory configuration system | 2 hours |
| 🟡 MED | Add audit logging for memory operations | 1 hour |
| 🟢 LOW | Add rate limiting for memory writes | 1 hour |

---

## Conclusion

The current implementation **violates the core principle** in several critical areas:

1. **LLM decides WHETHER to save memory** (MemoryEvaluator.is_memorable)
2. **LLM decides SCOPE of memory** (permanent vs session)
3. **LLM decisions gate other operations** (semantic extraction)

The LLM should only:
- Generate text content (summaries, extractions)
- NOT decide if/what/where to store

All storage decisions must move to the SYSTEM:
- Pattern-based evaluation
- Rule-based scope assignment
- Configuration-driven behavior
