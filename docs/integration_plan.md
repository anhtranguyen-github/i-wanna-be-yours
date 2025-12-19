---
description: Plan to integrate Grammar Library and Quiz features into the UI
---

# Integration Plan: Grammar Library & Quiz UI

This plan outlines the steps to integrate the existing backend endpoints for Grammar and Quizzes into the frontend application.

## 1. Quiz Integration (/quiz)

**Status**: The `/quiz` route and its sub-routes (`/quiz/[id]`, `/quiz/create`) already exist and appear to be fully implemented.
**Goal**: Verify alignment with backend endpoints and ensure seamless functionality.

### Steps:
1.  **Backend Verification**:
    *   Ensure the Flask backend is running and reachable via the proxy (`/f-api/v1`).
    *   Endpoints used by `src/services/quizService.ts`:
        *   `GET /f-api/v1/quizzes`
        *   `GET /f-api/v1/quizzes/<id>`
        *   `POST /f-api/v1/quizzes/<id>/submit`
        *   `GET /f-api/v1/quiz-attempts`
        *   `POST /f-api/v1/quizzes` (Create)

2.  **Frontend Polish (No new code, just verification logic)**:
    *   The existing components `QuizListPage` and `QuizPlayerPage` are robust.
    *   Verify the "Category" filter in `QuizListPage` correctly sends `category=grammar` to the API.

## 2. Grammar Library Integration (/library/grammar)

**Status**: Does not exist. Needs to be created.
**Goal**: Create a browsing interface for grammar points using the Express (Static) and Flask (User Data) backends.

### Step 2.1: Service Layer (`src/services/grammarService.ts`)

Create a new service file to handle all grammar-related API calls.

*   **Helper**: `getEndpointUrl(path)` (handles `/e-api` vs `/f-api` routing).
*   **Functions**:
    1.  `getGrammars(params: { p_tag?: string, s_tag?: string })`:
        *   Calls `GET /e-api/v1/grammars`
    2.  `getGrammarTitles(p_tag: string)`:
        *   Calls `GET /e-api/v1/grammar-titles`
    3.  `getGrammarDetails(title: string)`:
        *   Calls `POST /e-api/v1/grammar-details` (Body: `{ "title": title }`)
    4.  `getUserGrammarProgress(params: { userId: string, p_tag: string, s_tag?: string })`:
        *   Calls `GET /f-api/v1/combine-flashcard-data-grammars` (Merges static data with user progress/difficulty).

### Step 2.2: Grammar List Page (`src/app/library/grammar/page.tsx`)

Create the main entry point for the grammar library.

*   **Layout**:
    *   Sidebar/Filter for JLPT Levels (`N5` - `N1`).
    *   Main content area displaying a grid or list of grammar points.
*   **Data Fetching**:
    *   Use `getGrammars` or `getGrammarTitles` based on the selected filter.
*   **Components**:
    *   `GrammarCard`: Displays title, simple meaning (if available), and user status (e.g., "Learned", "New").

### Step 2.3: Grammar Detail Page (`src/app/library/grammar/[slug]/page.tsx`)

Create a detailed view for a specific grammar point. Note: Since endpoints use `title` as a key, the `[slug]` should be the URL-encoded title.

*   **Data Fetching**:
    *   Decode `slug`.
    *   Call `getGrammarDetails(title)`.
*   **UI Sections**:
    *   **Header**: Grammar title and basic meaning.
    *   **Structure/Formation**: How to form the grammar.
    *   **Examples**: List of example sentences.
    *   **Related**: Links to similar grammar (if data exists).
    *   **Action Bar**: "Mark as Learned" or "Add to Deck" (using Flashcard API).

### Step 2.4: Integration with Flashcards

*   Add a button on the Grammar Detail page to "Add to Review Queue".
*   Call `POST /f-api/v1/cards/personal` or the specific grammar cloning endpoint `POST /f-api/v1/clone-static-collection-grammars` to add it to the user's study routine.

## 3. Navigation Updates

*   Update `src/components/Sidebar.tsx` (or relevant navigation component) to include a link to `/library/grammar`.
*   Ensure `/quiz` is easily accessible from the main dashboard or Practice section.
