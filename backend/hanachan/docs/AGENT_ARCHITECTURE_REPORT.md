# Hanachan Agent Architecture Report

**Generated:** 2026-01-03  
**Purpose:** Document agent tool usage, database access patterns, and security status

---

## 1. Agent Core Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER REQUEST                                  │
│            "Create flashcards about N5 grammar"                     │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    NEURAL SWARM ROUTER                               │
│                 (agent/neural_swarm.py)                              │
│                                                                      │
│  1. Ask LLM: "Which specialist handles this?"                       │
│  2. Options: analyst, linguist, strategist, general                 │
│  3. Routes to appropriate specialist                                │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SPECIALIST AGENT                                  │
│               (SpecialistAgent with Skill Card)                      │
│                                                                      │
│  Uses Skill Card (JSON) for persona + tool access                   │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    TOOL EXECUTION LOOP                               │
│               (_run_agent_loop in core_agent.py)                     │
│                                                                      │
│  1. LLM decides which tool to call                                  │
│  2. Execute tool → Get result                                       │
│  3. Append ToolMessage with result                                  │
│  4. LLM generates final response                                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Available Tools

| Tool | Purpose | Location |
|------|---------|----------|
| `generate_suggested_goals` | Create SMART study goals | study_tools.py |
| `audit_study_progress` | Analyze learning progress | study_tools.py |
| `prepare_milestone_exam` | Generate exam structure | study_tools.py |
| `perform_detailed_audit` | Comprehensive performance audit | study_tools.py |
| `update_goal_progress` | Mark goals as complete | study_tools.py |
| `query_learning_records` | Query history (exams, flashcards) | study_tools.py |
| `recalibrate_study_priorities` | Adjust study plan priorities | study_tools.py |
| `create_study_flashcards` | Generate flashcards for a topic | study_tools.py |
| `create_study_quiz` | Create multiple-choice quiz | study_tools.py |
| `create_practice_exam` | Generate JLPT practice exam | study_tools.py |

---

## 3. Skill Cards

| Skill Card | Specialty | Tools |
|------------|-----------|-------|
| **Analyst** | Data-driven audits | audit_study_progress, query_learning_records, perform_detailed_audit |
| **Linguist** | Language teaching | create_study_flashcards, create_study_quiz |
| **Strategist** | Study planning | generate_suggested_goals, recalibrate_study_priorities |

Skill cards are defined in `agent/skills/cards/*.json`

---

## 4. Database Access Pattern

### Does the agent interact directly with databases?

**NO for relational DBs** - Uses Service Layer pattern ✅  
**YES for vector/graph DBs** - Direct access via MemoryManager ⚠️

```
                         AGENT CORE
                              │
                              ▼
                          TOOLS
                              │
                              ▼
                     SERVICE CLIENTS  ──────→  HTTP REQUESTS
                              │                     │
                              ▼                     ▼
                     EXTERNAL MICROSERVICES    DATABASES
                     (Study Plan, NRS)       (MongoDB, PostgreSQL)
```

### Access Summary

| Component | Database Access | Method |
|-----------|-----------------|--------|
| **Agent Core** | ❌ None | Uses Memory Manager |
| **Tools (study_tools.py)** | ❌ None | Calls `StudyServiceClient` |
| **StudyServiceClient** | ❌ None | HTTP requests to Study Plan Service |
| **ArtifactService** | ⚠️ **YES** | Direct MongoDB access |
| **MemoryManager** | ⚠️ **YES** | Direct Qdrant/Neo4j access |

### Direct Database Access Points

| Service | Target DB | Type |
|---------|-----------|------|
| ArtifactService | MongoDB | Artifacts collection |
| MemoryManager.episodic | Qdrant | Vector search |
| MemoryManager.semantic | Neo4j | Graph queries |
| MemoryManager.resource_memory | Qdrant | Resource vectors |

---

## 5. Security & Guardrails Status

### What EXISTS ✅

| Security Measure | Implementation | Location |
|------------------|----------------|----------|
| **User Scoping** | `user_id` passed to all tools | core_agent.py |
| **Token Passing** | JWT token forwarded to services | core_agent.py |
| **Memory Isolation** | Qdrant/Neo4j filter by `user_id` | episodic.py, semantic.py |
| **Max Iterations** | Tool loop limited to 5 iterations | core_agent.py |
| **External API Auth** | Bearer token in headers | study_tools.py |

### What's MISSING ❌

| Security Measure | Status | Risk |
|------------------|--------|------|
| **Input Validation** | ❌ None | Prompt injection possible |
| **Output Guardrails** | ❌ None | Harmful content possible |
| **Tool Permission Checks** | ❌ None | Any tool callable by any user |
| **Rate Limiting (Agent)** | ❌ None | Tool spam possible |
| **Tool Argument Validation** | ❌ Minimal | Invalid args could cause errors |
| **Audit Logging** | ⚠️ Partial | Only observability logs exist |

---

## 6. LTM Integration Status

### Components

| Component | Storage | Status |
|-----------|---------|--------|
| **Episodic Memory** | Qdrant (768-dim) | ✅ Active |
| **Resource Memory** | Qdrant (768-dim) | ✅ Active |
| **Semantic Memory** | Neo4j | ✅ Active |
| **Study Memory** | External API (port 5500) | ⚠️ Service offline |
| **Background Queue** | Redis | ✅ Active |
| **LLM** | Ollama (qwen2.5:0.5b) | ✅ Active |

### Memory Flow

```
USER CHAT
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│              MEMORY MANAGER (memory/manager.py)                 │
│                                                                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐        │
│  │  Episodic  │  │  Semantic  │  │      Study         │        │
│  │  (Qdrant)  │  │  (Neo4j)   │  │  (External API)    │        │
│  └────────────┘  └────────────┘  └────────────────────┘        │
│                                                                 │
│  ┌────────────────────────────────────────────────────┐        │
│  │            Resource Memory (Qdrant)                │        │
│  └────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Recommendations

### High Priority

1. **Add Input Guardrails** - Detect prompt injection patterns
2. **Implement Tool Permissions** - Role-based tool access control
3. **Add Output Filtering** - PII/harmful content detection

### Medium Priority

4. **Agent-level Rate Limiting** - Prevent tool spam
5. **Tool Argument Validation** - Pydantic schemas for tool inputs
6. **Comprehensive Audit Logging** - Track all tool invocations

### Low Priority

7. **Circuit Breakers** - For external service calls
8. **Tool Usage Analytics** - Dashboard for monitoring

---

## 8. File References

| File | Purpose |
|------|---------|
| `agent/core_agent.py` | Main agent orchestrator |
| `agent/neural_swarm.py` | Specialist routing |
| `agent/tools/study_tools.py` | Tool implementations |
| `agent/skills/cards/*.json` | Skill card definitions |
| `agent/skills/skill_card.py` | Skill card loader |
| `memory/manager.py` | Unified memory interface |
| `services/study_service.py` | Study Plan API client |
| `services/artifact_service.py` | Artifact CRUD operations |
