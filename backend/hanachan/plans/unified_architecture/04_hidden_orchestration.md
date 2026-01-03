# Plan 4: Hidden Orchestration (Memory & State)

**Status:** Drafted  
**Objective:** Move memory persistence and state management to the "Hidden" background layer.

---

## 1. Components
- `tasks/orchestrator.py`: Fire-and-forget task manager.
- `agent/engine/pattern_matcher.py`: Rule-based memory gatekeeper.

## 2. Shared Constraints (Reference: SHARED_CONSTRAINTS.md)
- **C1: Fire-and-Forget**: Persistence MUST NOT block the user-facing response.
- **C2: LLM Proposal Only**: LLM can suggest memory save, but System pattern-match triggers the actual write.
- **C3: Hidden State**: Updates to Study Plan or Progress must happen silently via the System, not via user-visible LLM tools.

## 3. Implementation Steps
1. **Background Orchestrator**: Set up the async queue for post-response tasks.
2. **Rule Migration**: Move `MemoryEvaluator` logic into a declarative pattern-matching system.
3. **State Integration**: Connect "Internal Changes" (Study Plan updates) to the background queue.
4. **Audit Logger**: Implement silent history tracking for all system-touches.

## 4. Success Criteria
- Zero latency added by memory writes or state updates.
- Interaction patterns correctly trigger memory/state changes without LLM "gatekeeping."
- The system log shows a complete audit trail of "Hidden" actions per user request.
