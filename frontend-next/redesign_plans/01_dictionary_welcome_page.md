# Plan 1: Dictionary Welcome Page (The Discovery Hub)

Transform the empty `/dictionary` state into a high-engagement gateway that guides users and encourages exploration.

## 🚀 Phases
1. **Discovery Scaffolding:** Implement trending search data hooks and "Word of the Day" logic.
2. **Visual Synthesis:** Design the "Discovery Grid" using the "Midnight Sakura" design system (glassmorphism, vibrant gradients).
3. **Motion Design:** Add subtle entrance animations (staggered fade-ins) for discovery cards.

## ✅ Design Checklist
### UX
- [ ] **Zero-friction Search:** Ensure the search bar is the primary focus.
- [ ] **Curated Paths:** Provide "trending" and "recently searched" suggestions.
- [ ] **Educational Content:** Highlight specific grammar points or kanji families.

### UI & Interaction
- [ ] **Midnight Sakura Theme:** Use deep blues and cherry blossom pinks.
- [ ] **Micro-animations:** Hover effects for cards showing quick definitions.
- [ ] **Responsive Grid:** Layout adapts from 3 columns (desktop) to 1 column (mobile).

### Accessibility
- [ ] **Contrast:** AA standards for kanji text on dark backgrounds.
- [ ] **Aria Labels:** Clear labels for "Search Mode" toggles.

## 🔑 Guest & Authentication Logic
- **Guest Access:** All discovery features and the primary search function are unlocked by default.
- **Progressive Auth:** Users are prompted to log in only when trying to "Save" a word to their notebook.
- **Informative Login:** Show a preview of the "Personal Vocabulary Notebook" to explain the value of an account.

## 🧪 Testing & Validation
- **Usability:** Measure "Time to First Action" (how long before a user interacts with a suggestion).
- **Edge Cases:** Handle empty "trending" states with fallback system defaults.
- **Success Metric:** 30% increase in user interaction with discovery modules compared to the previous empty state.
