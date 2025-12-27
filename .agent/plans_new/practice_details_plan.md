# Plan: Practice Set Detail Implementation

## Objective
Enhance the Practice module with a "Session Blueprint" page. Instead of jumping straight into drills, users will see a technical breakdown of the practice set, their current mastery, and specific grammar/vocab focus areas.

## Aesthetics & Design
- **Theme**: "Neural Laboratory" - Professional, clean, clinical whites/blues, grid patterns, and technical data visualizations.
- **Guest Experience**: Preview of exercises, general difficulty metadata, prompt to save progress.
- **User Experience**: Mastery level indicators per item, historical success percentage, last attempted timestamp, and edit capabilities for custom sets.

## Route Structure
- **New Path**: `/practice/details/[setId]/page.tsx`
- **Updated Hub**: `/practice/page.tsx` links to this page.
- **Session**: `/practice/session/[nodeId]/page.tsx` (Triggered from details).

## Feature Set
1. **Mastery Dashboard**:
    - Progress bar showing % completion/mastery.
    - Difficulty profile (JLPT N-level distribution).
2. **Item Syllabus**:
    - Detailed list of kanji/vocab/grammar points included.
    - Mini-charts for individual item "strength" (for users).
3. **Record Registry**:
    - Timeline of previous attempts.
    - Detailed performance logs (time taken, errors made).
4. **Operations Matrix**:
    - **COMMENCE PRACTICE**: Primary blue "Scientific" button.
    - **CALIBRATE**: (Edit) for owners.
    - **EXPORT/SHARE**: Copy ID for shared learning.

## Checklist
- [ ] **Phase 1: Foundation**
    - [ ] Define the `PracticeSetDetail` interface.
    - [ ] Create folder `/src/app/practice/details/[setId]`.
    - [ ] Update `practiceService` to fetch set stats and records.
- [ ] **Phase 2: Data Visualizations**
    - [ ] Implement Mastery radial/bar charts.
    - [ ] Build the "Syllabus" list component.
- [ ] **Phase 3: History & Social**
    - [ ] Create the "Attempt Logs" timeline.
    - [ ] Implement ID Copying functionality with technical UI feedback.
- [ ] **Phase 4: Permission Matrix**
    - [ ] Secure Edit button behind ownership check.
    - [ ] Implement Guest vs. User data scoping (show mock stats for guests to tease features).
- [ ] **Phase 5: Refinement**
    - [ ] Full responsive audit (Mobile/Tablet/Desktop).
    - [ ] Build verification.
