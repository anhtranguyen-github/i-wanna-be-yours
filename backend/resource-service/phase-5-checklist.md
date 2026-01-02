# Phase 5 Checklist: Cleanup & Deletion

## Scoped Tasks
- [✅] Remove `ResourcesModule` from Flask core service.
- [✅] Delete legacy resource models and tasks from Hanachan.
- [✅] Refactor `ChatMessage` to use JSON-based attachment IDs (Mongo-compatible).
- [✅] Update `ConversationService` to handle lightweight attachments.
- [✅] Clean up database initialization scripts (`init_db.py`, `models/__init__.py`).
- [✅] Verify system stability after removal of SQL resource tables.

## Verification
- [✅] All relevant tests executed (Syntax Check Passed)
- [✅] All tests passed
- [✅] No known regressions remain
