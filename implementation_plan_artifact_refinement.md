# Implementation Plan: Artifact System Refinement

**Status:** 🚧 IN PROGRESS (Core completed, testing pending)  
**Branch:** dev/hanachan-creator  
**Priority:** High  
**Last Updated:** December 16, 2025

---

## Overview

Refine the Hanachan artifact system with:

1. **MongoDB Storage** - Flexible schema for artifacts (not fixed columns)
2. **User Ownership** - Track who owns each artifact
3. **Dynamic Fields** - Save whatever the AI generates, filter later
4. **Add to Deck / Create Deck** - Flashcard management
5. **Quiz/Exam Launch** - Integration with practice pages

---

## Storage Architecture Change

### Current State (PostgreSQL - Too Rigid)

```
PostgreSQL Tables with Fixed Columns:
├── message_artifacts (type, title, summary)
├── flashcard_sets (id, title)
├── flashcards (id, set_id, front, back)  ← FIXED FIELDS
├── quiz_sets (id, title, level, skill)   ← FIXED FIELDS
└── quiz_questions (id, content, ...)     ← FIXED FIELDS
```

**Problems:**
- Adding new fields requires schema migration
- AI can't generate arbitrary metadata
- Different artifact types need different tables

### Target State (MongoDB - Flexible)

```
MongoDB Collection: artifacts
├── _id: ObjectId
├── userId: string (owner)
├── conversationId: string (optional, source chat)
├── type: "flashcard_single" | "flashcard_deck" | "quiz" | "exam" | ...
├── createdAt: Date
├── updatedAt: Date
├── savedToLibrary: boolean
├── data: { ... }  ← FLEXIBLE, STORE ANYTHING
└── metadata: { ... } ← FLEXIBLE, ANY FIELDS
```

**Benefits:**
- No migrations needed for new fields
- AI can add any metadata (level, skill, sections, tags, etc.)
- One collection for all artifact types
- Easy to query by userId

---

## MongoDB Document Schemas

### Base Artifact Document

```json
{
  "_id": "ObjectId",
  "userId": "user_123",
  "conversationId": "conv_456",  // Optional: which chat created it
  "messageId": "msg_789",        // Optional: which message
  
  "type": "flashcard_deck",
  "title": "N5 Essential Verbs",
  
  "createdAt": "2025-12-16T00:00:00Z",
  "updatedAt": "2025-12-16T00:00:00Z",
  "source": "hanachan",           // "hanachan" | "user" | "import"
  
  "savedToLibrary": true,         // User explicitly saved
  "isPublic": false,              // Shareable with others
  
  // FLEXIBLE - AI can add anything here
  "metadata": {
    "level": "N5",
    "skill": "vocabulary", 
    "tags": ["verbs", "basic"],
    "estimatedTime": "15 min",
    "difficulty": 3,
    // ... any other fields AI wants to add
  },
  
  // FLEXIBLE - Content varies by type
  "data": {
    // Structure depends on artifact type
    // No fixed schema - store whatever AI generates
  }
}
```

### Example: Flashcard Deck

```json
{
  "_id": "art_001",
  "userId": "user_123",
  "type": "flashcard_deck",
  "title": "N5 Essential Verbs",
  "savedToLibrary": true,
  
  "metadata": {
    "level": "N5",
    "skill": "vocabulary",
    "cardCount": 10,
    "category": "verbs"
    // AI can add more fields freely
  },
  
  "data": {
    "description": "Common N5 verbs",
    "cards": [
      {
        "id": "card_001",
        "front": "食べる",
        "back": "to eat",
        "reading": "たべる",
        "example": "ごはんを食べる。",
        "audio": "/audio/taberu.mp3",
        "tags": ["verb", "ichidan"]
        // Any card fields AI wants
      }
    ]
  }
}
```

### Example: Quiz

