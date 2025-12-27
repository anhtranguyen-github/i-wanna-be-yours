# Master Operational Planner: Activity & Item Detail Suite

## Overview
This Master Planner synchronizes the implementation of **Activity Life-cycle Tracking** with the rollout of **High-Fidelity Detail Pages** for Quoot, Practice, and Flashcards. It ensures consistent logic for guest access, data fetching, and navigation across all modules.

## 🔗 Integrated Plan Registry
1. **Quoot Deck Details**: [quoot_details_plan.md](./quoot_details_plan.md)
2. **Practice Set Details**: [practice_details_plan.md](./practice_details_plan.md)
3. **Flashcard Deck Details**: [flashcards_details_plan.md](./flashcards_details_plan.md)
4. **Activity Log Enhancement**: [activity_log_enhancement_plan.md](./activity_log_enhancement_plan.md)

---

## 🛠️ Conflict Audit & Alignment Rules

### 1. Navigation Flow Logic
*   **Conflict**: Detail plans suggest `/details/[id]`, while activity hubs currenty link direct to session.
*   **Resolution**: 
    1.  Activity Hub (e.g., `/quoot`) -> **Lobby** (`/quoot/details/[id]`).
    2.  Lobby -> **Session** (`/quoot/session/[id]` or existing dynamic route).
    3.  Activity Log entries should now link to the **Lobby** (Details) page instead of the Hub or Session directly.

### 2. Activity Tracking Hooks
*   **Conflict**: Where to trigger the `STARTED` event?
*   **Resolution**: 
    *   **Lobby (Preview)**: Does NOT trigger a `STARTED` record. It tracks "Viewed" if needed (optional).
    *   **Session Entry**: The `STARTED` record is dispatched the moment the user clicks "PLAY/DO/REVIEW" on the Lobby page and the session component mounts.
    *   **Completion**: Dispatched on the results screen.

### 3. Guest Access Strategy (Unified)
*   **Conflict**: Different plans mention guest gates differently.
*   **Resolution**:
    *   **Lobby Access**: Open to guests. Show "Mock Stats" and a blurred activity feed with a Login CTA.
    *   **Session Entry**: Open to guests (Demo mode), but show a "Progress won't be saved" toast.
    *   **Activity/History Log**: CLOSED to guests. Clicking "History" in Hubs or Lobbies must trigger `openAuth('LOGIN')` instead of opening the `HistoryModal`.

### 4. Data Synchronization
*   **Rule**: The Lobby pages and the History records must share the same `itemId` and `itemType` identifiers to ensure the "Personal Best" on the Lobby matches the History Log data.

---

## 📈 Phased Implementation Roadmap

### Phase 0: Infrastructure (The Foundation)
- [ ] **Backend**: Update `SessionRecord` model to support `STARTED` status and `duration`.
- [ ] **Frontend**: Update `recordService.ts` for lifecycle tracking and UUID session correlation.

### Phase 1: High-Speed Impact (Quoot)
- [ ] Implement `/quoot/details/[deckId]` (Arcade Theme).
- [ ] Refactor `/quoot` Hub to link to Details.
- [ ] Integrate Lifecycle Tracking (`STARTED`, `COMPLETED`, `ABANDONED`) into Quoot Game.
- [ ] Fix Guest Gate for History in Quoot Hub.

### Phase 2: Structural Depth (Practice)
- [ ] Implement `/practice/details/[setId]` (Laboratory Theme).
- [ ] Integrate Lifecycle Tracking into Practice Protocols.
- [ ] Fix Guest Gate for History in Practice Hub.

### Phase 3: Systematic SRS (Flashcards)
- [ ] Implement `/flashcards/details/[deckId]` (Zen Theme).
- [ ] Refactor existing `/flashcards/details` (session) to a dedicated `/session` route or integrate into `study`.
- [ ] Integrate Lifecycle Tracking into Flashcard Study.
- [ ] Fix Guest Gate for History in Flashcards Hub.

### Phase 4: Unified Registry (History UI)
- [ ] Upgrade `HistoryPanel.tsx` to display live durations and status badges.
- [ ] Final visual QA for cross-module consistency.

---

## 🔍 Audit Checklist (Post-Implementation)
- [ ] Does clicking 1 item go to details first? (Yes)
* [ ] Does a guest see a login form when clicking History? (Yes)
* [ ] Are "Start", "Finish", "Leave" correctly tracked in DB? (Yes)
* [ ] Does the Lobby UI match the assigned theme (Arcade/Lab/Zen)? (Yes)
* [ ] Is the ID shareable and copyable across all three? (Yes)
