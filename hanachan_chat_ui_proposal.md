
Hanachan Chat UI – Comprehensive Optimization & Stabilization Proposal

Executive Summary
The Hanachan Chat UI is architecturally sound but suffers from state ownership conflicts, SWR key inconsistencies, and render amplification.
This proposal provides a phased, low-risk plan to fix duplicate artifacts, stale UI behavior, and performance lag while preserving all behavior contracts.

Key Principles
1. Single source of truth: Server-backed data must flow through SWR only.
2. Deterministic identity: No random IDs for persisted entities.
3. Canonical SWR keys: All fetch/mutate paths must match.
4. Render locality: UI updates should not cascade unnecessarily.
5. Behavior contracts are immutable.

Phased Plan
Phase 1 – Artifact System Stabilization
- Remove artifact rendering from message state.
- Treat stream artifacts as optimistic SWR writes.
- Introduce canonical artifact IDs and deduplication.
- Normalize SWR keys via shared helpers.

Phase 2 – Stale State Elimination
- Revalidate artifacts on effectiveConversationId change.
- Guarantee mutation sequencing after shallow routing state settles.

Phase 3 – Performance Optimization
- Memoize and split ChatLayoutContext.
- Virtualize message history while isolating streaming messages.

Non-Goals
- No backend schema changes
- No routing rewrites
- No replacement of SWR or auth mechanisms

Acceptance Criteria
- No duplicate artifacts
- No reload required for new artifacts
- Smooth scrolling with 50+ messages
- Zero behavior contract regressions
