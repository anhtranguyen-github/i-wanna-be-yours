# Architectural Design & Detailed Specification

## SECTION 4: Architectural Design

### 4.1 Software Architecture Selection
1.  **Selection:** Distributed Microservices Architecture.
2.  **Explanation:** The system is composed of four distinct, loosely coupled services (Microservices) that communicate over HTTP APIs. Each service is responsible for a specific business domain (AI, User Data, Dictionary, Content). They share data persistence layers but operate independently. This allows for polyglot development (Python and Node.js) and independent scaling of compute-intensive tasks (AI/LLM) versus I/O-intensive tasks (Data APIs).
3.  **Application Mapping:**
    *   **Presentation Tier:** `frontend-next` (Next.js Application).
    *   **Gateway/API Tier:** Concepts are distributed; the Frontend calls each service directly or via local proxies.
    *   **AIServices:** `hanachan` (Python/Flask) handles Chat and Agent orchestration.
    *   **LearningServices:** `flask-dynamic-db` (Python/Flask) handles User Progress (SRS, Flashcards).
    *   **DataLayer Services:** `dictionary-db` (Node/Express) for real-time text analysis, and `express-db` (Node/Express) for static curriculum content.

### 4.2 High-Level Design (UML Package Diagram)
1.  **Diagram Description:**
    *   **Presentation:** Next.js Client
    *   **Gateway:** (Virtual/Nginx/LocalHost Routing)
    *   **AIServices:** `Hanachan Service`
    *   **LearningServices:** `Flask User Service`
    *   **LinguisticServices:** `Dictionary Service`
    *   **ContentServices:** `Express Static Service`
    *   **DataLayer:** MongoDB (`hanachan_db`, `flaskFlashcardDB`, `jmdictDatabase`, `zenRelationships`)
2.  **Dependencies:**
    *   Presentation $\rightarrow$ AIServices (for Chat)
    *   Presentation $\rightarrow$ LearningServices (for Progress/SRS)
    *   Presentation $\rightarrow$ LinguisticServices (for Dictionary lookups)
    *   AIServices $\rightarrow$ DataLayer (Chat History)
    *   LearningServices $\rightarrow$ ContentServices (to clone static content) $\rightarrow$ DataLayer
3.  **Package Purpose:**
    *   **Presentation:** Handles UI/UX and user interaction.
    *   **AIServices:** Manages LLM agents, context, and chat history.
    *   **LearningServices:** Manages user specific state (Flashcards, Streaks, Library).
    *   **LinguisticServices:** Provides stateless tools for text tokenization and dictionary lookups.
    *   **ContentServices:** Serves immutable educational data (Kanji, Vocabulary lists).

### 4.3 Detailed Package Design (UML Class Relationships)
1.  **Selection:** **LearningServices** (specifically the Flashcard Module).
2.  **Design Description:**
    *   **`FlashcardModule`**: The central controller class. It initializes routes and manages the connection to `flaskFlashcardDB`.
        *   *Relationship:* Uses `PyMongo` to interact with the database.
        *   *Relationship:* Dependency on `requests` to fetch data from `ContentServices` (Static API) during cloning operations.
    *   **`f_adjust_frequency_and_shuffle`**: A helper function (logic component) used by `FlashcardModule`.
        *   *Relationship:* Used by route handlers to process flashcard lists before returning them to the client.
    *   **Logic Flow:** The module receives a request to "Clone" a static collection. It queries the `ContentServices` API, filters out existing items, and inserts new documents into `flaskFlashcardDB` with user-specific fields (e.g., `difficulty: "unknown"`).

---

## SECTION 5: Detailed Design

### 5.1 Interface Design
1.  **Specifications:**
    *   **Resolution:** Responsive Design (Mobile First + Desktop Wide).
    *   **Palette:** Deep Navy/Black Backgrounds (`#0f172a`), Primary Accent Emerald Green (`#10b981`), Secondary Accent Indigo (`#6366f1`). "Premium Dark Glass" aesthetic.
    *   **Typography:** Sans-serif (Inter/Geist) for UI, Serif (Noto Serif JP) for Japanese text.
