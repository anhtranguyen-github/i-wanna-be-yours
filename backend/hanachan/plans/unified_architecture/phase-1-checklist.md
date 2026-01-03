# Phase 1 Checklist: Declarative Foundation

## Status
- ⬜ Not started
- 🟡 In progress
- ✅ Completed

## Tasks
- ✅ Create `backend/hanachan/config/manifest.yaml`
- ✅ Create `backend/hanachan/config/policy.yaml`
- ✅ Create `backend/hanachan/schemas/manifest_policy.py` (Pydantic models)
- ✅ Create `backend/hanachan/agent/engine/loader.py`
- ✅ Implement `backend/hanachan/agent/engine/policy_engine.py` (Evaluating ToolProposals)
- ✅ Migrate `backend/hanachan/agent/core_agent.py` to use `PolicyEngine`
- ✅ Seed Database for Real-World Validation (No mocks)
- ✅ Run Coordinated Test Flows (Intent -> Tool -> Policy)
- ✅ Fix all test failures
- ✅ Generate Phase 1 Report

## Verification
- ✅ All tests executed
- ✅ All tests passed
- ✅ No known regressions
