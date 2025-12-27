# Plan: Activity Log Fix & Enhancement

## Objective
1. **Fix Illogical UI**: Prevent guests from seeing a broken Activity Log modal and a Login form simultaneously.
2. **Implement Full Tracking**: Expand the Activity Log to track the entire lifecycle of a session (Start, Finish, Abandonment).

---

## Phase 1: Guest UI logic Fix
### 1.1 Update `HistoryModal` Guest Gate
- **Problem**: `HistoryModal` currently attempts to fetch data regardless of auth status, triggering a global session-expired/login prompt while the modal is still open.
- **Solution**: 
    - Modify `HistoryModal.tsx` to check the `user` status from `useUser`.
    - If a guest is detected, display a high-fidelity "Guest Gate" inside the modal (similar to `InformativeLoginCard`) with a "Sign In" button.
    - Alternatively, in the trigger buttons (e.g., in `quoot/page.tsx`), wrap the `setIsHistoryOpen(true)` call with a user check. If no user, call `openAuth()` instead of opening the modal.
- **Decision**: We will implement the check in the **trigger buttons** across `quoot`, `practice`, and `flashcards` pages to prevent the modal from even opening for guests. Instead, we will show the `openAuth` modal with the appropriate `flowType`.

---

## Phase 2: Activity Log Tracking (Full Lifecycle)
### 2.1 Backend Schema Update
- **Target**: `backend/express/models/SessionRecord.js`
- **Actions**:
    - Update `status` enum to include `'STARTED'`.
    - Add `duration` (Number) field to track time spent.
    - Add `sessionId` (String/UUID) to link many events to one single attempt.
    - Ensure `itemId` can handle both `ObjectId` and generic strings if necessary (though current `ObjectId` is safer).

### 2.2 Frontend Service Update
- **Target**: `frontend-next/src/services/recordService.ts`
- **Actions**:
    - Update `RecordPayload` interface to support the new status and sessionId.
    - Add a `startSession` helper that generates a temporary UUID and sends the `STARTED` record.

### 2.3 Integration in Activity Sessions
- **Quoot**: 
    - Send `STARTED` when the game mounts.
    - Send `COMPLETED` on result screen.
    - Send `ABANDONED` if the user leaves the page before finishing (using `useEffect` cleanup or `beforeunload`).
- **Practice**: 
    - Send `STARTED` when starting a protocol.
    - Send `COMPLETED` on result.
- **Flashcards**:
    - Send `STARTED` when entering study mode.
    - Send `COMPLETED` when the queue is finished.

---

## Phase 3: UI Enhancement
### 3.1 Update History Panel Display
- **Target**: `HistoryPanel.tsx`
- **Actions**:
    - Differentiate between "In Progress" (Started) and "Finished" records.
    - Show duration for completed sessions.
    - Style `STARTED` items with a "Current" or "Active" badge if they are very recent.

---

## Checklist
- [ ] **Phase 1: Guest UI Fix**
    - [ ] Update `quoot/page.tsx` history trigger.
    - [ ] Update `practice/page.tsx` history trigger.
    - [ ] Update `flashcards/page.tsx` history trigger.
- [ ] **Phase 2: Backend Infrastructure**
    - [ ] Update `SessionRecord.js` model.
    - [ ] Test API endpoint with new status.
- [ ] **Phase 3: Frontend Capability**
    - [ ] Update `recordService.ts`.
    - [ ] Implement Session correlation (UUID generation).
- [ ] **Phase 4: Feature Integration**
    - [ ] Integrate into Quoot Game loop.
    - [ ] Integrate into Practice session loop.
    - [ ] Integrate into Flashcard study loop.
- [ ] **Phase 5: Verification**
    - [ ] Verify guests now only see the Login Modal.
    - [ ] Verify Activity Log shows the full progression of sessions.
