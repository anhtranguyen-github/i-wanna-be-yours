# Dictionary Service Implementation Plan (Python + SudachiPy)

This document outlines the step-by-step implementation for migrating the existing Node.js dictionary service to a high-performance Python service as described in the draft plan.

---

## Phase 1: Environment & Project Setup
**Goal**: Establish the Python environment and basic API structure.

1. **Initialize Project**:
   - Directory: `backend/python-dictionary/`
   - Use `uv` for package management (consistent with `backend/flask`).
   - `uv init` inside the directory.

2. **Core Dependencies**:
   - `fastapi`, `uvicorn`: Modern, async web framework.
   - `sudachipy`, `sudachidict_full`: Advanced morphological analysis.
   - `motor`: Async MongoDB driver for Python.
   - `pydantic`: For data validation and UI payload contracts.
   - `pykakasi` or `kana_kanji_converter`: For phonetic script conversions (Romaji/Hiragana).

3. **Boilerplate API**:
   - Setup `main.py` with FastAPI.
   - Configure CORS and logging.
   - Define health check endpoint.

---

## Phase 2: Data Access & Models
**Goal**: Connect to the existing MongoDB `jmdictDatabase` and define data structures.

1. **Database Layer (`data/mongodb.py`)**:
   - Async connection to `mongodb://localhost:27017`.
   - Utility functions for querying `entries` and `kanjis` collections.

2. **Schema Models (`models/`)**:
   - `VocabEntry`: Map the `entries` collection (expression, reading, meanings, type).
   - `KanjiEntry`: Map the `kanjis` collection (literal, reading_meaning, misc, etc.).
   - `UnifiedResponse`: The precise contract for the Dictionary UI.

---

## Phase 3: Linguistic Analysis (Sudachi Integration)
**Goal**: Replace MeCab with SudachiPy for superior tokenization and lemmatization.

1. **Tokenizer Service (`services/tokenizer.py`)**:
   - Initialize Sudachi dictionary (A, B, and C modes).
   - Implement `parse_text(text, mode)`:
     - `mode="search"`: Detailed breakdown for individual words.
     - `mode="context"`: Full sentence analysis for reading comprehension.

2. **Token Normalization**:
   - Extract surface form, dictionary (base) form, reading (converted to Hiragana), and POS tags.
   - Map Sudachi's multi-level POS tags to simplified UI categories (Noun, Verb-Ichidan, etc.).

---

## Phase 4: Core Logic & Aggregation
**Goal**: Implement the "Fragmentation Principle" where aggregation happens in Python.

1. **Search Service (`services/search_service.py`)**:
   - **Step A**: Tokenize query string via Sudachi.
   - **Step B**: For each token, query `entries` by `expression` (Kanji) or `reading` (Kana).
   - **Step C**: Identify unique Kanji literals in the results and batch-query the `kanjis` collection.
   - **Step D**: Assemble the final JSON payload containing Vocab list, Kanji list, and potentially related words.

2. **Script Conversion Utility**:
   - Implement logic to generate Furigana/Okurigana using Sudachi's token boundaries and dictionary forms.

---

## Phase 5: API Endpoint Parity
**Goal**: Ensure the new service can handle existing dictionary requests.

1. **Replicate JS Endpoints**:
   - `POST /d-api/v1/parse-split`: Sentence-aware tokenization.
   - `GET /d-api/v1/kanji/{character}`: Character-specific technical details.
   - `GET /d-api/v1/simple-vocabulary/{expression}`: Word lookup with fallback/trimming logic.
   - `POST /d-api/v1/convert/all`: Script conversions.

2. **Integration Testing**:
   - Use `curl` to compare outputs between Node.js service (port 5200) and Python service (port TBD).

---

## Phase 6: Frontend Integration & Cleanup
**Goal**: Switch the live application to the new service.

1. **Update Local Services**:
   - Modify `start_local_services.sh` to include the new Python Dictionary service.
   - Assign port `5200` for the new service (or eventually replace `5200`).

2. **Update Next.js Frontend**:
   - Update `app/dictionary/page.tsx` and `services/` to point to the new Python API.
   - Verify that all tabs (Vocab/Kanji/Sentences/Grammar) function with the new payload structure.

3. **Retire Old Service**:
   - Once stable, remove or archive `backend/dictionary/main_server.js` and associated Node dependencies.