```json
{
  "_id": "art_002",
  "userId": "user_123",
  "type": "quiz",
  "title": "N4 Grammar Quiz",
  "savedToLibrary": false,
  
  "metadata": {
    "level": "N4",
    "skill": "grammar",
    "questionCount": 5,
    "passingScore": 60,
    "timeLimit": null
    // Flexible fields
  },
  
  "data": {
    "description": "Test your N4 grammar",
    "questions": [
      {
        "id": "q_001",
        "type": "multiple_choice",
        "content": "Choose the correct form...",
        "options": [...],
        "correctAnswer": "a",
        "explanation": "...",
        // Any question fields
      }
    ]
  }
}
```

### Example: Exam

```json
{
  "_id": "art_003",
  "userId": "user_123",
  "type": "exam",
  "title": "N3 Practice Exam",
  "savedToLibrary": true,
  
  "metadata": {
    "level": "N3",
    "skill": "mixed",
    "questionCount": 20,
    "timeLimit": 30,
    "sections": ["vocabulary", "grammar", "reading"]
    // Whatever AI generates
  },
  
  "data": {
    "sections": [
      {
        "name": "Vocabulary",
        "questions": [...]
      },
      {
        "name": "Grammar", 
        "questions": [...]
      }
    ]
  }
}
```

---

## API Design

### Hanachan Backend (Flask) - Create Artifact

**POST** `/artifacts`

```json
// Request
{
  "userId": "user_123",
  "conversationId": "conv_456",
  "type": "flashcard_deck",
  "title": "N5 Verbs",
  "metadata": { ... },  // Any fields
  "data": { ... },      // Any structure
  "savedToLibrary": false
}

// Response
{
  "_id": "art_new_001",
  "createdAt": "2025-12-16T00:00:00Z",
  ...
}
```

### Hanachan Backend - Save to Library

**PATCH** `/artifacts/{id}/save`

```json
// Request
{
  "savedToLibrary": true
}

// Response
{
  "success": true,
  "artifact": { ... }
}
```

### Hanachan Backend - Get User's Artifacts

**GET** `/artifacts?userId={id}&type={type}&savedToLibrary=true`

```json
// Response
{
  "artifacts": [
    { ... },
    { ... }
  ],
  "total": 15,
  "page": 1
}
```

### Express Backend - Filtering/Validation Service

The Express backend (or another service) can:
- Validate artifact structure for specific use cases
- Index artifacts for search
- Filter by metadata fields (level, skill, etc.)
- Transform artifacts for different frontends

**Note:** Hanachan just stores raw artifacts. Other services handle validation/filtering.

---

## Implementation Phases

### Phase 1: MongoDB Setup (30 min)

**Files:**
- `backend/hanachan/database/mongo.py` - MongoDB connection
- `backend/hanachan/models/artifact_mongo.py` - Document helpers

```python
# mongo.py
from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017")
db = client.hanabira

artifacts_collection = db.artifacts
```

### Phase 2: Artifact Service (1 hr)

**File:** `backend/hanachan/services/artifact_service.py`

```python
class ArtifactService:
    def create_artifact(self, user_id: str, artifact_type: str, 
                        title: str, data: dict, metadata: dict = None,
                        conversation_id: str = None) -> dict:
        """Create new artifact in MongoDB"""
        doc = {
            "userId": user_id,
            "conversationId": conversation_id,
            "type": artifact_type,
            "title": title,
            "data": data,           # Store as-is, no validation
            "metadata": metadata or {},  # Store as-is
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
            "savedToLibrary": False,
            "source": "hanachan"
        }
        result = artifacts_collection.insert_one(doc)
        doc["_id"] = str(result.inserted_id)
        return doc
    
    def save_to_library(self, artifact_id: str, user_id: str) -> bool:
        """Mark artifact as saved to user's library"""
        result = artifacts_collection.update_one(
            {"_id": ObjectId(artifact_id), "userId": user_id},
            {"$set": {"savedToLibrary": True, "updatedAt": datetime.utcnow()}}
        )
        return result.modified_count > 0
    
    def get_user_artifacts(self, user_id: str, 
                          artifact_type: str = None,
                          saved_only: bool = False) -> list:
        """Get artifacts for a user"""
        query = {"userId": user_id}
        if artifact_type:
            query["type"] = artifact_type
        if saved_only:
            query["savedToLibrary"] = True
        
        return list(artifacts_collection.find(query).sort("createdAt", -1))
```

