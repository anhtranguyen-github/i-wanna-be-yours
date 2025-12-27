# Plan: Fix Study Dashboard Layout & Logic

## Objective
Address the visual gap between the Study Dashboard header and the top of the viewport, and prevent irrelevant "Ready to Blast Off" popups for users who already have an active study plan.

## Proposed Changes

### Phase 1: Header UI Polish
- **Target File**: `src/components/study-plan/StudyPlanDashboard.tsx`
- **Action**: Change the sticky header class from `top-16` to `top-0`.
- **Action**: Update `z-inner` index from `z-20` to `z-50` to ensure it stays above other content.
- **Action**: Add `pt-0` to the main container to ensure absolute alignment.
- **Rationale**: Currently, `top-16` reserves 64px for a navigation bar that doesn't exist in this layout, creating a visual disconnect.

### Phase 2: Dashboard Logic Refinement
- **Target File**: `src/components/study-plan/StudyPlanDashboard.tsx`
- **Action**: Update the initialization `useEffect` to check the `plan` state before triggering the `PlanCheckoutModal`.
- **Action**: Implementation logic:
  - If `plan` is non-null (active plan exists), clear any `pending_study_plan_setup` from `localStorage`.
  - Ensure `showCheckout` is disabled if a plan is already loaded.
- **Rationale**: Prevents users from seeing "Start Plan" prompts when they are already viewing their active dashboard.

### Phase 3: Route Synchronization
- **Target File**: `src/components/study-plan/StudyPlanDashboard.tsx`
- **Action**: Update the "Settings" link `href` from `/study-plan/settings` to `/settings/study`.
- **Rationale**: Integrates the Dashboard with the newly created global Study Settings hub.

## Checklist

- [ ] **Phase 1: Header Fixes**
    - [ ] Change `top-16` to `top-0` in `StudyPlanDashboard.tsx`.
    - [ ] Update `z-20` to `z-50`.
- [ ] **Phase 2: Logic Fixes**
    - [ ] Refine `useEffect` to prevent popups for existing plans.
    - [ ] Clear stale `localStorage` data for active users.
- [ ] **Phase 3: Integration**
    - [ ] Update Settings link path.
- [ ] **Phase 4: Validation**
    - [ ] Run `npm run build` to ensure type safety and successful compilation.
