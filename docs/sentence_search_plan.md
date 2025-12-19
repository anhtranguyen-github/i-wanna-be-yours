# Implementation Plan: Sentence Search Integration

## Goal
Integrate example sentence searching into the Python Dictionary Service by querying the existing `sentences` collection in the `zenRelationshipsAutomated` database.

## Phase 1: Data Access Layer
- **New Model**: Create `models/sentence.py` with Pydantic models for `SentenceEntry` mirroring the MongoDB schema (`sentence_original`, `sentence_english`, `key`, etc.).
- **Multi-DB Support**: Update `data/mongodb.py` or `search_service.py` to handle queries across both `jmdictDatabase` and `zenRelationshipsAutomated`.

## Phase 2: Search Logic Enhancement
- **Key-Based Lookup**: In `SearchService.search`, for each token identified by Sudachi, query the `sentences` collection where the `key` matches the token's dictionary form.
- **Surface-Based Fallback**: (Optional/Secondary) Perform a regex search on `sentence_original` for tokens that have no explicit `key` mapping.
- **De-duplication**: Ensure sentences are unique in the output.
- **Ordering**: Limit results (e.g., top 10) to maintain performance.

## Phase 3: API & Frontend Alignment
- **Update Unified Response**: Include a `sentences` array in the `search` response.
- **Frontend Service**: Update `frontend-next/src/services/dictionaryService.ts` to use the real sentences from the API instead of mock data.
- **UI Update**: Ensure the "Sentences" tab in `app/dictionary/page.tsx` correctly consumes and displays the aggregated results.

## Phase 4: Verification
- **Integration Test**: Update `test_integration.py` to assert that sentences are returned for known keys (e.g., "今日", "学").
- **Full Build**: Run `npm run build` in `frontend-next` to ensure zero regressions.

---
**STRICT EXECUTION STARTING NOW**
