# Data Models Report: Practice, Quoot, Flashcards

> Generated: 2025-12-26
> This document maps the data flow from Frontend → Backend → Database

---

## 🤖 Content Creator Agent Workflow

The Content Creator Agent generates content via Ollama, which the user can preview, edit, and save.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CONTENT CREATOR FLOW                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   1. USER REQUEST                                                        │
│   ───────────────                                                        │
│   User: "Create N5 vocabulary flashcards about food"                     │
│                                                                          │
│   2. AGENT GENERATION (Ollama)                                           │
│   ────────────────────────────                                           │
│   Ollama receives prompt → Generates JSON content                        │
│   Content matches frontend data model (practice/quoot/flashcard)         │
│                                                                          │
│   3. FRONTEND PREVIEW                                                    │
│   ────────────────────                                                   │
│   User sees generated content in UI                                      │
│   Content is NOT saved yet                                               │
│                                                                          │
│   4. USER EDIT (Optional)                                                │
│   ───────────────────────                                                │
│   User can modify: title, description, cards, questions, etc.            │
│                                                                          │
│   5. SAVE TO PERSONAL LIBRARY                                            │
│   ───────────────────────────                                            │
│   Tags added: ["personal", "ai-generated"]                               │
│   Saved to user's account in database                                    │
│   Available in /practice, /quoot, or /flashcards                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Content States

| State | Location | Tags |
|-------|----------|------|
| **Generated** | Ollama response → Frontend state | (not saved) |
| **Previewing** | Frontend component state | (not saved) |
| **Editing** | Frontend form state | (not saved) |
| **Saved** | Database | `["personal", "ai-generated"]` |

### API Integration

```typescript
// 1. Generate content via Hanachan Agent
POST /hana-api/v1/agent
{
    "prompt": "Create N5 vocabulary flashcards about food",
    "session_id": "...",
    "user_id": "..."
}
// Response includes artifact with generated content

// 2. Save to personal library (Practice)
POST /e-api/v1/jlpt/exams
{
    ...generatedContent,
    "origin": "chatbot",
    "isPublic": false,
    "tags": ["personal", "ai-generated"]
}

// 2. Save to personal library (Flashcard/Quoot)
POST /f-api/v1/decks
{
    ...generatedContent,
    "tags": ["personal", "ai-generated"],
    "createdBy": "user_id"
}
```

---

## 📊 Overview

| Feature | Route | Frontend Types | Backend Model | Database Collection |
|---------|-------|----------------|---------------|---------------------|
| **Practice** | `/practice` | `practice.ts` | `JLPTUserExam.js` | `jlptuserexams` |
| **Quoot** | `/quoot` | `quoot.ts` + `decks.ts` | `deck_models.py` | `decks` (via Flask) |
| **Flashcards** | `/flashcards` | `decks.ts` | `deck_models.py` | `flaskFlashcardDB.decks` |

---

## 1️⃣ PRACTICE (JLPT Exams)

### Frontend Types (`src/types/practice.ts`)

```typescript
// Core Types
type PracticeMode = 'ALL' | 'QUIZ' | 'SINGLE_EXAM' | 'FULL_EXAM';
type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
type SkillType = 'VOCABULARY' | 'GRAMMAR' | 'READING' | 'LISTENING';
type TimerMode = 'UNLIMITED' | 'JLPT_STANDARD' | 'CUSTOM';
type ProtocolOrigin = 'system' | 'chatbot' | 'manual' | 'ai';

// Practice Node (Exam Config)
interface PracticeNode {
    id: string;
    title: string;
    description: string;
    mode: PracticeMode;
    tags: {
        level: JLPTLevel | 'ALL';
        skills: SkillType[];
        origin: ProtocolOrigin;
        timerMode?: TimerMode;
    };
    stats: {
        questionCount: number;
        timeLimitMinutes?: number;
    };
}

// Question
interface Question {
    id: string;
    type: 'MULTIPLE_CHOICE' | 'READING_PASSAGE' | 'LISTENING';
    content: string;
    passage?: string;
    audioUrl?: string;
    options: QuestionOption[];
    correctOptionId: string;
    explanation: string;
}

interface QuestionOption {
    id: string;
    text: string;
}

// User Created Exam (stored in DB)
interface UserCreatedExam {
    id: string;
    userId: string;
    config: PracticeNode;
    questions: Question[];
    createdAt: string;
    updatedAt: string;
    timesAttempted: number;
    isPublic: boolean;
    averageScore?: number;
}
```

