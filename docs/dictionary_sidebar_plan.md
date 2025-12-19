# Dictionary Sidebar Integration Plan - REVISED

## Objective
Refactor the Dictionary integration to be a top-level **Navigation Tab** (like Chat, Tools, Library) that, when active, switches the sidebar to a dedicated **Dictionary Mode**.

## UI/UX Design

### 1. Navigation
*   **Action**: Add "Dictionary" item to the main sidebar navigation list (`navIcons`).
*   **Icon**: `Book` or `BookOpen`.
*   **Route**: `/dictionary`.

### 2. Sidebar Layout Logic
*   **Standard Mode**: (Tools, Library, etc.) -> Shows standard nav list + footer.
*   **Chat Mode**: (`/chat`) -> Shows standard Chat sidebar (History/Resources).
*   **Dictionary Mode**: (`/dictionary`) -> Shows the **Dictionary Widget** filling the entire sidebar.

### 3. Dictionary Mode Content (`renderDictionaryModeContent`)
*   **Header**: Standard sidebar toggle.
*   **Body**: The `DictionaryWidget` (Input + Tabs + Results).
*   **Footer**: Standard utility icons (Settings, User, Logout) or maybe just the `DictionaryWidget` fills it all?
    *   *Decision*: Keep consistent footer across modes if possible, or include it in the widget layout. The `Chat` mode has a footer. I should add a footer to Dictionary mode too for consistency.

## Implementation Roadmap

### Phase 1: Revert & Clean
1.  Remove `DictionaryWidget` from `renderStandardModeContent` in `CollapsibleSidebar.tsx`.

### Phase 2: Route & Page
1.  Create `src/app/dictionary/page.tsx`.
    *   Content: A placeholder or distinct background. The action happens in the sidebar.
    *   *Idea*: Main page could show "Select a word in the sidebar to view details" or show the same details in a larger view (future). For now, simple "Dictionary" header.

### Phase 3: Sidebar Integration
1.  Update `CollapsibleSidebar.tsx`:
    *   Add Dictionary to `navIcons`.
    *   Add `isOnDictionary` check.
    *   Implement `renderDictionaryModeContent`.
    *   Update render logic to switch between `Chat | Dictionary | Standard`.

### Phase 4: Widget Refinement
1.  Ensure `DictionaryWidget` accepts `className` and expands to fill the container.
2.  (Already done in previous step, checking style).