### Phase 3: Update Agent Service (30 min)

**File:** `backend/hanachan/services/agent_service.py`

Change from PostgreSQL to MongoDB:

```python
# OLD: PostgreSQL
new_artifact = MessageArtifact(message_id=msg.id, type="flashcard", ...)
db.session.add(new_artifact)

# NEW: MongoDB
artifact_service = ArtifactService()
artifact_service.create_artifact(
    user_id=request_data.user_id,
    artifact_type="flashcard_deck",
    title=a_title,
    data=a_data,  # Store entire data object as-is
    metadata={"level": "N5", ...},  # Any metadata
    conversation_id=request_data.session_id
)
```

### Phase 4: API Routes (30 min)

**File:** `backend/hanachan/routes/artifacts.py`

```python
bp = Blueprint('artifacts', __name__, url_prefix='/artifacts')

@bp.route('/', methods=['POST'])
def create_artifact():
    data = request.json
    service = ArtifactService()
    artifact = service.create_artifact(
        user_id=data['userId'],
        artifact_type=data['type'],
        title=data['title'],
        data=data['data'],
        metadata=data.get('metadata', {})
    )
    return jsonify(artifact)

@bp.route('/<artifact_id>/save', methods=['PATCH'])
def save_to_library(artifact_id):
    user_id = get_current_user_id()
    service = ArtifactService()
    success = service.save_to_library(artifact_id, user_id)
    return jsonify({"success": success})

@bp.route('/', methods=['GET'])
def get_artifacts():
    user_id = request.args.get('userId')
    artifact_type = request.args.get('type')
    saved_only = request.args.get('savedToLibrary') == 'true'
    
    service = ArtifactService()
    artifacts = service.get_user_artifacts(user_id, artifact_type, saved_only)
    return jsonify({"artifacts": artifacts})
```

### Phase 5: Frontend Service (30 min)

**File:** `frontend-next/src/services/artifactService.ts`

```typescript
class ArtifactService {
  async saveToLibrary(artifactId: string): Promise<boolean> {
    const res = await fetch(`${API}/artifacts/${artifactId}/save`, {
      method: 'PATCH',
      headers: this.getHeaders()
    });
    return res.ok;
  }
  
  async getUserArtifacts(type?: string, savedOnly = false): Promise<Artifact[]> {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (savedOnly) params.set('savedToLibrary', 'true');
    
    const res = await fetch(`${API}/artifacts?${params}`, {
      headers: this.getHeaders()
    });
    return (await res.json()).artifacts;
  }
  
  async addCardsToExistingDeck(deckId: string, cards: any[]): Promise<boolean> {
    // Updates existing artifact's data.cards array
    const res = await fetch(`${API}/artifacts/${deckId}/cards`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ cards })
    });
    return res.ok;
  }
}
```

### Phase 6: Frontend Renderers (1.5 hr)

Update artifact renderers to use new service:

```tsx
// FlashcardRenderer.tsx
const handleSave = async () => {
  await artifactService.saveToLibrary(artifact._id);
  setIsSaved(true);
  toast.success("Saved to library!");
};

const handleAddToDeck = async (deckId: string) => {
  await artifactService.addCardsToExistingDeck(deckId, artifact.data.cards);
  toast.success("Cards added to deck!");
};
```

---

## File Summary

### New Files (6)

