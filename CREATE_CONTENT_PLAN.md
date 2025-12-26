# Implementation Plan: Custom Content Creator (Structured Manual Entry)

This plan outlines the steps to enhance the `CreateContentPanel` with a structured manual entry system for Quoot, Flashcards, and Practice modules.

## Phase 1: Interactive Form UI
1.  **Modify `CreateContentPanel.tsx`**:
    *   Introduce `itemsList` state to track manually added items.
    *   Create a sub-component or conditional section `StructuredForm` that renders based on the `type` prop.
    *   Implement "Item History" view within the manual tab so users can see what they've added before finalizing.

2.  **Activity-Specific Schema**:
    *   **Quoot/Cards**: Fields for `front`, `back`, `reading`.
    *   **Practice**: Fields for `question`, `options` (dynamic list), `correctIndex`, `explanation`.

## Phase 2: Service & API Synchronization
1.  **Quoot Service**: Ensure `createQuootDeck` correctly maps structured items to `QuootCard` schema.
2.  **Flashcard Service**: Ensure `createFlashcardDeck` correctly maps structured items to `Flashcard` schema (including optional `mnemonic`).
3.  **Practice Service**: Ensure `createNode` accurately transforms structured question objects into the `PracticeNode` question format.

## Phase 3: Backend Route Hardening
1.  **Express Routes**: 
    *   Update `backend/express/routes/practiceRoutes.js` (if needed) to handle the incoming JSON structure for custom nodes.
    *   Validate that `quootRoutes.js` and `flashcardRoutes.js` properly save items passed from the frontend.

## Phase 4: Validation & UX
1.  Add validation to the interactive forms (e.g., "Must have at least 2 options for Practice").
2.  Add a "Quick Add" capability (Pressing Enter in the last field adds the item).
3.  Implement "Clone to Another Type" (Optional, if easy).

## Success Criteria
*   Users can manually add individual items to a new Quoot deck without writing JSON or text blobs.
*   Users can define multi-choice questions for Practice protocols with dedicated fields for options and explanations.
*   The "Preview" accurately reflects the manually created items.
