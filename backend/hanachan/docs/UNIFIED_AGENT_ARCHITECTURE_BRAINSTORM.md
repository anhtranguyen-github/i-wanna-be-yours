# Unified Agent Architecture Brainstorm: Hanachan Core

> **Status:** Finalized Vision Statement  
> **Philosophy:** "System Governance, LLM Reasoning"  
> **Governance Mantra:** **"LLM Proposes, System Disposes."**
> **Core Principle:** The LLM is a reasoning worker in a system-controlled sandbox. It never decides access, memory fate, or policy.

---

## 1. Big Picture Mental Model

An agent system is **not** one LLM loop. It is a **governed reasoning system**:

```
Intent → Context Assembly → Reasoning → Action Proposal → Policy Check → Execution → Memory Update
```

- **Reasoning**: Handled by LLM (`[LLM]`).
- **Governance**: Handled by the System (`[SYSTEM]`).
- **Safety**: Soft inside (`[LLM]`), hard outside (`[SYSTEM]`).

---

## 2. Manifest vs. Policy (Critical Distinction)

| Concept | Definition | Analogy |
| :--- | :--- | :--- |
| **Manifest** | WHAT EXISTS: A catalog of capabilities (Tools, Specialists, Intents). | Restaurant menu / API Docs |

- **Manifest** (`[SYSTEM]` defined) answers: *What tools exist? What inputs do they have?*
- **Any authenticated user or guest has full access to the tools defined in the Manifest.**

### 3.2 The Policy (What is ALLOWED)
The "Law" of the system, enforced by the **Policy Engine**.
- **Hierarchy**:
    1. **Identity & Isolation**: Is the request authenticated and correctly scoped to a `user_id`? (Level 1: Ensures absolute data isolation).
    2. **Capability**: Does the tool/service exist in the **Manifest**? (Level 2: Validates system possibility).
    3. **Governance**: Is the action proposal safe according to system rules? (Level 3: "LLM Proposes, System Disposes").

- **Core Memory Rule**: LLM cannot decide `is_memorable` or `scope`. The System uses pattern-matching (Internal) to decide what moves to permanent memory.

---

## 4. Interaction Boundaries: [LLM] vs. [SYSTEM]

The system maintains a hard boundary marked by "touches." The LLM **never** has direct authority over the physical environment.

| Action Category | Reasoning Touch `[LLM]` | Governance Touch `[SYSTEM]` |
| :--- | :--- | :--- |
| **Intent Extraction** | `[LLM]` analyzes user text to identify goals. | `[SYSTEM]` triggers the matching workflow. |
| **Memory Write** | `[LLM]` proposes information worth saving. | `[SYSTEM]` approves, filters, and persists. |
| **Tool Usage** | `[LLM]` proposes an action to take. | `[SYSTEM]` checks permissions and executes. |
| **Data Access** | `[LLM]` perceives the assembled context. | `[SYSTEM]` queries DBs and hides internal logic. |
| **Loop Control** | `[LLM]` proposes a next step in the loop. | `[SYSTEM]` enforces limits and terminates loop. |

**The LLM will NOT:**
- Decisions are made by `[SYSTEM]` based on identity isolation.
- Control its own execution loops.
- Write to any memory/database directly.
- Query databases or understand internal system connections.

---

## 5. Resource vs. Artifact vs. Memory

### 5.1 Data Definitions
| Entity | **Resource** (Inbound) | **Artifact** (Outbound / Product) |
| :--- | :--- | :--- |
| **Origin** | External (Uploaded PDFs, Docs, URLs). | Internal (Results of content creator tools). |
| **Nature** | Raw information source. | Structured objects (Flashcard Decks, Exams). |
| **Service** | Handles by **NRS** (Neural Resource Service). | Handles by **ArtifactService**. |

- **Artifacts** are the outputs of reasoning. They are objects like **Flashcard Decks**, **Exams**, and **Quizzes** generated for the user.

### 5.2 RAG vs. Memory (The Distinction)
| Aspect | RAG (Resources) | Memory (Episodic/Semantic) |
| :--- | :--- | :--- |
| **Purpose** | External knowledge | Agent experience |
| **Ownership** | System / Corpus | User / Agent |
| **Mutability** | Read-only | Read/write (via `[SYSTEM]` gate) |

---

## 6. Context Assembly Engine (The Intelligence Layer)

Context is **selective**, not a "dump."

1. **Intent Extraction**: `[LLM]` identifies user goal (e.g., "Grammar Practice").
2. **Policy Filter**: `[SYSTEM]` ensures request is authed and scoped to `user_id`.
3. **Retrieval Planning**: 
    - `[SYSTEM]` pulls **Resources** via similarity.
    - `[SYSTEM]` pulls **Artifacts** (Past work) via history.
4. **Distillation**: `[SYSTEM]` distills findings into a concise "Situation Report."
5. **Prompt Delivery**: `[LLM]` receives the report + user message.

---

## 6. Design Rules for Agent Coders

1. **Never trust the LLM with authority.** `[SYSTEM]` is the final arbiter.
2. **LLM Proposes, System Disposes.** Every reasoning output is an "action proposal."
3. **Everything callable must be declared.** (Manifest as Source of Truth).
4. **Memory is queried, not dumped.** (Context assembly over context dumping).
5. **Loops are system-owned.** `[SYSTEM]` prevents infinite reasoning.
6. **Hide the "Guts".** The LLM never knows about MongoDB, Neo4j, or SQL schemas.

---

## 7. Async Parallel Execution (The Conduit)

To maintain low latency, the **Context Assembly Engine** strictly follows a **Fan-Out Parallel Retrieval** model.

### 7.1 The Parallel Retrieval Blueprint
All memory sources are queried simultaneously using `asyncio.gather`. There are no blocking dependencies between different data types.

```python
# [SYSTEM] Parallel Intelligence Retrieval
results = await asyncio.gather(
    fetch_resources_rag(query),   # [SYSTEM] Qdrant (Textbooks/PDFs)
    fetch_artifacts(user_id),     # [SYSTEM] MongoDB (Generated Quizzes/Flashcards)
    fetch_episodic(user_id),      # [SYSTEM] Qdrant (Chat History)
    fetch_semantic(user_id),      # [SYSTEM] Neo4j (Knowledge Graph)
    fetch_study_plan(user_id)     # [SYSTEM] Service (Stats/Progress)
)
```

- **Latency**: Total time is equal to the slowest single query (~100-200ms), not the sum.
- **Speculative Execution**: The system starts pre-fetching STM and Study Data immediately upon receiving a request, even before [LLM] Intent Extraction is complete.

### 7.2 Post-Response Processing (Fire-and-Forget)
[SYSTEM] operations that do not affect the immediate response are offloaded to background tasks:
- **`[SYSTEM]` Memory Updates**: Persisting new episodic/semantic memories.
- **`[SYSTEM]` Audit Logging**: Recording tool usage and policy decisions.
- **Persistence**: Scanned after the user receives the text stream.

---

## 8. Migration Roadmap
...