2.  **Mockup Summaries:**
    *   **Personalized Quiz Feedback:** A modal or slide-over panel. Top section shows "Score" (e.g., 8/10). Middle section lists "Mistakes" with a red highlight. Clicking a mistake expands an "AI Explanation" (sourced from Hanachan). Bottom section has "Add to Flashcards" buttons for missed words.
    *   **Text Parser Screen:** A two-pane layout. Left pane is a large text input area with "Analyze" button. Right pane (or bottom on mobile) displays the parsed text with clickable words. Clicking a word opens a "Dictionary Pop-over" with readings, meaning, and "Mine to Vocabulary" button.

### 5.2 Class Design

1.  **Critical Class Details (Table Format):**

| Class Name | Attributes | Methods |
| :--- | :--- | :--- |
| **`FlashcardModule`**<br>*(LearningServices)* | `mongo_flaskFlashcardDB`: PyMongo<br>`host`: str<br>`port`: str | `register_routes(app)`: void<br>`clone_static_collection_kanji(req)`: JSON<br>`combine_flashcard_data_kanji(req)`: JSON<br>`f_adjust_frequency_and_shuffle(data)`: List |
| **`MockAgent`**<br>*(AIServices)* | *None (Stateless Logic)* | `generate_debug_response(prompt, session_id, user_id, context_config...)`: Dict<br>*Generates mock artifacts (tasks, mindmaps) for testing frontend flows.* |
| **`ChatMessage`**<br>*(DataModel)* | `id`: Integer<br>`role`: String<br>`content`: Text<br>`context_configuration`: JSON | `to_dict()`: Dict<br>*Manages relationships to Attachments and Artifacts.* |

2.  **Sequence Diagram Summaries:**
    *   **Personalized Quiz Feedback:**
        *   `User` submits Quiz Answers $\rightarrow$ `Frontend` calculates score $\rightarrow$ `Frontend` sends wrong answers to `Hanachan` (`/chat/stream`) $\rightarrow$ `Hanachan` (Agent) generates explanation $\rightarrow$ `Hanachan` saves to `ChatMessage` DB $\rightarrow$ `Frontend` displays explanation.
    *   **AI-managed Flashcard Creation:**
        *   `User` asks "Create flashcards for travel" $\rightarrow$ `Hanachan` generates `MessageArtifact` (Type: Flashcard) $\rightarrow$ `AgentService` saves `FlashcardSet` and `Flashcard` items to DB $\rightarrow$ `Frontend` detects Artifact in stream $\rightarrow$ `Frontend` calls `LearningServices` (`/f-api/v1/import`) to add to user's permanent deck.

### 5.3 Database Design

1.  **E-R Diagram (Conceptual):**
    *   **User** (1) $\iff$ (N) **Session**
    *   **User** (1) $\iff$ (N) **Flashcard** (Stores `difficulty`, `p_tag`)
    *   **Conversation** (1) $\iff$ (N) **ChatMessage**
    *   **ChatMessage** (1) $\iff$ (N) **MessageArtifact** (Flashcards, Tasks, Mindmaps)

2.  **Implementation Strategy:**
    *   **MongoDB (Primary Storage):**
        *   **`hanachan_db`**: Stores Chat History.
            *   *Collections:* `conversations`, `chat_messages` (contains `context_configuration`, links to artifacts), `message_artifacts` (polymorphic content: tasks, flashcards).
        *   **`flaskFlashcardDB`**: Stores User Learning Data.
            *   *Collections:* `kanji`, `words`, `grammars` (Dynamic collections per content type, storing user-specific `difficulty` and `next_review_date`).
    *   **Qdrant (Vector DB - *Access Pattern*):**
        *   To be implemented for `RAG` (Retrieval Augmented Generation).
        *   **Conversion:** JLPT Questions and Dictionary Definitions converted to vectors using `text-embedding-3-small` (or local equivalent).
        *   **Payload:** `{ "text": "Question content...", "level": "N3", "correct_answer": "...", "explanation": "..." }`. Used by `Hanachan` to retrieve relevant context when user asks generic questions.
