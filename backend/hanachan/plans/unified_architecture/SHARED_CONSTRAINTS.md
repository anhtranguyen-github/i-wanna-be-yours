# Shared Governance & Constraints

**Folder:** `backend/hanachan/plans/unified_architecture/`

This document defines the non-negotiable logic and flow constraints that ALL sub-plans must follow.

---

## 1. The Mantra: [LLM] Proposes, [SYSTEM] Disposes
- All plans must ensure that `[LLM]` never performs I/O, database writes, or permission checks.
- Every "action" from an LLM is treated as a `PotentialAction` object that must be validated by the `PolicyEngine`.

## 2. Shared Data Flow
1. **Inbound**: Only `Chat` + `Resources`.
2. **Context**: Must be assembled in **parallel** and distilled into a "Soft Narrative" for the LLM.
3. **Internal Logic**: Must remain **Hidden**. No service names, database types, or primary keys should appear in LLM prompts.
4. **Outbound**: Only `Messages` + `Artifacts`.

## 3. Tool Execution Standard
- All tools must return a standardized `ToolResponse` object.
- Tools that create objects must return them as `Artifact` references, never as raw database dumps.

## 4. Async Coordination
- All retrieval must be `asyncio` based.
- All persistence updates must be backgrounded (Fire-and-forget) to ensure zero user-facing latency.

## 5. Vision Alignment
- All implementation details MUST align with the vision in `backend/hanachan/docs/UNIFIED_AGENT_ARCHITECTURE_BRAINSTORM.md`.
- References to this vision document are mandatory in code comments for architectural decisions.

## 6. Coordination Testing
- "Silent" unit tests are insufficient. Every major component must be validated via **Coordinated Test Flows**.
- Tests must simulate cross-feature interactions (e.g., Intent -> Tool -> Artifact -> Memory Update) to ensure shared logic works in symphony.

## 7. Clean Break (No Legacy Support)
- This is a transformative architecture. **Do NOT handle legacy data schemas or corrupted state.**
- If a legacy record is encountered, the system should **throw a general error** and skip it.
- Prioritize cleaning the foundation over maintaining backward compatibility for experimental data.

## 8. Real-World Validation (No Mocks)
- **Zero Mocking of Models**: All reasoning and intent detection MUST be performed by real models running in the Ollama docker container. 
- **Physical Data Seeding**: If specific data states are required for a test, they must be physically seeded into the database (Mongo/Neo4j/Postgres) before the test runs. Mocking database returns is prohibited.
- **Simulation Boundary**: We can only simulate the *human* side (user chat messages). We must never simulate the *model* side (the agent's response). The system must prove its behavior through live inference.

---

## 9. Directory Mapping
- **Config**: `backend/hanachan/config/` (Manifests & Policies)
- **Engine**: `backend/hanachan/agent/engine/` (Aperture, PolicyEngine)
- **Schema**: `backend/hanachan/schemas/` (Unified I/O models)

---

## 9. Shared Context Memory
The `plans/unified_architecture/shared_context/` folder will store current state and coordination logs for these plans to ensure they don't drift apart during execution.
