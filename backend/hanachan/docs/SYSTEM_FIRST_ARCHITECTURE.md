# System-First Architecture Proposal

**Date:** 2026-01-03  
**Status:** RFC (Request for Comments)  
**Philosophy:** "System decides, LLM supports" vs "LLM decides, System supports"

---

## 1. The Paradigm Shift

### Current Model: LLM-Centric
```
User Input → LLM (decides everything) → Tools/Memory/Response
                    ↓
              "What should I do?"
              "Which tool to call?"
              "How to respond?"
```

**Problems:**
- LLM is unpredictable (hallucinations, inconsistent tool selection)
- Expensive (every decision needs LLM call)
- Hard to debug (LLM is black box)
- No guarantees (LLM might ignore tools, bypass safety)

### Proposed Model: System-Centric
```
User Input → SYSTEM (decides workflow) → LLM (generates text only)
                    ↓
              Pattern matching
              State machine
              Rule-based routing
              Deterministic logic
```

**Benefits:**
- Predictable behavior
- Cheaper (LLM only for final text)
- Debuggable (system logs show exact path)
- Guaranteed (system enforces rules)

---

## 2. Core Philosophy

### LLM as "Text Generator", Not "Decision Maker"

| Responsibility | Current | Proposed |
|---------------|---------|----------|
| Route to specialist | LLM | System (pattern match) |
| Decide which tool | LLM | System (rules engine) |
| Check user permissions | LLM (implicit) | System (explicit) |
| Validate inputs | LLM (maybe) | System (schemas) |
| Format response | LLM | LLM ✓ |
| Generate content | LLM | LLM ✓ |
| Maintain persona | LLM | LLM ✓ |

**LLM should only:**
1. Generate natural language responses
2. Create content (flashcards, explanations)
3. Maintain conversational persona

**System should:**
1. ALL routing decisions
2. ALL tool invocations
3. ALL permission checks
4. ALL input validation
5. ALL state management

---

## 3. Architecture Design

### System-First Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INPUT                                   │
│                 "Create flashcards for N5 verbs"                    │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    1. INTENT CLASSIFIER                              │
│                      (System - No LLM)                               │
│                                                                      │
│   Pattern: "create flashcards" → Intent.CREATE_CONTENT              │
│   Entity:  "N5" → level, "verbs" → topic                           │
│                                                                      │
│   Output: { intent: CREATE_CONTENT, entities: {...} }               │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    2. WORKFLOW ENGINE                                │
│                      (System - No LLM)                               │
│                                                                      │
│   Workflow for CREATE_CONTENT:                                      │
│     Step 1: Validate user has permission                            │
│     Step 2: Check rate limits                                       │
│     Step 3: Load user context (level, preferences)                  │
│     Step 4: Execute tool: create_study_flashcards()                 │
│     Step 5: Pass result to LLM for response                         │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    3. LLM (Text Generation Only)                     │
│                                                                      │
│   Input: Tool result + Persona + User context                       │
│   Task: "Generate friendly response about created flashcards"       │
│   Output: Natural language response                                  │
│                                                                      │
│   NO DECISIONS - Just text generation                               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Intent System

### Intent Catalog (Deterministic)

```python
class Intent(Enum):
    # Content Creation
    CREATE_FLASHCARDS = "create_flashcards"
    CREATE_QUIZ = "create_quiz"
    CREATE_EXAM = "create_exam"
    
    # Learning
    EXPLAIN_GRAMMAR = "explain_grammar"
    TRANSLATE = "translate"
    PRACTICE_CONVERSATION = "practice_conversation"
    
    # Progress
    CHECK_PROGRESS = "check_progress"
    VIEW_HISTORY = "view_history"
    GET_SUGGESTIONS = "get_suggestions"
    
    # Planning
    CREATE_PLAN = "create_plan"
    UPDATE_GOALS = "update_goals"
    RECALIBRATE = "recalibrate"
    
    # Memory
    RECALL_PAST = "recall_past"
    SEARCH_RESOURCES = "search_resources"
    
    # General
    CHAT = "chat"  # Fallback
```

### Pattern Matching (Fast, No LLM)

