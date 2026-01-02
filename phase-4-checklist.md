# Phase 4 Checklist: Async Optimization

## Tasks
- [✅] Implement `summarize_conversation_task` in `backend/hanachan/tasks/summarization.py`. ✅
- [✅] Update `AgentService.stream_agent` to enqueue the summarization task after streaming completes. ✅
- [✅] Implement logic to only trigger summarization when history exceeds a certain threshold (e.g., 5-10 messages). ✅
- [✅] Test the full async loop (mocking the RQ worker or running it). ✅
- [✅] Verify the database is updated with the summary after a task run. ✅

## Verification
- [✅] All relevant tests executed
- [✅] All tests passed
- [✅] No known regressions remain
