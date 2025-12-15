# Flashcard Modernization & UI/UX Fix Plan

## 1. Overview
This plan addresses critical usability issues in the current Flashcard system including broken layouts ("reserved words"), inability to flip cards, lack of edit functionality, and poor routing URL structure. It also outlines the implementation of Spaced Repetition (SRS) tracking and integration with the Adaptive Study Plan.

---

## 2. Immediate Fixes & Architecture Refactor

### Phase 1: URL & Routing Restructure
**Objective:** Switch from dynamic path routing (`details/[id]`) to cleaner query parameter routing (`details?id=...`).

1.  **Move File Structure**:
    *   Move `src/app/flashcards/details/[id]/page.tsx` → `src/app/flashcards/details/page.tsx`.
2.  **Update Component Logic**:
    *   Replace `useParams()` with `useSearchParams()` to retrieve the `id` from the query string.
3.  **Update Navigation**:
    *   Refactor `src/app/flashcards/page.tsx` (Menu) to generate links as `/flashcards/details?id=vocab-essential-verbs-1`.

### Phase 2: UI/UX & Interaction Fixes
**Objective:** Resolve "Can't flip", "reversed content", and general readability issues.

1.  **Fix Content Mapping (`mapDeckToQuestions`)**:
    *   **Front (Challenge)**: display `vocabulary_original` (Kanji/Word).
    *   **Back (Answer)**: display `vocabulary_simplified` (Reading), `vocabulary_english` (Meaning), and `sentences`.
    *   *Correction*: Ensure the frontend mapping logic strictly prioritizes these fields.
2.  **Fix 3D Flip Animation**:
    *   Add explicit CSS classes for `perspective`, `transform-style: preserve-3d`, and `backface-visibility: hidden` to ensure consistent flipping behavior across browsers.
3.  **Data Integrity & Fallbacks**:
    *   Ensure `SentenceSection` checks `extra_data.sentence_obj` first, then falls back to `extra_data.example_sentence`.
    *   Implement a clean "No example available" state instead of rendering empty/broken UI blocks.

---

## 3. New Features

### Phase 3: Edit Term Functionality
**Objective:** Allow users to fix typos or customize card content on the fly.

1.  **Frontend**:
    *   Add an **Edit (Pencil)** button to the Back of the card.
    *   Create an `EditCardModal` form to modify:
        *   Front (Word)
        *   Reading
        *   Meaning
        *   Example
2.  **Backend**:
    *   Update `POST /f-api/v1/flashcard` in `flashcards.py`.
    *   Allow it to update content fields (`vocabulary_english`, etc.) in addition to the existing `difficulty` field.

### Phase 4: Study Mode, SRS & Progress Tracking
**Objective:** Implement "Study Mode" logic and link activity to the user's Study Plan.

1.  **Study Queue Logic**:
    *   In **Study Mode**, filter the deck:
        *   Exclude `difficulty: 'easy'` (or show infrequently).
        *   Prioritize `difficulty: 'hard'` and unreviewed cards.
2.  **Progress Tracking**:
    *   Add a visual progress bar (New / Learning / Mastered).
3.  **Adaptive Plan Integration**:
    *   **Trigger**: On finishing a review session (e.g., 10 cards).
    *   **Action**: Call a new/existing endpoint to log activity.
    *   **Backend**: Update the `StudyPlanModule` to mark daily tasks as completed based on this flashcard activity.

---

## 4. Implementation Application Order
1.  **Routing**: Fix the URL structure immediately.
2.  **Visuals**: Fix the CSS flip and content mapping so the app is usable.
3.  **Edit Feature**: Enable data correction.
4.  **SRS/Progress**: Implement the sophisticated tracking logic.
