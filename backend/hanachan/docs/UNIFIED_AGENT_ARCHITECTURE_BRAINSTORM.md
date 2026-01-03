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
| **Policy** | WHAT IS ALLOWED: Rules deciding whether something can be done now by whom. | Health inspection / Age check |

- **Manifest** (`[SYSTEM]` defined) answers: *What tools exist? What inputs do they have?*
- **Policy** (`[SYSTEM]` enforced) answers: *Can this agent call this tool? Is the rate limit exceeded?*

---

## 3. Interaction Boundaries: [LLM] vs. [SYSTEM]

The system maintains a hard boundary marked by "touches." The LLM **never** has direct authority over the physical environment.

| Action Category | Reasoning Touch `[LLM]` | Governance Touch `[SYSTEM]` |
| :--- | :--- | :--- |
| **Intent Extraction** | `[LLM]` analyzes user text to identify goals. | `[SYSTEM]` triggers the matching workflow. |
| **Memory Write** | `[LLM]` proposes information worth saving. | `[SYSTEM]` approves, filters, and persists. |
| **Tool Usage** | `[LLM]` proposes an action to take. | `[SYSTEM]` checks permissions and executes. |
| **Data Access** | `[LLM]` perceives the assembled context. | `[SYSTEM]` queries DBs and hides internal logic. |
| **Loop Control** | `[LLM]` proposes a next step in the loop. | `[SYSTEM]` enforces limits and terminates loop. |

**The LLM will NOT:**
- Decide permissions.
- Control its own execution loops.
- Write to any memory/database directly.
- Query databases or understand internal system connections.

---

## 4. Resource vs. Artifact vs. Memory

### 4.1 Data Definitions
| Entity | **Resource** (Inbound) | **Artifact** (Outbound / Product) |
| :--- | :--- | :--- |
| **Origin** | External (Uploaded PDFs, Docs, URLs). | Internal (Results of content creator tools). |
| **Nature** | Raw information source. | Structured objects (Flashcard Decks, Exams). |
| **Service** | Handles by **NRS** (Neural Resource Service). | Handles by **ArtifactService**. |

- **Artifacts** are the outputs of reasoning. They are objects like **Flashcard Decks**, **Exams**, and **Quizzes** generated for the user.

### 4.2 RAG vs. Memory (The Distinction)
| Aspect | RAG (Resources) | Memory (Episodic/Semantic) |
| :--- | :--- | :--- |
| **Purpose** | External knowledge | Agent experience |
| **Ownership** | System / Corpus | User / Agent |
| **Mutability** | Read-only | Read/write (via `[SYSTEM]` gate) |

---

## 5. Context Assembly Engine (The Intelligence Layer)

Context is **selective**, not a "dump."

1. **Intent Extraction**: `[LLM]` identifies user goal (e.g., "Grammar Practice").
2. **Policy Filter**: `[SYSTEM]` checks user role (Premium/Free) and tool access.
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

## 7. Migration Roadmap

1. **Phase 1: Declarative Config**
    - Move `HanachanAgent.tools` to `manifest.yaml`.
2. **Phase 2: The Context Assembler**
    - Build the `Aperture` class to hide internal logic from `[LLM]`.
3. **Phase 3: Governance Swap**
    - Move from "LLM-decides-memory" to "LLM-proposes-memory".
    - Replace `MemoryEvaluator` with `[SYSTEM]` rules.

---

## 8. Final Vision One-Liner

> "Hanachan is a secure operating system where the LLM is the reasoning interface, and the System is the sovereign authority."
