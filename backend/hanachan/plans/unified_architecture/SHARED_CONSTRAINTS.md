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

## 5. Directory Mapping
- **Config**: `backend/hanachan/config/` (Manifests & Policies)
- **Engine**: `backend/hanachan/agent/engine/` (Aperture, PolicyEngine)
- **Schema**: `backend/hanachan/schemas/` (Unified I/O models)

---

## 6. Shared Context Memory
The `plans/unified_architecture/shared_context/` folder will store current state and coordination logs for these plans to ensure they don't drift apart during execution.
