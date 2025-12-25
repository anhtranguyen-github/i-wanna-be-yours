# Plan 3: Unified Results Architecture (The Victory Suite)

A standardized, component-driven system for celebrations and skill analysis, maximizing code reuse across Practice, Quoot, and Exams.

## 🚀 Phases
1. **Atomic Reconstruction:** Build reusable atoms: `ScoreLantern`, `StatCard`, `AnalysisBlock`, and `ActionGroup`.
2. **Unified Controller:** Create a `ResultProcessor` that maps raw session data (from either Practice or Quoot) into a standard `ResultConfig`.
3. **Synthesis:** Replace ad-hoc result pages with the unified `ResultShell` component.

## ✅ Design Checklist
### UI & System
- [ ] **Configurable Layout:** Toggle sections (e.g., show/hide Leaderboard) based on the current page.
- [ ] **Liquid Lantern Indicator:** Shared "Japanese Lantern" component that fills based on the accuracy percentage.
- [ ] **State Consistency:** Shared loading skeletons and "No Data" fallbacks.

### UX & Perception
- [ ] **Victory Soundscapes:** Standardized audio feedback for different performance tiers (optional).
- [ ] **Mistake Mapping:** Consistent presentation of incorrect answers with "Ask AI" hooks.

### Scalability
- [ ] **Slot-based Actions:** Custom buttons for specific pages (e.g., "Next Level" for Quoot vs "Retry Segment" for Practice).

## 🔑 Guest & Authentication Logic
- **Guest Access:** Immediate, detailed result analysis remains a core promise for all users.
- **Informative Login:** Locked sections like "Global Rank" or "Learning Curve" show a blurred UI with a "Secure Your Progress" prompt.
- **Visual Preview:** Show a mini-graph of "Mastery Progress" that users unlock upon logging in.

## 🧪 Testing & Validation
- **Visual Regression:** Verify that the `ScoreLantern` renders identically across all result pages.
- **Component Integrity:** Ensure that updating the "Midnight Sakura" theme in the shared `StatCard` propagates to all pages.
- **Success Metric:** 50% reduction in code volume for the results module.
