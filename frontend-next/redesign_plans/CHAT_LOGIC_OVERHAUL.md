# Chat Interface Overhaul Plan (Production Grade + Legacy Strictness)

## Core Objective
Deliver a robust, zero-flicker Chat Experience by establishing **SWR as the Single Source of Truth**. Logic is extracted into specialized hooks, error handling is rigorous, and data persistence is guaranteed.

## Legacy Data Policy
**Strict Rule**: Do not attempt to process or migrate legacy data structures in the frontend. If data schema does not match current expectations (e.g. missing fields, old message types), simply `try/catch` the rendering logic and throw a general error (or return null) to avoid crashing the whole UI. Clean up legacy data in the database if it becomes an issue.

## Step 1: Fix Data Layer (`useConversation.ts`)
**Problem**: Current hook is read-only. UI has to manually merge state.
**Action**:
-   **API**: Return `mutateMessages(newMsgs, { revalidate: false })`.
-   **Optimistic UI**: Implement logic to append a "pending" message instantly to the SWR cache.
-   **Error Handling**: Rollback changes if potential server update fails.

## Step 2: Specialized Hooks (Separation of Concerns)

### A. `useIngestionStatus.ts` (RESOURCES)
**Replaces**: Manual `setInterval` polling in `ChatMainArea`.
**Features**:
-   **Smart Polling**: Uses `refreshInterval`. Backs off when tab is hidden, accelerates when focused. Stops when all files processed.
-   **Batching**: Checks all pending files in one go (or parallel requests handled by SWR).
-   **Resilience**: Handles network errors without crashing the main UI.

### B. `useChatComposer.ts` (INPUT)
**Replaces**: 100+ lines of input handling in `ChatMainArea`.
**Features**:
-   **Draft Saving**: auto-saves input to `localStorage`.
-   **Upload Queue**: Manages file uploads with progress tracking.
-   **Validation**: Enforces file size/type limits with clear error toasts.
-   **Notification**: Uses `useNotification` for standardized feedback.

### C. `useChatStream.ts` (STREAMING)
**Refinement**:
-   **Retry Logic**: If stream fails mid-way, allow "Retry" action.
-   **Cache Commit**: On stream complete, authoritative Write to SWR cache.

## Step 3: View Layer Overhaul (`ChatMainArea.tsx`)
**Problem**: Monolith with duplicate state & side-effects.
**Action**:
-   **Purge**: Remove `useState<ChatMessage[]>` and `useEffect` sync.
-   **Render**: Derive `displayMessages` directly from `conversation?.messages || []`.
-   **Streaming**: Overlay the *active chunk* from `useChatStream` at the end of the list.
-   **Safety**: Wrap render map in `try/catch` to handle legacy/malformed messages safely.

## Step 4: Side Panel Integration
**Artifacts**:
-   Ensure `mutateArtifacts` is triggered *after* stream completes.
**Resources**:
-   Link uploaded resource IDs to the message payload reliably.

## Execution Sequence
1.  **Refactor Hooks**: `useConversation` (Done), `useChatComposer` (Done), `useIngestionStatus` (Done).
2.  **Refactor component**: `ChatMainArea.tsx`.
3.  **Verify**: Upload file -> Send Message -> Refresh Page. Data must be consistent.
