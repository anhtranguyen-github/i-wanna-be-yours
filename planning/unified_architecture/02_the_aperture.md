# Plan 2: The Aperture (Context Assembly)

**Status:** Drafted  
**Objective:** Build the parallel retrieval engine that hides system internal "guts" from the LLM.

---

## 1. Components
- `agent/engine/context_assembler.py`: The "Aperture" class.
- `agent/engine/retrievers/`: Specialized parallel fetchers for RAG, Artifacts, and Memory.

## 2. Shared Constraints (Reference: SHARED_CONSTRAINTS.md)
- **C1: Fan-Out Parallelism**: All `fetch_X` calls MUST run concurrently via `asyncio.gather`.
- **C2: The "Guts" Barrier**: The output must be transformed from raw JSON/IDs into a narrative situation report. No MongoDB IDs or DB types may leak.
- **C3: Fixed Latency**: Retrieval must time out gracefully to prevent user lag.

## 3. Implementation Steps
1. **Parallel Blueprint**: Create the `async` orchestration loop for multi-source retrieval.
2. **The Distiller**: Build a formatter that converts raw DB records into a text-based "Learner Situation Report".
3. **Integration**: Replace `retrieve_context` calls in `core_agent.py` with the new `Aperture.assemble()`.
4. **Hiding Logic**: Audit the distiller to ensure it redacts system metadata/IDs.

## 4. Success Criteria
- Total retrieval time is ≤ time of slowest source.
- LLM receives a "Situation Report" instead of raw concatenated context.
- System logic remains hidden in the final prompt.