```python
INTENT_PATTERNS = {
    Intent.CREATE_FLASHCARDS: [
        r"(make|create|generate)\s+(me\s+)?(some\s+)?flashcards?",
        r"flashcards?\s+(for|about|on)",
        r"I (want|need) flashcards?"
    ],
    Intent.EXPLAIN_GRAMMAR: [
        r"(explain|what is|how (do|does)|tell me about)\s+.*(grammar|particle|form|conjugat)",
        r"(meaning|use) of\s+[^\s]+",
        r"difference between .+ and .+"
    ],
    Intent.CHECK_PROGRESS: [
        r"(how am I|my progress|how('m| am) I doing)",
        r"(show|check|view)\s+(my\s+)?(progress|stats|streaks?)",
        r"am I (improving|getting better)"
    ],
    Intent.RECALL_PAST: [
        r"(remember|recall|last time|we (talked|discussed)|you (said|told))",
        r"what did (I|we) (learn|study|do)",
        r"my (notes|history)"
    ],
    # ... more patterns
}

class IntentClassifier:
    def classify(self, text: str) -> Tuple[Intent, Dict[str, Any]]:
        text_lower = text.lower()
        
        for intent, patterns in INTENT_PATTERNS.items():
            for pattern in patterns:
                match = re.search(pattern, text_lower)
                if match:
                    entities = self._extract_entities(text, intent)
                    return intent, entities
        
        # Fallback to general chat
        return Intent.CHAT, {}
```

---

## 5. Workflow Engine

### Workflow Definition

```python
@dataclass
class WorkflowStep:
    name: str
    action: Callable
    requires_llm: bool = False
    on_error: str = "abort"  # or "continue", "retry"

class Workflow:
    def __init__(self, intent: Intent, steps: List[WorkflowStep]):
        self.intent = intent
        self.steps = steps

# Define workflows for each intent
WORKFLOWS = {
    Intent.CREATE_FLASHCARDS: Workflow(
        intent=Intent.CREATE_FLASHCARDS,
        steps=[
            WorkflowStep("validate_permissions", check_user_can_create),
            WorkflowStep("rate_limit", check_rate_limit),
            WorkflowStep("load_context", load_user_level_and_preferences),
            WorkflowStep("extract_params", extract_topic_and_level),
            WorkflowStep("execute_tool", execute_create_flashcards),
            WorkflowStep("format_response", format_with_llm, requires_llm=True),
        ]
    ),
    
    Intent.EXPLAIN_GRAMMAR: Workflow(
        intent=Intent.EXPLAIN_GRAMMAR,
        steps=[
            WorkflowStep("load_context", load_user_level),
            WorkflowStep("search_resources", search_relevant_resources),
            WorkflowStep("retrieve_memory", get_related_past_discussions),
            WorkflowStep("generate_explanation", generate_with_llm, requires_llm=True),
        ]
    ),
    
    Intent.CHAT: Workflow(
        intent=Intent.CHAT,
        steps=[
            WorkflowStep("load_context", load_full_context),
            WorkflowStep("generate_response", chat_with_llm, requires_llm=True),
        ]
    ),
}
```

### Workflow Executor

```python
class WorkflowExecutor:
    def __init__(self, llm, memory_manager, tool_registry):
        self.llm = llm
        self.memory = memory_manager
        self.tools = tool_registry
    
    def execute(self, intent: Intent, entities: Dict, context: Dict) -> str:
        workflow = WORKFLOWS.get(intent, WORKFLOWS[Intent.CHAT])
        state = {"entities": entities, "context": context, "results": {}}
        
        for step in workflow.steps:
            try:
                logger.info(f"[Workflow] Executing step: {step.name}")
                
                if step.requires_llm:
                    result = step.action(state, self.llm)
                else:
                    result = step.action(state)
                
                state["results"][step.name] = result
                
            except Exception as e:
                logger.error(f"[Workflow] Step {step.name} failed: {e}")
                if step.on_error == "abort":
                    return self._error_response(step.name, e)
                # else continue
        
        return state["results"].get("format_response") or state["results"].get("generate_response")
```

---

## 6. LLM Role (Minimal)

### When LLM is Called

| Task | LLM Needed? | Why |
|------|-------------|-----|
| Route to specialist | ❌ No | Pattern matching |
| Select tool | ❌ No | Workflow defines it |
| Execute tool | ❌ No | Direct function call |
| Validate params | ❌ No | Pydantic schemas |
| Check permissions | ❌ No | Rule engine |
| Generate explanation | ✅ Yes | Natural language |
| Create flashcard content | ✅ Yes | Creative content |
| Format response | ✅ Yes | Persona + style |
| Conversation practice | ✅ Yes | Interactive dialogue |

### LLM Prompt Structure (Simplified)