### Backend Model (`backend/express/models/JLPTUserExam.js`)

```javascript
const jlptUserExamSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    config: {
        mode: {
            type: String,
            enum: ['QUIZ', 'SINGLE_EXAM', 'FULL_EXAM'],
            required: true
        },
        title: { type: String, required: true },
        description: String,
        level: {
            type: String,
            enum: ['N5', 'N4', 'N3', 'N2', 'N1'],
            required: true
        },
        skills: [String],
        questionCount: Number,
        timerMode: String,
        timeLimitMinutes: Number
    },
    questions: [mongoose.Schema.Types.Mixed],
    origin: {
        type: String,
        enum: ['manual', 'chatbot'],
        default: 'manual'
    },
    isPublic: { type: Boolean, default: false },
    timesAttempted: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 }
}, { timestamps: true });
```

### Database Document (MongoDB: `hanabira.jlptuserexams`)

```json
{
    "_id": "ObjectId(\"...\")",
    "userId": "ObjectId(\"...\")",
    "config": {
        "mode": "QUIZ",
        "title": "N5 Vocabulary Practice",
        "description": "Practice N5 vocabulary",
        "level": "N5",
        "skills": ["VOCABULARY"],
        "questionCount": 10,
        "timerMode": "RELAXED",
        "timeLimitMinutes": 10
    },
    "questions": [
        {
            "id": "q1",
            "type": "VOCABULARY",
            "content": "What is the reading of 食べる?",
            "options": [
                {"id": "a", "text": "たべる"},
                {"id": "b", "text": "のべる"},
                {"id": "c", "text": "あべる"},
                {"id": "d", "text": "さべる"}
            ],
            "correctOptionId": "a",
            "explanation": "食べる (たべる) means 'to eat'"
        }
    ],
    "origin": "chatbot",
    "isPublic": true,
    "timesAttempted": 0,
    "averageScore": 0,
    "createdAt": "2025-12-26T00:00:00.000Z",
    "updatedAt": "2025-12-26T00:00:00.000Z"
}
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/e-api/v1/jlpt/exams` | List user's exams |
| GET | `/e-api/v1/jlpt/exams?is_public=true` | List public exams |
| GET | `/e-api/v1/jlpt/exams/:id` | Get exam by ID |
| POST | `/e-api/v1/jlpt/exams` | Create exam |
| POST | `/e-api/v1/jlpt/attempts` | Save attempt |

---

## 2️⃣ QUOOT (Vocabulary Game)

### Frontend Types (`src/types/quoot.ts`)

```typescript
type QuootCategory = 'VOCABULARY' | 'KANJI' | 'GRAMMAR' | 'PHRASES' | 'MIXED';
type QuootMode = 'CLASSIC' | 'SPEED' | 'ENDLESS' | 'DAILY_CHALLENGE';

// Deck
interface QuootDeck {
    id: string;
    title: string;
    description: string;
    cardCount: number;
    level?: JLPTLevel;
    category: QuootCategory;
    coverEmoji?: string;
    coverColor?: string;
    isPublic: boolean;
    createdBy?: string;
    playCount?: number;
    avgScore?: number;
}

// Card
interface QuootCard {
    id: string;
    front: string;              // Japanese term
    back: string;               // English meaning
    furigana?: string;          // Reading
    hint?: string;
    audioUrl?: string;
    wrongOptions?: string[];    // Distractors
}

// Game Config
interface QuootConfig {
    mode: QuootMode;
    cardCount: number;
    timePerCardSeconds: number;
    enableSRS: boolean;
    enablePowerups: boolean;
    shuffleCards: boolean;
    lives?: number;
}

// Game Result
interface QuootResult {
    sessionId: string;
    deckId: string;
    deckTitle: string;
    mode: QuootMode;
    totalScore: number;
    accuracy: number;
    correctAnswers: number;
    incorrectAnswers: number;
    maxStreak: number;
    totalTimeSeconds: number;
    weakCards: QuootCard[];
}
```

### Frontend Types (Shared Deck - `src/types/decks.ts`)

