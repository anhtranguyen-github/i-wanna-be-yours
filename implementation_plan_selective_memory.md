---
title: Memory Filter & Decision Plan
description: Strategic plan to implement a selective memory system for Hanachan to ensure high-quality, relevant context.
---

## 1. Objective
Transform the current "save everything" memory approach into a "selective" system. This ensures that only significant, new, or useful information is stored, preventing noise in retrieveal and reducing storage of redundant data.

## 2. Decision Logic: "The Memory Gatekeeper"

We will introduce a `MemoryEvaluator` class that sits at the start of the `process_interaction` task.

### A. Evaluation Criteria & Scoping
The Gatekeeper must categorize information into three buckets:

1.  **Permanent Profile Facts (Global)**: High-confidence data derived from Account settings or explicit user life facts.
    - *Example*: "I am a medical student", "My primary goal is TOPIK II".
    - *Storage*: Semantic Graph (Neo4j) + Vector (Qdrant) tagged as `scope: permanent`.
2.  **Fixed App Ground Truth**: Data already existing in the app's SQL DB (User Settings, Study Plans).
    - *Action*: The Gatekeeper should NOT save this as "New Memory" if it duplicates structured fields. Instead, it should flag it as `sync_required` if the user contradicts their profile.
3.  **Session-Specific Context (Ephemeral)**: Roleplay roles, temporary personas, or transient conversation topics.
    - *Example*: "For this chat, pretend I am a customer at a cafe", "I am currently roleplaying as a detective".
    - *Storage*: Episodic Vector DB tagged as `scope: session` + `session_id`. It stays in the "Recent History" but is ignored by long-term profile retrieval.

### B. Memory Scoping & Segregation
| Information Type | Storage Engine | Scope Filter | Permanence |
| :--- | :--- | :--- | :--- |
| **User Settings/Goals** | SQL / App DB | UserID | Immutable Ground Truth |
| **Life Facts/Preferences** | Neo4j / Qdrant | UserID | Long-Term |
| **Roleplay / Scenarios** | Qdrant | UserID + SessionID | Session-Only |
| **Gossip / Small Talk** | Trash | N/A | Ignored |

## 3. Implementation Plan

### Phase 1: The Evaluator (Logic)
1. **Create `MemoryEvaluator` Service**:
   - Implement a specialized LLM prompt that takes (User Message, Agent Response) + (Existing Profile Context).
   - Expected Output: A structured JSON:
     ```json
     {
       "is_memorable": boolean,
       "scope": "permanent" | "session" | "reconciliation",
       "reason": "text",
       "category": "roleplay" | "preference" | "fact" 
     }
     ```
2. **Handle Roleplay**: Add specific instructions to detect "Scenario Setting". If a user says "I am a cat", the scope is `session`. If they say "I am allergic to cats", the scope is `permanent`.

### Phase 2: Reconciliation with App Data
1. **Context Loading**: When the `MemoryManager` starts, it should ideally pull "Ground Truth" from the Profile/Goals API. 
2. **Conflict Detection**: If the user says something that contradicts their fixed settings (e.g., "I'm a beginner" but the App Plan says "Intermediate"), the Evaluator should note a `reconciliation` event for the agent to potentially ask for clarification.

### Phase 2: Worker Integration
1. **Update `tasks/memory.py`**:
   - Insert Evaluate step before Summarization and Semantic extraction.
   - If `memorable` is `false`, stop processing immediately.
   - If `true`, use the `reason` or `category` provided by the Evaluator to guide the extraction prompts.

### Phase 3: Semantic Deduplication (The "Already Know" Check)
1. **Semantic Buffer**: Before adding a relationship (e.g., `User LIKES Ramen`), check the Knowledge Graph (Neo4j) for nearly identical existing triples.
2. **Update vs Insert**: If the relationship exists but with a new property (e.g., `since: 2024`), update instead of duplicating.

### Phase 4: Observability & Transparency
1. **Logs**: Detailed logging in the worker:
   - `[GATEKEEPER] Rejected: Interaction is generic small talk.`
   - `[GATEKEEPER] Accepted: User expressed preference for visual learning.`

### Phase 5: Memory Dashboard (Profile Integration)
**Goal**: Allow users to see and manage what Hanachan "knows" about them.
1. **API Development (Hanachan)**:
   - `GET /memory/summary`: Returns a aggregated list of semantic facts (Neo4j) and high-priority episodic memories (Qdrant).
   - `DELETE /memory/<id>`: Allows users to manually strike a memory or fact from the record.
2. **Frontend UI (`src/app/profile/page.tsx`)**:
   - **Neural Impression Section**: A high-fidelity tab or card in the profile page showing "What I know about you".
   - **Categorized View**: Groups memories into "Life Facts", "Learning Preferences", and "Active Goals".
   - **Ephemeral Status**: Show active roleplay contexts (if any) with an option to "Clear Session Context".
3. **Privacy Controls**:
   - **Forget Me Button**: Option to wipe all semantic and episodic memory for a fresh start.
   - **Incognito Mode Toggle**: (Future) Temporarily disable memory storage for the current session.

## 4. Example Prompt for Gatekeeper
```text
SYSTEM: You are the Memory Gatekeeper for a language learning AI. 
Analyze the interaction below. 
Does it contain NEW facts, preferences, goals, or significant pedagogical data about the user?
GREETINGS AND SMALL TALK ARE NOT MEMORABLE.

JSON OUTPUT ONLY:
{
  "is_memorable": boolean,
  "category": "preference" | "fact" | "goal" | "generic",
  "priority": 1-5,
  "brief_justification": "text"
}
```

## 5. Next Steps
1. Create `backend/hanachan/services/memory_evaluator.py`.
2. Mock test the prompt with various chat samples.
3. Integrate with the RQ Worker.
4. Build the `GET /memory/summary` endpoint.
5. Add the "Hanachan's Perception" component to the Profile page.
