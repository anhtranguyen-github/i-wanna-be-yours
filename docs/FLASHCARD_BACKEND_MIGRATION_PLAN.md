---
description: Migrate Flashcard Decks to Backend (Simplified Model)
---

# 1. Project Overview
The goal is to move the static deck definitions from the frontend (`decks-data.tsx`) to the backend. We will implement a simplified `Deck` model in the backend (likely in the `dictionary` or `flask-dynamic-schema` service, but typically MongoDB is best for this flexible content). 

We will start with a **Core Deck Model** as requested:
- `id` (Unique string ID)
- `title` (Display title)
- `tags` (Array of strings)
- `cards` (Array of card data OR query logic to fetch cards)

However, fetching 2000 cards in a single object is heavy. A better approach is:
- **Deck Definition**: Stores metadata (`id`, `title`, `tags`, `description`).
- **Cards**: Stored securely in a standard collection, or embedded if the deck is small (<100 cards).
- For large JLPT decks, we likely want to keep the "Query" concept (e.g. "Fetch all N5 verbs") rather than hardcoding 500 card IDs in the deck document. But per your request, we will start with a valid "Database First" approach.

---

# 2. Simplified Backend Model (Python/Flask or Node/Express)

We currently have:
1.  **flask-dynamic-db**: Handles generic collections (`words`, `grammar`).
2.  **express-db**: Handles `users`.
3.  **dictionary-db**: Handles JMDict.

**Recommendation**: Add the `Deck` model to `flask-dynamic-db` since it already handles content types like `words`.

## Proposed Pydantic Model (Flask)

```python
from pydantic import BaseModel, Field
from typing import List, Optional, Any

class DeckCard(BaseModel):
    # Minimal card representation. 
    # Can be expanded, or just a reference ID.
    # For a "simplified" deck where content is IN the deck:
    front: str 
    back: str
    sub_detail: Optional[str] = None
    extra_data: Optional[dict] = {} # Store audio, images, etc.

class Deck(BaseModel):
    id: str = Field(alias='_id')  # Unique Deck ID (e.g., 'vocab-essential-verbs-1')
    title: str
    description: Optional[str] = ""
    tags: List[str] = []
    
    # "cards" can be a list of actual content objects
    cards: List[DeckCard] = [] 
    
    # OR if we want to support the legacy "Query" style as a backup:
    source_query: Optional[dict] = None # e.g. { "p_tag": "essential" }
```

## JSON Example (What stored data looks like)

```json
{
  "_id": "vocab-essential-verbs-1",
  "title": "Essential Verbs Vol. 1",
  "tags": ["vocabulary", "verbs", "essential", "beginner", "jlpt-n5"],
  "cards": [
     {
       "front": "食べる",
       "back": "To Eat",
       "sub_detail": "taberu",
       "extra_data": { 
           "audio": "/audio/taberu.mp3",
           "sentence": "I eat sushi."
       }
     },
     { "front": "飲む", "back": "To Drink", "sub_detail": "nomu" }
  ]
}

## Metadata Mapping Strategy (Flattening)
As per the simplified design, we will convert specific legacy database fields into the generic `tags` array:
- **Collection**: `words` -> `['vocabulary']`, `kanji` -> `['kanji']`
- **Primary Tag (`p_tag`)**: `JLPT_N3` -> `['jlpt-n3']`, `essential_verbs` -> `['essential', 'verbs']`
- **Secondary Tag (`s_tag`)**: `verbs-1` -> `['verbs-1']`
- **Status/Level**: `difficulty` -> `['easy']` (if applicable)

Legacy fields (`p_tag`, `s_tag`) will **NOT** be stored as separate columns in the simplified `Deck` model. All filtering will happen via specific `tags`.

---

# 3. Migration Plan

1.  **Backend Implementation**:
    *   Create `Deck` schema in `flask-dynamic-db`.
    *   Create API endpoints:
        *   `GET /api/decks` (List all decks - metadata only)
        *   `GET /api/decks/<id>` (Get full deck with cards)
        *   `POST /api/decks` (Create new deck - useful for seeding)

2.  **Seeding**:
    *   Write a script to read our current `decks-data.tsx` (or an equivalent JSON source) and `POST` these `Deck` objects to the backend to initialize the database.
    *   For the dynamic decks (like "All N5 Kanji"), we can either:
        *   Run the query once and save the *result* as a static deck (Simple, fast loading).
        *   Keep a `source_query` field in the Deck model to fetch live data (Dynamic).
    *   *Decision*: For "Simplified", specific decks (Vol 1, Vol 2) should probably be static lists of cards.

3.  **Frontend Refactor**:
    *   Replace `decks-data.tsx` logic.
    *   `FlashcardDeckPage` (`details/[id]/page.tsx`) will now `fetch('/api/decks/' + id)`.
    *   The page will receive the direct `{ cards: [...] }` array instead of needing to know complex API params like `p_tag` or `s_tag`.

---

# 4. Next Steps

1.  Confirm if you want to implement this in `flask-dynamic-db` (Python) or `express-db` (Node). *Python is currently used for the flashcard content APIs, so it makes sense to stay there.*
2.  I will generate the Python Models file for you to review.