| File | Purpose |
|------|---------|
| `database/mongo.py` | MongoDB connection |
| `services/artifact_service.py` | CRUD for artifacts |
| `routes/artifacts.py` | REST API endpoints |
| `services/artifactService.ts` | Frontend API client |
| `FlashcardSingleRenderer.tsx` | Single card + add to deck |
| `DeckSelectorModal.tsx` | Select existing deck modal |

### Modified Files (4)

| File | Changes |
|------|---------|
| `agent_service.py` | Use MongoDB instead of PostgreSQL |
| `ArtifactRenderer.tsx` | Dispatch to new renderers |
| `aiTutorTypes.ts` | Update Artifact types |
| `app.py` | Register artifacts blueprint |

---

## Key Design Decisions

### 1. Flexible Schema

```
metadata: { ... }  // Any fields AI generates
data: { ... }      // Any structure
```

- **No fixed columns** - AI can add `level`, `skill`, `sections`, `tags`, or anything else
- **No validation in Hanachan** - Just store what's sent
- **Filtering done elsewhere** - Express backend or frontend handles filtering by level, skill, etc.

### 2. User Ownership

```json
{
  "userId": "user_123",      // Required: who owns this
  "savedToLibrary": true     // Did user explicitly save?
}
```

### 3. Source Tracking

```json
{
  "source": "hanachan",      // AI-generated
  "conversationId": "...",   // Which chat
  "messageId": "..."         // Which message
}
```

---

## Mock Agent for Debugging & Testing

### Purpose

Create a comprehensive mock agent that:
1. **Echoes all errors** - Shows any errors received
2. **Returns ALL artifact types** - One of each for UI testing
3. **Shows debug info** - Request details, session info, etc.

### Mock Agent Response Structure

```python
# mock_agent.py

class MockAgent:
    def generate_debug_response(self, prompt, session_id, user_id, ...):
        """
        Debug mode: Returns ALL artifact types for UI testing
        """
        
        # 1. Echo any errors
        errors = self._collect_errors()
        
        # 2. Debug info
        debug_content = f"""
### 🔧 Debug Mode Response

**Request Info:**
- Session: `{session_id}`
- User: `{user_id}`
- Prompt: "{prompt}"

**Errors Found:** {len(errors)}
{self._format_errors(errors)}

**Artifacts Generated:** All sample types below ⬇️
"""
        
        # 3. Generate ALL artifact types
        artifacts = [
            self._sample_flashcard_single(),
            self._sample_flashcard_deck(),
            self._sample_quiz(),
            self._sample_exam(),
            self._sample_vocabulary(),
            self._sample_mindmap(),
            self._sample_task(),
        ]
        
        return {
            "content": debug_content,
            "artifacts": artifacts,
            "suggestions": [
                {"text": "Test flashcard single"},
                {"text": "Test quiz submission"},
                {"text": "Test exam launch"},
            ],
            "errors": errors  # Include errors in response
        }
```

### Sample Artifacts for Testing

#### 1. Flashcard Single (1-2 cards, add to deck)

```python
def _sample_flashcard_single(self):
    return {
        "type": "flashcard_single",
        "title": "Sample Single Card",
        "metadata": {
            "level": "N5",
            "skill": "vocabulary",
            "source": "debug"
        },
        "data": {
            "cards": [
                {
                    "id": "debug_card_001",
                    "front": "食べる",
                    "back": "to eat (たべる)",
                    "reading": "たべる",
                    "example": "ごはんを食べる。",
                    "tags": ["verb", "ichidan"]
                }
            ]
        },
        "actions": {
            "canAddToExistingDeck": True,
            "canCreateNewDeck": True
        }
    }
```

#### 2. Flashcard Deck (Full set, save to library)

