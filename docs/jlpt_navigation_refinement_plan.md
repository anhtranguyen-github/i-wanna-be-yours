# JLPT Question Navigation Refinement Plan

**Objective:** Enhance the JLPT exam session UI by making the question navigation panel sticky and scroll-aware.

---

## 1. Sticky Positioning
### Goal
The navigation panel (sidebar) should remain visible at all times while the user scrolls through long lists of questions (Scroll Mode).

### Implementation Plan
- **CSS Strategy:** Use `position: sticky` on the sidebar container.
- **Top Offset:** Define a `top` value (e.g., `top-24`) to account for the application header.
- **Max Height:** Set `max-height: calc(100vh - offset)` and `overflow-y: auto` to ensure the sidebar itself is scrollable if there are many questions (e.g., 100+).

---

## 2. Smooth Navigation (Panel Click)
### Goal
Clicking a question number in the panel should smoothly scroll the viewport to that specific question.

### Implementation Plan
- **Question Identifiers:** Ensure each question element in the main list has a unique ID (e.g., `id="question-{index}"`).
- **Scroll Logic:**
  - Calculate the target element's position relative to the scroll container.
  - Apply an offset (e.g., 100px) to prevent the question from being hidden under the sticky header.
  - Use `window.scrollTo` or `element.scrollTo` with `behavior: "smooth"`.
- **Container Detection:** Implement a helper to detect if the scrollable area is the `window` or a specific internal `div` (depending on the AppShell layout).

---

## 3. Scroll-Aware Highlighting (Active State)
### Goal
As the user scrolls the page manually, the navigation panel should automatically highlight the question currently most visible in the viewport.

### Implementation Plan
- **Event Listener:** Attach a scroll listener to the detected scroll container.
- **Threshold Detection:**
  - Map all question elements to their `offsetTop` values.
  - On scroll, compare the current `scrollTop` (plus a buffer threshold) against the question positions.
  - Identify the index of the question that has passed the threshold but whose successor hasn't.
- **State Update:** Update the `currentIndex` state to reflect the "active" question, which triggers the UI highlight in the sidebar.
- **Performance:** Use `requestAnimationFrame` or a slight debounce if necessary, though scroll listeners are generally performant for simple index calculations.

---

## 4. Visual Selection State
### Goal
Ensure a clear visual distinction for the active question in the sidebar.

### Implementation Plan
- **Conditional Styling:** Use class switching (e.g., `bg-brand-blue text-white` vs `bg-slate-50`) based on the `currentIndex`.
- **Indicators:** Add a subtle border or dot indicator to the active question bubble.

---

## 5. Technical Requirements
- **Hooks:** Use `useEffect` for event listener management (on/off).
- **Refs:** Use `useRef` to track the scroll container and avoid re-renders during scroll calculations.
- **Context:** Ensure the logic respects the `displayMode` (only active in `SCROLL` mode, not `FOCUS` mode).
