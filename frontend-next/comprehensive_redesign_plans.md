# Hanabira Comprehensive Redesign Plans

## 1. Dictionary Welcome Page (The Discovery Hub)
Transform the empty `/dictionary` state into a high-engagement gateway.

### Phases
1. **Discovery Scaffolding:** Implement trending search data hooks.
2. **Visual Synthesis:** Design the "Discovery Grid" with Midnight Sakura aesthetics.
3. **Motion Design:** Add entrance animations for suggested modules.

### Guest & Auth Logic
- **Guest Access:** All trending content and core search features are unlocked.
- **Progressive Auth:** "Save to Notebook" triggers Informative Login.
- **Informative Login:** Preview of a personal Kanji deck: *"Build your vocabulary library. Master the nuances of N1-N5 with saved notes."*

---

## 2. Unified Search & Filter System (The Search Nexus)
A reusable component to standardize navigation across Quoot, Flashcards, and Practice.

### Phases
1. **Parameter Audit:** Map all tags (JLPT, Skill, Mode) across modules.
2. **Component Engineering:** Build the `SearchNexus` with a unified API.
3. **Adaptive UI:** Implement page-specific layout variants (Grid vs List).

### Guest & Auth Logic
- **Content Separation:** Segmented control toggling [Public] vs [Personal].
- **Informative Login:** Shown when a guest clicks "Personal": *"Sync your decks. Study across any device and never lose your streak."*

---

## 3. Unified Results Architecture (The Victory Suite)
A standardized, component-driven system for celebrations and analysis across Practice, Quoot, and Exams.

### Phases
1. **Atomic Result Components:** Breakdown the Result UI into reusable atoms (ScoreIndicator, StatCard, BreakdownBar, ActionGroup).
2. **The `UnifiedResultView` Template:** Create a configurable container that accepts a `resultData` profile.
3. **Synthesis & Porting:** Standardize Practice and Quoot to consume the new component system.

### Reusable Component Specs
- **Configurable, Not Duplicated:** One `ResultShell` component. Content is injected via a standardized configuration object (e.g., `primaryScore`, `secondaryStats`, `performanceInsights`).
- **Dynamic Content Slots:** Slots for page-specific actions (e.g., "Review Mistakes" for Practice vs "Global Leaderboard" for Quoot).
- **Interactive State Consistency:** Shared animations for success/failure triggers, loading skeletons, and interactive stat cards.

### Guest & Auth Logic
- **Guest Access:** Full access to session analysis.
- **Informative Login:** Promoted in "History" or "Leaderboard" slots: *"Claim your placement. Log in to permanently record this score and see how you rank against other Hanabira students."*

---

## 4. Chat UI Redesign (Hanachan's Room)
Refine the AI interface into a premium, character-driven experience.

### Phases
1. **Atmosphere Design:** Implement Sakura ambient effects and character state UI.
2. **Interactive Polish:** Chat bubbles with spring physics and sentiment-aware avatars.
3. **Artifact Optimization:** Streamlined sidebar for generated notes/quizzes.

### Guest & Auth Logic
- **Guest Access:** Basic conversations and generic study tips.
- **Informative Login:** Promoted when Hanachan offers personalized tutoring: *"I can tailor my teaching to your exact level if we link your account!"*

---

## 🛠️ System Standards (Global)

### Reusable UI Components
- **Maximize Reuse:** All UI elements (Buttons, Cards, Modals) must reside in `@/components/ui` and be shared project-wide. 
- **Design System Alignment:** Every component must strictly follow the defined tokens for spacing, typography, and "Midnight Sakura" color palettes.
- **Scalable Props:** Design for the future. Use optional props and slots instead of creating specific "PageX_Component" variations.

### Guest-to-User Journey
- **Progressive Auth:** Authentication is requested at the "Moment of Value" (Saving, Syncing, Advanced Analysis).
- **Informative Login Experience:** Plain modals are prohibited. All auth prompts must include value-adding visual previews of personal features.

## ✅ Design Checklist
- [ ] **UX:** Guest access by default; login requested only at "Point of Interest."
- [ ] **UI:** Consistent Midnight Sakura theme (Glassmorphism, deep gradients).
- [ ] **Interaction:** High-performance animations (60fps target).
- [ ] **Accessibility:** AA contrast standards; clear screen-reader labels.
- [ ] **Consistency:** Unified icon set (Lucide) and tag color scheme.

## 🧪 Testing & Validation
- **Component Integrity:** Verify that a change to a shared `ResultCard` propagates correctly to both Practice and Quoot.
- **Usability:** AB Test "Informative Login" vs "Plain Modal."
- **Edge Cases:** Handle various result types (e.g., a "Pass/Fail" only result vs a detailed "Score Breakdown" result).
- **Metric:** Track "Time to Personalize" for new guest sessions.
