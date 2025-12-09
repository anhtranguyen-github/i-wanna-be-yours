# Skill Card: Resources Sidebar Design

**Context:** Chatbot Resource Management UI
**Epic:** Frontend Foundation
**Priority:** High
**Status:** Standard

---

## 1. Core Philosophy
> "The Resources Sidebar is the knowledge retrieval center of the application. It must be distinctly organized, searchable in real-time, and seamlessly integrated with the chat context without overwhelming the primary conversation flow."

## 2. Design Requirements

### A. Layout & Structure
*   **Accordion Pattern:**
    *   **Exclusive Expansion:** To maintain a clean UI, use an **exclusive accordion** behavior. Only one major section (e.g., "Chat History" vs. "Resources") should be fully expanded at a time.
    *   **Default State:** "Chat History" is typically the default open state. "Resources" starts collapsed.
    *   **Transitions:** Use smooth CSS transitions for height or max-height change (0.3s ease).
*   **Search Integration:**
    *   **Placement:** The search input must be **inside** the accordion body, pinned to the top, so it is only visible when the Resources section is active.
    *   **Behavior:** Real-time filtering (debounced) as the user types.

### B. Visual Consistency
*   **Styling:** Reuse the same list item classes (`history-item` style) for consistency but add specific identifiers (`resource-item`).
*   **Action Buttons:** Use subtle icon buttons (`info`, `add_circle`) that appear on hover or persist in a muted state to reduce visual noise.

---

## 3. Strict Functional Logic

### A. Backend Integration
*   **Search Endpoint:** Implement a dedicated `GET /resources/search?q=...` endpoint. Do not rely on client-side filtering efficiently if the resource list is large.
*   **Summary Endpoint:** Implement `GET /resources/<id>/summary` to lazy-load content summaries only when requested, saving bandwidth.
*   **Database Schema:** Ensure the `Resource` model supports a `summary` column to avoid runtime errors during fetch.

### B. Frontend Behavior
*   **Duplicate Prevention:**
    *   Before adding a resource to the active "Resource Tray" (staging), check against existing IDs in the local state.
    *   **Feedback:** Provide immediate feedback (e.g., console log or toast) if a user tries to add a duplicate. Do NOT fail silently.
*   **Deferred Persistence:**
    *   **Staging:** Uploaded files are held in a client-side "Tray" state (`isNew: true`) and are **not** sent to the backend immediately.
    *   **Commit:** Context resources are only persisted to the database (and thus the Resources list) when the user sends the associated message.
    *   **UX:** This prevents "orphan" resources if a user uploads a file but then abandons the message.
    *   **Refresh:** The resource list sidebar is refreshed **after** the message send transaction is complete.

## 4. Potential Failed Logics (Anti-Patterns)

### ❌ The "Stale List" Error
*   **Symptom:** User uploads a file, sees it in the "Tray", but it doesn't appear in the "Resources" sidebar list until page reload.
*   **Cause:** Frontend logic failing to re-fetch the resource list after a successful add/upload operation.
*   **Fix:** Ensure the upload callback promise chain includes a list refresh call.

### ❌ The "Missing Column" Crash
*   **Symptom:** Backend 500 Error during search or summary view.
*   **Cause:** Adding new fields (like `summary`) to the SQLAlchemy model without running a database migration or schema update.
*   **Fix:** Always verify DB schema matches the model definition. Use migration scripts if necessary.

### ❌ The "Double-Add" Spam
*   **Symptom:** Clicking "Add" multiple times fills the chat context with identical copies of the same file.
*   **Cause:** Lack of `if (exists)` check in the `addToChat` function.
*   **Fix:** Check `state.resources.find(id)` before pushing to the array.

---

## 5. Implementation Checklist
- [ ] **Accordion:** Exclusive toggle logic implemented in JS.
- [ ] **Search:** Debounced input listener triggering API search.
- [ ] **Refresh:** `handleFiles` calls `searchResources` on success.
- [ ] **Schema:** `summary` column exists in `resources` table.
- [ ] **Duplicates:** `addToChat` logic includes ID check.