```python
def _sample_flashcard_deck(self):
    return {
        "type": "flashcard_deck",
        "title": "Debug Deck - N5 Verbs",
        "metadata": {
            "level": "N5",
            "skill": "vocabulary",
            "cardCount": 5,
            "estimatedTime": "10 min"
        },
        "data": {
            "description": "Debug flashcard deck with 5 sample cards",
            "cards": [
                {"id": "d1", "front": "食べる", "back": "to eat"},
                {"id": "d2", "front": "飲む", "back": "to drink"},
                {"id": "d3", "front": "見る", "back": "to see"},
                {"id": "d4", "front": "聞く", "back": "to listen"},
                {"id": "d5", "front": "読む", "back": "to read"},
            ]
        },
        "actions": {
            "canSaveToLibrary": True,
            "canEditBeforeSave": True
        }
    }
```

#### 3. Quiz (Inline, 3-5 questions)

```python
def _sample_quiz(self):
    return {
        "type": "quiz",
        "title": "Debug Quiz - Grammar",
        "metadata": {
            "level": "N4",
            "skill": "grammar",
            "questionCount": 3,
            "passingScore": 60
        },
        "data": {
            "description": "Debug quiz with 3 questions",
            "showExplanations": True,
            "questions": [
                {
                    "id": "q1",
                    "type": "multiple_choice",
                    "content": "What does 〜たら mean?",
                    "options": [
                        {"id": "a", "text": "If/When"},
                        {"id": "b", "text": "Because"},
                        {"id": "c", "text": "But"},
                        {"id": "d", "text": "And"}
                    ],
                    "correctAnswer": "a",
                    "explanation": "〜たら is conditional"
                },
                {
                    "id": "q2",
                    "type": "multiple_choice",
                    "content": "Choose correct: 雨___降ったら...",
                    "options": [
                        {"id": "a", "text": "が"},
                        {"id": "b", "text": "を"},
                        {"id": "c", "text": "に"},
                        {"id": "d", "text": "で"}
                    ],
                    "correctAnswer": "a",
                    "explanation": "雨が is the subject"
                },
                {
                    "id": "q3",
                    "type": "multiple_choice",
                    "content": "〜ても means?",
                    "options": [
                        {"id": "a", "text": "Even if"},
                        {"id": "b", "text": "When"},
                        {"id": "c", "text": "While"},
                        {"id": "d", "text": "Before"}
                    ],
                    "correctAnswer": "a",
                    "explanation": "〜ても = even if"
                }
            ]
        },
        "actions": {
            "canStartInline": True,
            "canSaveToLibrary": True
        }
    }
```

#### 4. Exam (Full, navigate to page)

```python
def _sample_exam(self):
    return {
        "type": "exam",
        "title": "Debug Exam - N3 Full Practice",
        "metadata": {
            "level": "N3",
            "skill": "mixed",
            "questionCount": 10,
            "timeLimitMinutes": 15,
            "sections": ["vocabulary", "grammar"]
        },
        "data": {
            "description": "Debug exam with timer and sections",
            "passingScore": 60,
            "sections": [
                {
                    "name": "Vocabulary",
                    "questions": [
                        {"id": "e1", "type": "multiple_choice", "content": "影響 means?", 
                         "options": [{"id": "a", "text": "influence"}, {"id": "b", "text": "shadow"}],
                         "correctAnswer": "a", "explanation": "影響 = influence"},
                        {"id": "e2", "type": "multiple_choice", "content": "関係 means?",
                         "options": [{"id": "a", "text": "relationship"}, {"id": "b", "text": "gate"}],
                         "correctAnswer": "a", "explanation": "関係 = relationship"}
                    ]
                },
                {
                    "name": "Grammar",
                    "questions": [
                        {"id": "e3", "type": "multiple_choice", "content": "〜ばかり means?",
                         "options": [{"id": "a", "text": "just did"}, {"id": "b", "text": "will do"}],
                         "correctAnswer": "a", "explanation": "〜ばかり = just did"}
                    ]
                }
            ]
        },
        "actions": {
            "canStartInline": False,
            "canNavigateToExamPage": True,
            "canSaveForLater": True
        }
    }
```

#### 5. Vocabulary List

