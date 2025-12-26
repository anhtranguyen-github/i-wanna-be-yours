# Practice Result Automation & AI Integration Plan

This plan outlines the steps to automate the practice submission flow and create a high-end, AI-powered results experience for Hanabira.

## Phase 1: Automated Submission Flow
**Target**: `src/app/practice/session/[nodeId]/page.tsx`
- [ ] **State Update**: Add `isRedirecting` state to handle the transition UX.
- [ ] **Data Persistence**: Store the current session's answers in `localStorage` momentarily so the result page can render accurate data without a complex state manager.
- [ ] **Auto-Redirect**: Update `handleSubmit` to automatically trigger `router.push('/practice/result/[nodeId]')` after a brief "Submitting..." animation (800ms).

## Phase 2: Premium Results Page Design
**Target**: `src/app/practice/result/[nodeId]/page.tsx`
- [ ] **Visual Theme**: Implement a "Midnight Sakura" theme using glassmorphism, deep gradients, and vibrant accents.
- [ ] **Liquid Score Indicator**: Create a custom circular progress component with a wave/liquid effect to display the accuracy percentage.
- [ ] **Insight Stats**:
    - **Speed**: Words per minute or total time.
    - **Accuracy**: Correct/Incorrect breakdown with icons.
    - **Focus Areas**: Identify strongest and weakest categories (Vocabulary, Grammar, Kanji).
- [ ] **Question Review**: A sleek, scrollable list of questions with "Show Explanation" toggles.

## Phase 3: "Ask with AI" Assistant & Guest Gate
**Target**: `src/app/practice/result/[nodeId]/page.tsx`
- [ ] **AI Assistant UI**: A glowing section at the bottom of the result card featuring "Hanachan AI".
- [ ] **Authentication Gate**: 
    - Use `useUser` hook to check if the user is a guest.
    - If a guest clicks "Explain with AI", trigger `openAuth('LOGIN', context)` with a personalized message: *"Log in to unlock Hanachan's AI coaching and master your mistakes!"*
- [ ] **Contextual AI**: Pass the list of wrong questions to the AI component to provide targeted help.

## Phase 4: Polish & Micro-interactions
- [ ] **Framer Motion**: Add entrance animations for the result cards.
- [ ] **Confetti Effect**: Trigger a subtle sakura petal confetti effect for scores > 80%.
- [ ] **Responsive Optimization**: Ensure the breakdown looks premium on mobile devices.

---
*Plan created by Antigravity AI.*
