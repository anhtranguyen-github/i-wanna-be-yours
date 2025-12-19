# Implementation Plan: Backend Alignment & Feature Fixes

This plan outlines the steps to resolve 404 errors in Quiz and Library features, fix empty flashcard decks, and ensure correct Guest vs. Logged-in user behavior.

## 1. Problem Diagnosis

### 1.1 Route Mismatches (Common Cause for 404)
The current architecture uses a Next.js rewrite rule:
`{ source: '/f-api/:path*', destination: '${FLASK_API_URL}/:path*' }`
- **Result**: A request to `/f-api/v1/quizzes` is proxied to `http://5100/v1/quizzes`.
- **Backend Condition**: Many Flask modules (e.g., `quiz.py`, `library.py`) have `@app.route("/f-api/v1/...")` hardcoded.
- **Outcome**: The backend is listening for `/f-api/v1/...` but receiving `/v1/...`, leading to **404 Not Found**.

### 1.2 Flashcards Empty Decks
- **API Call**: `deckService.ts` fetches from `/f-api/api/v1/decks`. This correctly proxies to `:5100/api/v1/decks`.
- **Investigation Area**: If the response is success (200) but cards are empty, the issue lies in the MongoDB query within `decks.py` or missing data in the `zenRelationshipsAutomated` database.

### 1.3 Service Inconsistency
- Some services use `/f-api/v1`, others use `/f-api/api/v1`, and some (like `flashcardService.ts`) accidentally double-prefix with `/f-api`.

## 2. Proposed Solutions

### 2.1 Backend Route Normalization
Strip the proxy-specific prefix (`/f-api`) from all Flask routes. The backend should be agnostic of the gateway/proxy path.
- **Standard**: `/v1/[resource]`

### 2.2 Frontend Service Audit
Align all services to use `/f-api/v1` (the proxy prefix + version).
- **Consolidate**: `quizService`, `flashcardService`, `deckService`, and `library` service calls.

### 2.3 Guest vs Logged-in Logic
- **Frontend**: Use `useUser()` or `useSession()` to conditionally fetch "Personal" vs "Public" content.
- **Backend**: Ensure routes requiring a `userId` (like `/quiz-attempts` or `/cards/personal`) validate that the `userId` matches the authenticated session (if applicable) or provide meaningful error messages.

## 3. Implementation Steps

### Phase 1: Flask Route Updates
1.  **`backend/flask/modules/quiz.py`**: Update all routes from `/f-api/v1/` to `/v1/`.
2.  **`backend/flask/modules/library.py`**: Update all routes from `/f-api/v1/` to `/v1/`.
3.  **`backend/flask/modules/flashcards.py`**: Update routes to remove `/f-api`.
4.  **`backend/flask/modules/resources.py`**: Update routes to remove `/f-api`.

### Phase 2: Frontend Service Alignment
1.  **`frontend-next/src/services/quizService.ts`**: Verify `API_BASE = '/f-api/v1'`.
2.  **`frontend-next/src/services/flashcardService.ts`**: Fix double prefix (remove extra `/f-api`).
3.  **`frontend-next/src/services/deckService.ts`**: Update `API_BASE_URL` to `/f-api/v1` (removing the extra `/api` segment to match other modules).
    - *Note*: If `decks.py` remains as `/api/v1/decks`, then the frontend should use `/f-api/api/v1/decks`. I will normalize backend to `/v1/decks` for consistency.

### Phase 3: Flashcard Data Verification
1.  Check MongoDB `zenRelationshipsAutomated` database.
2.  Verify collection names: `words`, `sentences`.
3.  Ensure `p_tag` and `s_tag` values match the hardcoded values in `decks.py` (e.g., `essential_600_verbs`).

### Phase 4: UI/UX Refinement
1.  **Flashcards Details**: Ensure `currentCard.userId` (if applicable) is checked if we start supporting private decks.
2.  **Quiz Page**: Update the `useEffect` to handle empty results gracefully with a "No quizzes found" message instead of just a generic error.
3.  **Auth Overlay**: For features requiring login (like saving quiz results), trigger the `GlobalAuthModal` instead of a 404 or crash.

## 4. Verification Plan
1.  **Connectivity**: `curl http://localhost:5100/v1/quizzes` (should return sample quizzes).
2.  **Proxy**: `fetch('/f-api/v1/quizzes')` from browser console (should return 200).
3.  **Flashcards**: Navigate to a deck detail page. Verify if cards are rendered. If still empty, inspect the network response body to see if `cards[]` is empty.
4.  **Guest Flow**: Logout and verify that you can still browse "Public" quizzes but are prompted to login when trying to "Save Result".
