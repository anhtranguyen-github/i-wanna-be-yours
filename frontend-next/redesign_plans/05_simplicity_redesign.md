# Plan 5: Simplicity & Accessibility Redesign

The objective of this plan was to simplify the UI across high-traffic learning modules (`/game`, `/practice`, `/quoot`) to align with the minimalist aesthetic found in `/tools` and `/library`. The focus was on readability, reducing visual noise, and standardizing navigation. This redesign has been fully implemented and verified.

## Core Requirements (Completed)

1. **Plain UI Style**:
   - No shadows across search bars and filter components.
   - Minimal visual noise (removed decorative glows/gradients).
   - Solid borders instead of complex glassmorphism effects where appropriate.

2. **Typography**:
   - **Zero Grey Text**: Replaced all `text-neutral-ink/20`, `text-neutral-ink/30`, `text-neutral-ink/40`, `text-muted-foreground`, etc., with solid `text-neutral-ink` (black) or `text-neutral-ink/80` for sub-text, ensuring high contrast.

3. **Global Component Standardization**:
   - **SearchNexus**: Updated to support a "Minimal" mode.
     - Removed Public/Personal segmented control.
     - Removed shadows.
     - Center-alignment support.
   - **Universal "Create" Button**: Added a visible "Create" button to all pages with personal content (Flashcards, Quoot, Practice).
   - **Filter System**: Moved "Public" and "Personal" into the filter tags instead of a top-level switch.

4. **Data Integrity**:
   - **Mock Data Elimination**: Removed all frontend mock data sources (`mockQuoot`, `mockPractice`) and replaced them with live API calls to the seeded database.
   - **Access Control**: Correctly implemented filtering based on 'PUBLIC' and 'PERSONAL' access tags across all hubs.

## Phases (Completed)

### Phase 1: Global UI Cleanup (Typography & Components) ✅
- [x] Update `SearchNexus.tsx` to support a `variant="minimal"` and `center={true}` prop.
- [x] Replace grey text classes in global/shared components with black variations.
- [x] Implement a standardized `CreateButton` component.
- [x] Add "Access" filter group to global filter types (Public vs Personal).

### Phase 2: Dictionary Page Refactor ✅
- [x] Adjust `/dictionary` layout to center `SearchNexus` when query is empty.
- [x] Hide filters and switches in `/dictionary` SearchNexus.
- [x] Update card styles to remove shadows and fix typography.

### Phase 3: Game Hub & Quoot Refactor ✅
- [x] Highlight "Game" section in `Sidebar.tsx`.
- [x] Remove public/personal switches in `/quoot` and `/game`.
- [x] Add "Personal" and "Public" as tags in the filter system for these pages.
- [x] Add "Create New Deck" / "Create New Game" buttons.

### Phase 4: Practice & Library Alignment ✅
- [x] Simplify `/practice` and `/flashcards` using the minimalist UI style.
- [x] Add "Create New Plan" / "Create New Deck" buttons.
- [x] Audit and fix all remaining grey text.

### Phase 5: Verification & Data Integration ✅
- [x] Replace all mock data with API calls to seeded database.
- [x] Ensure Public/Private content is correctly handled in frontend filtering.
- [x] Run full build and verify system-wide consistency.

---

## Final Checklist

- [x] SearchNexus Minimal Variant Created
- [x] Grey Text Replaced with Black Across Modules
- [x] Dictionary Search Centered & Simplified
- [x] Quoot Switch Replaced with Tags
- [x] Sidebar "Game" Highlighted
- [x] "Create" Buttons Visible on All Personal Pages
- [x] All Mock Data Removed & Seeded Data Integrated
- [x] Full Build Successful

## Next Steps

1. **Performance Audit**: Monitor API response times for the new live data integration and optimize database queries if necessary.
2. **Advanced Filtering**: Enhance the "Access" filter to support more granular permissions (e.g., Shared with Me, Community Featured).
3. **Rich Results Display**: Improve the rendering of search results for complex items (Kanji details, Grammar patterns) to maintain the minimalist style while providing deeper insights.
4. **Mobile Optimization**: Ensure the new minimalist UI and "Discovery Hub" layouts are fully responsive and touch-friendly.