```typescript
interface DeckCard {
    _id: string;
    front: string;
    back: string;
    sub_detail?: string;        // Reading/furigana
    type: string;               // 'vocabulary', 'kanji', etc.
    extra_data?: {
        audio?: string;
        example_sentence?: string;
        example_word?: string;
        p_tag?: string;
        s_tag?: string;
    };
}

interface Deck {
    _id: string;
    title: string;
    description?: string;
    tags: string[];
    cards: DeckCard[];
    level?: string;
    icon?: string;
}
```

### Backend Model (`backend/flask/modules/deck_models.py`)

```python
class DeckCard(BaseModel):
    id: str = Field(alias='_id')
    front: str
    back: str
    sub_detail: Optional[str] = None  # Reading for Kanji, Romaji for Vocab
    type: str = "vocabulary"          # 'kanji', 'vocabulary', 'sentence'
    extra_data: Dict[str, Any] = {}   # Audio, examples, etc.

class Deck(BaseModel):
    id: str = Field(alias='_id')      # e.g. 'vocab-essential-verbs-1'
    title: str
    description: Optional[str] = ""
    tags: List[str] = []
    cards: List[DeckCard] = []
    level: Optional[str] = "Beginner"
    icon: Optional[str] = "book"
```

### Database Document (MongoDB via Flask)

```json
{
    "_id": "vocab-essential-verbs-1",
    "title": "Essential Verbs Vol. 1",
    "description": "Core 600 Essential Japanese Verbs",
    "tags": ["vocabulary", "verbs", "essential", "beginner"],
    "level": "Beginner",
    "icon": "book",
    "cards": [
        {
            "_id": "card_001",
            "front": "食べる",
            "back": "to eat",
            "sub_detail": "たべる",
            "type": "vocabulary",
            "extra_data": {
                "audio": "/audio/taberu.mp3",
                "example_sentence": "ごはんを食べる。",
                "p_tag": "essential_600_verbs",
                "s_tag": "verbs-1"
            }
        }
    ]
}
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/f-api/v1/decks` | List all decks |
| GET | `/f-api/v1/decks/:id` | Get deck with cards |

---

## 3️⃣ FLASHCARDS

### Frontend Types (same as Quoot - `src/types/decks.ts`)

```typescript
// Uses same Deck/DeckCard types as Quoot
interface DeckCard {
    _id: string;
    front: string;
    back: string;
    sub_detail?: string;
    type: string;
    extra_data?: {
        audio?: string;
        example_sentence?: string;
        [key: string]: any;
    };
}

interface Deck {
    _id: string;
    title: string;
    description?: string;
    tags: string[];
    cards: DeckCard[];
    level?: string;
    icon?: string;
}
```

### Backend Model (Same `deck_models.py`)

Flashcards use the same Deck model as Quoot, but stored in a different collection for user-specific cards with SRS state.

### Additional Flashcard Service Types

```typescript
// Personal card creation
interface CreateCardPayload {
    front: string;
    back: string;
    type: 'kanji' | 'vocabulary' | 'grammar';
    deck_name?: string;
    tags?: string[];
}

// SRS Study
interface StudyCard extends DeckCard {
    nextReview: Date;
    interval: number;
    easeFactor: number;
    reviewCount: number;
}
```

### Database Document (MongoDB: `flaskFlashcardDB.flashcardstates`)

```json
{
    "_id": "ObjectId(\"...\")",
    "userId": "user_123",
    "cardId": "card_001",
    "front": "食べる",
    "back": "to eat",
    "type": "vocabulary",
    "deck_name": "Essential Verbs",
    "interval": 1,
    "easeFactor": 2.5,
    "nextReview": "2025-12-27T00:00:00.000Z",
    "reviewCount": 3,
    "difficulty": "normal",
    "tags": ["vocabulary", "N5"],
    "createdAt": "2025-12-01T00:00:00.000Z"
}
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/f-api/v1/decks` | List decks |
| GET | `/f-api/v1/study/due` | Get due cards for SRS |
| POST | `/f-api/v1/cards/personal` | Create personal card |
| POST | `/f-api/v1/study/answer` | Submit SRS answer |
| PUT | `/f-api/v1/cards/personal/:id` | Update card |
| DELETE | `/f-api/v1/cards/personal/:id` | Delete card |

---

