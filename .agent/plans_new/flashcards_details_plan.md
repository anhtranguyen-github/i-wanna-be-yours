# Plan: Flashcard Deck Detail Implementation

## Objective
Introduction of a "Synaptic Entry" page for Flashcard decks. This page replaces the direct jump into study sessions with an elegant deck management and overview interface, allowing users to browse cards, check retention stats, and manage deck settings.

## Aesthetics & Design
- **Theme**: "Zen Registry" - Clean layouts, paper-white backgrounds with subtle textures, elegant typography (Serif for titles), and "Floating" card previews.
- **Guest Experience**: Deck overview, card count, "Preview Cards" mode (limited), login CTA for SRS progress tracking.
- **User Experience**: Personal Spaced Repetition (SRS) stats, "Due Date" forecast, mastery distribution, full collaborative edit access (if owner).

## Route Structure
- **New Detail Page**: `/flashcards/details/[deckId]/page.tsx` (Dynamic route).
- **Study Session**: Moving existing session logic to `/flashcards/study/session` or keeping `/flashcards/study?id=...`.
- **Hub Update**: `/flashcards/page.tsx` will link to the new dynamic detail route.

## Feature Set
1. **Retention Dashboard**:
    - "Retention Rate" percentage.
    - Mastery stages breakdown (New, Learning, Review, Mastered).
    - Next review estimated date.
2. **Library Browser**:
    - List of cards (Front/Back) with a "Peek" search functionality.
    - Quick-toggle for Kanji/Vocab views.
3. **Registry Activity**:
    - Heatmap of study activity for this specific deck.
    - Recent performance trends.
4. **Deck Commands**:
    - **COMMENCE STUDY**: The primary call-to-action.
    - **EDIT REGISTRY**: For deck modifications.
    - **SHARE FREQUENCY**: Copy unique deck ID for others.

## Checklist
- [ ] **Phase 1: Architecture Refactor**
    - [ ] Create folder `/src/app/flashcards/details/[deckId]`.
    - [ ] Plan for migration: existing `details/page.tsx` (session) should be relocated to `/flashcards/session` or integrated into `study`.
    - [ ] Verify `deckService` has full stats-fetching capability.
- [ ] **Phase 2: Visual Interface**
    - [ ] Implement the "Zen Library" layout.
    - [ ] Create sleek Card Preview items for the browser list.
- [ ] **Phase 3: Statistics & SRS**
    - [ ] Implement the SRS stage breakdown visualization.
    - [ ] Add the Activity Heatmap component.
- [ ] **Phase 4: Permission & Sharing**
    - [ ] Implement "Copy Deck ID" with elegant notification.
    - [ ] Conditional UI logic for deck owners vs. students vs. guests.
- [ ] **Phase 5: Performance & Final Touch**
    - [ ] Optimize card list loading (virtualization if needed for large decks).
    - [ ] Full build and UX validation.
