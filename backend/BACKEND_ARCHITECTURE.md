# Backend Architecture and Service Coordination

This document describes the logic, flows, and coordination of the backend services in the `hanachan.org` project.

## Overview

The backend consists of multiple microservices, each responsible for specific functionalities. They communicate primarily via HTTP APIs and share data through MongoDB databases.

### Services

1.  **Hanachan (`backend/hanachan`)**
    *   **Type:** Flask Application (Python)
    *   **Port:** 5400 (default)
    *   **Purpose:** AI Chat Agent service.
    *   **Key Technologies:** Flask, LangChain, LangGraph, Ollama, MongoDB (`hanachan_db`).
    *   **Logic:**
        *   Provides a chat interface (`/chat/stream`, `/chat/complete`) with streaming support.
        *   Supports multiple agent architectures:
            *   **Standard Chat:** Uses `chat.py` for direct LLM interaction with tools.
            *   **Multi-Agent System (MAS):** Uses `mas_service.py` and `mas_graph.py` (LangGraph) to orchestrate multiple agents (`Scenario Actor`, `Sensei`, `Grammar Police`, `Pitch Coach`).
        *   **Flow (MAS):** User Input -> Scenario Actor -> Sensei (Analysis) -> (If Mistake) Grammar Police -> Aggregator -> Response.
    *   **Data:** Stores chat history in `hanachan_db`.

2.  **Dictionary (`backend/dictionary`)**
    *   **Type:** Express Application (Node.js)
    *   **Port:** 5200 or 5300 (configured in `main_server.js`)
    *   **Purpose:** Japanese Dictionary and Text Analysis service.
    *   **Key Technologies:** Express, MeCab (Tokenization), Kuroshiro (Kana conversion), DeepL (Translation), MongoDB (`jmdictDatabase`).
    *   **Logic:**
        *   **Text Analysis:** Tokenizes Japanese text into words/sentences (`/d-api/v1/parse`).
        *   **Conversion:** Converts between Hiragana, Katakana, Romaji (`/d-api/v1/convert/*`).
        *   **Dictionary Lookup:** Searches JMdict (`/d-api/v1/simple-vocabulary/:expression`) and Kanjidic (`/d-api/v1/kanji/:character`).
        *   **Translation:** Proxies requests to DeepL API (`/d-api/v1/deepl-translate`).
    *   **Data:** Uses `jmdictDatabase` and local JSON files (`kanjidic2.json`, `kradfile`).

3.  **Flask (`backend/flask`)**
    *   **Type:** Flask Application (Python)
    *   **Port:** 5100
    *   **Purpose:** User Data and Learning Features service.
    *   **Key Technologies:** Flask, PyMongo, MongoDB (`flaskFlashcardDB`).
    *   **Logic:**
        *   Manages user-specific data like Flashcards, Vocabulary Mining, and Login Streaks.
        *   Modules:
            *   `EmailWaitlist`: Manages waitlist signups.
            *   `LoginStreak`: Tracks user login streaks.
            *   `MecabUserVocabulary`: Tracks user's known vocabulary.
            *   `SentenceMiningModule`: Mines sentences for learning.
            *   `FlashcardModule`: Manages flashcards (SRS).
            *   `LibraryTexts`: Manages texts in the user's library.
    *   **Data:** Stores user data in `flaskFlashcardDB`.

4.  **Express (`backend/express`)**
    *   **Type:** Express Application (Node.js)
    *   **Port:** 8000
    *   **Purpose:** Static Educational Content service.
    *   **Key Technologies:** Express, Mongoose, MongoDB.
    *   **Logic:**
        *   Serves static educational content such as Words, Grammar points, Kanji, and Readings.
        *   Endpoints: `/e-api/v1/words`, `/e-api/v1/grammars`, `/e-api/v1/kanji`, etc.
        *   Supports multiple languages for grammar (Japanese, Vietnamese, Korean, Thai, Mandarin).
    *   **Data:** Connects to a MongoDB database (likely shared or specific to content).

5.  **Sitemap Generator (`backend/sitemap_generator`)**
    *   **Type:** Node.js Script
    *   **Purpose:** SEO Utility.
    *   **Logic:** Generates sitemaps based on content slugs to help with search engine indexing.

## Service Coordination

*   **Frontend Interaction:** The frontend (Next.js) likely interacts with these services via their respective APIs.
    *   Chat features -> `Hanachan` (Port 5400)
    *   Dictionary/Analysis -> `Dictionary` (Port 5200/5300)
    *   User Progress/Flashcards -> `Flask` (Port 5100)
    *   Content Display -> `Express` (Port 8000)

*   **Database Usage:**
    *   `hanachan_db`: Chat history.
    *   `jmdictDatabase`: Dictionary entries.
    *   `flaskFlashcardDB`: User data (flashcards, streaks).
    *   Content DB (accessed by `backend/express`): Static educational content.

## Logic Flows

### Chat Flow (Hanachan)
1.  **User Input:** Frontend sends text to `/chat/stream`.
2.  **Service Selection:** `app.py` selects `mas_service` or `chat_service` based on env var.
3.  **Processing:**
    *   **Standard:** LLM processes input with tools (e.g., Qdrant for RAG).
    *   **MAS:** LangGraph orchestrates agents. `Sensei` analyzes input. If mistake found, `Grammar Police` explains. `Scenario Actor` responds naturally. `Aggregator` combines outputs.
4.  **Response:** Streamed back to frontend. History saved to `hanachan_db`.

### Dictionary Lookup Flow (Dictionary)
1.  **User Input:** Frontend requests word definition or text analysis.
2.  **Analysis:** `main_server.js` uses MeCab to tokenize text.
3.  **Lookup:** Queries `jmdictDatabase` or `kanjidic` data.
4.  **Response:** JSON data with readings, meanings, and breakdown returned to frontend.

### Learning Flow (Flask)
1.  **User Action:** User reviews a flashcard or reads a text.
2.  **Update:** Frontend sends update to `backend/flask` endpoints.
3.  **Storage:** `server.py` routes to appropriate module (e.g., `flashcards.py`), which updates `flaskFlashcardDB`.