## 🔄 Data Flow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRACTICE                                  │
├─────────────────────────────────────────────────────────────────┤
│  Frontend                   Backend                  Database   │
│  ─────────                   ───────                  ────────   │
│  practice.ts        →    JLPTUserExam.js     →    jlptuserexams │
│  jlptService.ts          jlptRoutes.js                          │
│                                                                  │
│  PracticeNode      →     config object        →   config: {...} │
│  Question[]        →     questions[]          →   questions[]   │
│  UserCreatedExam   →     full schema          →   document      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         QUOOT                                    │
├─────────────────────────────────────────────────────────────────┤
│  Frontend                   Backend                  Database   │
│  ─────────                   ───────                  ────────   │
│  quoot.ts           →    deck_models.py      →    decks         │
│  decks.ts                 decks.py                               │
│  deckService.ts                                                  │
│                                                                  │
│  QuootDeck         →     Deck                →   deck document  │
│  QuootCard         →     DeckCard            →   card in cards[]│
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       FLASHCARDS                                 │
├─────────────────────────────────────────────────────────────────┤
│  Frontend                   Backend                  Database   │
│  ─────────                   ───────                  ────────   │
│  decks.ts           →    deck_models.py      →    decks         │
│  flashcardService.ts     flashcards.py           flashcardstates│
│                                                                  │
│  Deck              →     Deck                →   deck document  │
│  DeckCard          →     DeckCard            →   card + SRS     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Content Creator JSON Templates

### Practice Exam

```json
{
    "type": "practice",
    "config": {
        "mode": "QUIZ",
        "title": "AI Generated N5 Quiz",
        "description": "Practice vocabulary",
        "level": "N5",
        "skills": ["VOCABULARY"],
        "questionCount": 10,
        "timerMode": "RELAXED",
        "timeLimitMinutes": 10
    },
    "questions": [
        {
            "id": "q1",
            "type": "VOCABULARY",
            "content": "What is the reading of 食べる?",
            "options": [
                {"id": "a", "text": "たべる"},
                {"id": "b", "text": "のべる"},
                {"id": "c", "text": "あべる"},
                {"id": "d", "text": "さべる"}
            ],
            "correctOptionId": "a",
            "explanation": "食べる (たべる) means 'to eat'"
        }
    ],
    "origin": "chatbot",
    "isPublic": true
}
```

### Quoot Deck

```json
{
    "type": "quoot",
    "_id": "ai-vocab-n5-food",
    "title": "N5 Food Vocabulary",
    "description": "Learn food words in Japanese",
    "tags": ["vocabulary", "N5", "food"],
    "level": "Beginner",
    "cards": [
        {
            "_id": "card-1",
            "front": "食べ物",
            "back": "food",
            "sub_detail": "たべもの",
            "type": "vocabulary",
            "extra_data": {
                "example_sentence": "日本の食べ物が好きです。"
            }
        }
    ]
}
```

### Flashcard Deck

```json
{
    "type": "flashcard",
    "_id": "ai-flashcard-n5-verbs",
    "title": "N5 Essential Verbs",
    "description": "Common N5 verbs with readings",
    "tags": ["vocabulary", "N5", "verbs"],
    "level": "Beginner",
    "cards": [
        {
            "_id": "card-1",
            "front": "食べる (たべる)",
            "back": "to eat",
            "sub_detail": "たべる",
            "type": "vocabulary",
            "extra_data": {
                "example_sentence": "ごはんを食べる。"
            }
        }
    ]
}
```

---

## 📁 File References

### Frontend
- `frontend-next/src/types/practice.ts` - Practice types
- `frontend-next/src/types/quoot.ts` - Quoot game types
- `frontend-next/src/types/decks.ts` - Deck/Card types
- `frontend-next/src/services/jlptService.ts` - Practice API client
- `frontend-next/src/services/deckService.ts` - Deck API client
- `frontend-next/src/services/flashcardService.ts` - Flashcard API client

### Backend (Express)
- `backend/express/models/JLPTUserExam.js` - Practice model
- `backend/express/routes/jlptRoutes.js` - Practice routes

### Backend (Flask)
- `backend/flask/modules/deck_models.py` - Deck/Card models
- `backend/flask/modules/decks.py` - Deck routes
- `backend/flask/modules/flashcards.py` - Flashcard routes + SRS

### Database Collections
- `hanabira.jlptuserexams` - Practice exams
- `zenRelationshipsAutomated.words` - Vocabulary source data
- `flaskFlashcardDB.decks` - Flashcard decks
- `flaskFlashcardDB.flashcardstates` - User SRS state
