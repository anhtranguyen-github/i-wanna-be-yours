# Plan 2: Unified Search & Filter System (The Search Nexus)

Develop a reusable, high-performance component system shared across `/quoot`, `/flashcards`, and `/practice` to maintain consistency and ease of use.

## 🚀 Phases
1. **Parameter Audit:** Map all distinct filter types (JLPT Level, Skill, Category, Origin) into a unified configuration schema.
2. **Component Engineering:** Build the `SearchNexus` component as a flexible, slot-based UI with internal state management.
3. **Adaptive Implementation:** Port the system to all three target pages, ensuring page-specific filters are active.

## ✅ Design Checklist
### UX
- [ ] **Context Awareness:** Automatically select relevant tags based on the current page context.
- [ ] **State Persistence:** Remember filter choices across session navigations.
- [ ] **Search Refinement:** Real-time filtering with debounced input.

### UI & Interaction
- [ ] **Unified Visuals:** Consistent border-radius, shadows, and focus states.
- [ ] **Drawer Animations:** Smooth spring-based expansion for mobile filters.
- [ ] **Tag Archetypes:** Consistent color coding (e.g., N1 is Red, N5 is Green).

### Consistency
- [ ] **Reusable Logic:** Use a shared hook `useSearchFilters` for all implementations.

## 🔑 Guest & Authentication Logic
- **Content Separation:** Segmented controls to switch between **[ Public Library ]** and **[ My Collection ]**.
- **Informative Login:** Guests can view the "My Collection" tab but are met with a visually rich "Personal Cloud" preview instead of an empty list.
- **Login Reassurance:** Clear messaging that browsing public content never requires an account.

## 🧪 Testing & Validation
- **Performance:** Ensure filtering remains smooth with 100+ items (Virtualization where needed).
- **Usability Test:** Confirm users can filter by both "Level" and "Skill" simultaneously without confusion.
- **Success Metric:** Reduced support queries regarding "missing content" due to clearer discovery patterns.