```python
def _sample_vocabulary(self):
    return {
        "type": "vocabulary",
        "title": "Debug Vocabulary Set",
        "metadata": {
            "level": "N4",
            "category": "nouns"
        },
        "data": {
            "items": [
                {"word": "予約", "reading": "よやく", "definition": "reservation", 
                 "example": "ホテルを予約する。"},
                {"word": "経験", "reading": "けいけん", "definition": "experience",
                 "example": "いい経験になった。"},
                {"word": "準備", "reading": "じゅんび", "definition": "preparation",
                 "example": "旅行の準備をする。"}
            ]
        }
    }
```

#### 6. Mindmap

```python
def _sample_mindmap(self):
    return {
        "type": "mindmap",
        "title": "Debug Mindmap - Japanese Verbs",
        "metadata": {
            "topic": "verbs"
        },
        "data": {
            "root": {"id": "root", "label": "動詞 (Verbs)"},
            "nodes": [
                {"id": "n1", "label": "一段動詞", "parent": "root"},
                {"id": "n2", "label": "五段動詞", "parent": "root"},
                {"id": "n3", "label": "食べる", "parent": "n1"},
                {"id": "n4", "label": "見る", "parent": "n1"},
                {"id": "n5", "label": "飲む", "parent": "n2"},
                {"id": "n6", "label": "書く", "parent": "n2"}
            ]
        }
    }
```

#### 7. Task

```python
def _sample_task(self):
    return {
        "type": "task",
        "title": "Debug Task",
        "metadata": {
            "priority": "medium",
            "category": "study"
        },
        "data": {
            "task": {
                "title": "Review N5 Vocabulary",
                "description": "Study 20 new words from the N5 list",
                "status": "pending",
                "dueDate": None
            }
        }
    }
```

### Debug Mode Activation

```python
# In mock_agent.py

class MockAgent:
    def __init__(self, debug_mode=True):
        self.debug_mode = debug_mode
    
    def generate_response(self, prompt, ...):
        if self.debug_mode or "debug" in prompt.lower():
            return self.generate_debug_response(prompt, ...)
        else:
            return self.generate_normal_response(prompt, ...)
```

### Debug Response Format

```json
{
  "content": "### 🔧 Debug Mode Response\n\n**Request Info:**\n...",
  
  "artifacts": [
    { "type": "flashcard_single", ... },
    { "type": "flashcard_deck", ... },
    { "type": "quiz", ... },
    { "type": "exam", ... },
    { "type": "vocabulary", ... },
    { "type": "mindmap", ... },
    { "type": "task", ... }
  ],
  
  "suggestions": [
    { "text": "Test flashcard single" },
    { "text": "Test quiz submission" },
    { "text": "Test exam launch" }
  ],
  
  "errors": [
    { "code": "ERR_001", "message": "Sample error for testing" }
  ]
}
```

### Testing Workflow

1. Send any message to Hanachan
2. Mock agent returns debug response with ALL artifact types
3. Frontend renders all artifacts
4. Test each UI component:
   - Flip flashcards
   - Add to deck / Create new deck
   - Start quiz inline
   - Launch exam page
   - Save to library
5. Verify error display

---

## Estimated Time: ~4.5 hours

| Phase | Time |
|-------|------|
| MongoDB Setup | 30 min |
| Artifact Service | 1 hr |
| Update Agent Service | 30 min |
| API Routes | 30 min |
| Frontend Service | 30 min |
| Frontend Renderers | 1.5 hr |

---

## Acceptance Criteria

- [ ] Artifacts stored in MongoDB `artifacts` collection
- [ ] Each artifact has `userId` for ownership
- [ ] `metadata` and `data` accept any JSON structure
- [ ] "Save to Library" sets `savedToLibrary: true`
- [ ] User can view saved artifacts in library pages
- [ ] Single cards can be added to existing deck
- [ ] No schema migration needed for new field types
