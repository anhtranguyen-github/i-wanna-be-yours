# Plan: Chat Sidebar UI Density Optimization

## Objective
Increase the available vertical space for the "History" and "Resources" lists by condensing the UI components **ONLY when the sidebar is in Chat Mode**. Standard Mode navigation should remain spacious to maintain the application's premium branding.

## Proposed Changes

### Phase 1: Shared Sidebar Shell (Conditional)
- **Target Component**: `CollapsibleSidebar.tsx` (Top area)
- **Actions**:
    - Update the Logo Area height to be dynamic: `isOnChat ? 'h-[64px]' : 'h-[80px]'`.
    - Apply conditional padding to the "New Chat" button area.
- **Rationale**: Reclaims 16px of vertical real estate for the chat interface while keeping the entry points of other sections spacious.

### Phase 2: Chat Mode Action Area
- **Target Component**: `CollapsibleSidebar.tsx` -> `renderChatModeContent()`
- **Actions**:
    - Condense the "New Chat" button (Only in Chat Mode):
        - Reduce padding from `py-4` to `py-2`.
        - Reduce icon size from `24` to `18` (when collapsed) and `18` to `16` (when expanded).
        - Drop text size to `text-[9px]`.
- **Rationale**: The core action in chat mode doesn't needs to be as "tall" as standard nav items.

### Phase 3: Utility & Content Density (Chat Mode Only)
- **Target Component**: `CollapsibleSidebar.tsx` -> `renderChatModeContent()`
- **Actions**:
    - **Section Headers**:
        - Reduce vertical padding from `py-5` to `py-3`.
        - Reduce font size from `text-[10px]` to `text-[9px]`.
        - Reduce icon size from `16` to `14`.
    - **Search Inputs**:
        - Reduce input padding from `py-3` to `py-2`.
        - Reduce icon size from `14` to `12`.
        - Reduce text size to `text-[11px]`.
    - **List Items (History & Resources)**:
        - Reduce History item padding from `p-4` to `p-3`.
        - Reduce Resource item padding from `p-4` to `p-2.5`.
        - Reduce title font size to `text-[13px]`.
- **Constraint**: The `renderStandardModeContent()` function MUST remain unchanged (maintaining `p-4` and `22px` icons).

### Phase 4: Right Sidebar Default State
- **Target Component**: `ChatLayoutContext.tsx`
- **Actions**:
    - Change the initial state of `rightSidebar` from `'minimized'` to `'collapsed'`.
- **Rationale**: Focuses the user on the primary chat flow initially.

### Phase 5: Testing & Alignment
- **Actions**:
    - Verify that navigating from `/chat` to `/activity` shows the transition between compact and spacious sidebar modes.
    - Run `npm run build`.

## Checklist

- [ ] **Phase 1: Dynamic Shell**
    - [ ] Implement conditional header height based on `isOnChat`.
- [ ] **Phase 2: Chat Mode Buttons**
    - [ ] Slim down "New Chat" action button styles.
- [ ] **Phase 3: Deep Density**
    - [ ] Reduce Section Toggle padding within `renderChatModeContent`.
    - [ ] Compact Search inputs within `renderChatModeContent`.
    - [ ] Shrink History & Resource item sizes within `renderChatModeContent`.
- [ ] **Phase 4: Side Context**
    - [ ] Set `rightSidebar` default state to `'collapsed'` in `ChatLayoutContext.tsx`.
- [ ] **Phase 5: Verification**
    - [ ] Run `npm run build`.
    - [ ] Visual QA: Verify standard mode is still spacious.