```python
def generate_response(state: Dict, llm) -> str:
    """LLM just generates text based on prepared context"""
    
    prompt = f"""
You are Hanachan, an AI Japanese tutor.

## TASK
{state['task_description']}

## CONTEXT
User Level: {state['context']['level']}
Previous Discussion: {state['context'].get('memory_summary', 'None')}

## DATA (from system)
{state['results'].get('tool_output', '')}

## INSTRUCTIONS
Generate a friendly, helpful response. Do not make decisions about what to do next - 
just respond based on the data provided above.
"""
    
    return llm.invoke([HumanMessage(content=prompt)]).content
```

---

## 7. Comparison

### Scenario: "Create 5 flashcards about N4 particles"

#### Current (LLM-Centric)
```
1. User input → Agent
2. Agent passes to LLM with all tools bound
3. LLM thinks: "I should use create_study_flashcards tool"
4. LLM generates: { tool_call: "create_study_flashcards", args: {...} }
5. System executes tool
6. LLM sees result
7. LLM generates response
```
**LLM Calls: 2** (decision + response)  
**System Control: Low**

#### Proposed (System-Centric)
```
1. User input → Intent Classifier
2. Pattern match: "create flashcards" → Intent.CREATE_FLASHCARDS
3. Entity extraction: level=N4, topic=particles, count=5
4. Workflow starts:
   - validate_permissions() ✓
   - rate_limit() ✓
   - create_study_flashcards(N4, particles, 5)
5. Tool result → LLM for response formatting
6. LLM generates friendly response
```
**LLM Calls: 1** (response only)  
**System Control: High**

---

## 8. Benefits Summary

| Aspect | LLM-Centric | System-Centric |
|--------|-------------|----------------|
| **Predictability** | Low | High |
| **Debuggability** | Hard (black box) | Easy (logs + traces) |
| **Cost** | Higher (more LLM calls) | Lower (LLM for text only) |
| **Latency** | Higher | Lower |
| **Safety** | LLM might bypass | System enforces |
| **Testing** | Hard to unit test | Easy to unit test |
| **Versioning** | LLM behavior varies | Deterministic code |

---

## 9. Implementation Plan

### Phase 1: Intent System
- [ ] Define Intent enum
- [ ] Create pattern library
- [ ] Build IntentClassifier
- [ ] Add entity extraction

### Phase 2: Workflow Engine
- [ ] Define Workflow and WorkflowStep models
- [ ] Create workflow definitions for each intent
- [ ] Build WorkflowExecutor
- [ ] Integrate with existing tools

### Phase 3: LLM Simplification
- [ ] Remove tool binding from LLM
- [ ] Create response-only prompt templates
- [ ] Add task-specific LLM calls (explain, format, chat)

### Phase 4: Migration
- [ ] Feature flag for new architecture
- [ ] A/B testing (LLM-centric vs System-centric)
- [ ] Gradual rollout
- [ ] Deprecate old Neural Swarm

---

## 10. Code Structure

```
agent/
├── core_agent.py          # Simplified - just orchestration
├── intent/
│   ├── classifier.py      # Pattern-based intent detection
│   ├── patterns.py        # Regex patterns for intents
│   └── entities.py        # Entity extraction
├── workflow/
│   ├── engine.py          # Workflow executor
│   ├── definitions.py     # Workflow definitions per intent
│   └── steps/             # Reusable workflow steps
│       ├── validation.py
│       ├── context.py
│       ├── tools.py
│       └── llm.py
├── llm/
│   ├── generator.py       # Text generation only
│   └── prompts/           # Task-specific prompts
│       ├── explain.py
│       ├── format.py
│       └── chat.py
└── skills/                # Deprecated (replaced by workflows)
```

---

## 11. Example: Full Flow

```python
# New core_agent.py (simplified)

class HanachanAgent:
    def __init__(self):
        self.classifier = IntentClassifier()
        self.executor = WorkflowExecutor(...)
        self.llm = ModelFactory.create_chat_model()
    
    def invoke(self, prompt: str, user_id: str, **kwargs) -> str:
        # 1. SYSTEM classifies intent (no LLM)
        intent, entities = self.classifier.classify(prompt)
        logger.info(f"[Agent] Intent: {intent}, Entities: {entities}")
        
        # 2. SYSTEM loads context
        context = self.load_context(user_id, intent)
        
        # 3. SYSTEM executes workflow
        response = self.executor.execute(intent, entities, context)
        
        # 4. (Workflow uses LLM internally for text generation)
        return response
```

---

## 12. Key Insight

> **"LLMs are excellent at language, terrible at logic."**

By moving all logic to the system, we get:
- Reliable, predictable behavior
- Cheaper operations (fewer LLM calls)
- Easier debugging and monitoring
- Better safety guarantees
- Faster response times

The LLM becomes a **powerful text engine** rather than an **unpredictable decision maker**.
