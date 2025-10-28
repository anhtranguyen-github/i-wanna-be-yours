# Database Schema Reference

Visual schemas and entity relationships for Hanabira.org MongoDB databases.

---

## Table of Contents

1. [Database Structure Overview](#database-structure-overview)
2. [Express Backend Schemas](#express-backend-schemas)
3. [Flask Backend Schemas](#flask-backend-schemas)
4. [Dictionary Backend Schemas](#dictionary-backend-schemas)
5. [Entity Relationships](#entity-relationships)
6. [Data Flow Diagrams](#data-flow-diagrams)

---

## Database Structure Overview

```
MongoDB Instance (localhost:27017)
│
├── Express Backend Databases
│   └── zenRelationshipsAutomated
│       ├── words ⭐
│       ├── tanoswords
│       ├── sentences ⭐
│       ├── grammars ⭐
│       ├── vngrammars
│       ├── cngrammars
│       ├── krgrammars
│       ├── thgrammars
│       ├── kanji ⭐
│       └── reading
│
├── Flask Backend Databases
│   ├── flaskFlashcardDB
│   │   ├── kanji ⭐
│   │   ├── words ⭐
│   │   └── grammars ⭐
│   │
│   ├── mecabWords
│   │   └── mecab_words ⭐
│   │
│   ├── sentenceMining
│   │   └── vocabulary ⭐
│   │
│   ├── library
│   │   ├── texts
│   │   └── videos
│   │
│   ├── login_db
│   │   └── logins
│   │
│   └── email_db
│       └── emails
│
└── Dictionary Backend Databases
    ├── jmdictDatabase
    │   └── (JMDict collections)
    │
    ├── jitendexDatabase
    │   └── (Jitendex collections)
    │
    ├── flashcardDB (legacy)
    │   └── flashcardstates
    │
    └── sourceDB (legacy)
        ├── kanji
        ├── vocabulary
        ├── grammar
        └── reading
```

⭐ = Core production collections

---

## Express Backend Schemas

### Database: zenRelationshipsAutomated

#### Collection: words

```javascript
{
  _id: ObjectId,                           // Auto-generated
  vocabulary_original: String,              // Required, Unique, e.g., "行く_"
  vocabulary_simplified: String,            // e.g., "いく"
  vocabulary_english: String,               // Required, e.g., "to go"
  vocabulary_audio: String,                 // Path: "/audio/vocab/v_行く.mp3"
  word_type: String,                       // e.g., "Verb", "Noun", "Adjective"
  p_tag: String,                           // e.g., "JLPT_N5", "essential_600_verbs"
  s_tag: String,                           // e.g., "100", "verbs-1"
  sentences: [ObjectId],                   // References to 'sentences' collection
  __v: Number                              // Mongoose version key
}

// Indexes
words.createIndex({ vocabulary_original: 1 }, { unique: true })
words.createIndex({ p_tag: 1, s_tag: 1 })
```

**Example Document:**
```json
{
  "_id": "65eca95e43a799eec83434e1",
  "vocabulary_original": "行く_",
  "vocabulary_simplified": "いく",
  "vocabulary_english": "to go",
  "vocabulary_audio": "/audio/vocab/v_行く.mp3",
  "word_type": "Verb",
  "p_tag": "JLPT_N5",
  "s_tag": "100",
  "sentences": ["65eca95f43a799eec8343dc8", "65eca95f43a799eec8343dc9"],
  "__v": 0
}
```

---

#### Collection: sentences

```javascript
{
  _id: ObjectId,                           // Auto-generated
  sentence_original: String,               // Required, Unique, Japanese text
  sentence_simplified: String,             // Simplified/kana version
  sentence_romaji: String,                 // Romanization
  sentence_english: String,                // Required, English translation
  sentence_audio: String,                  // Path to audio file
  sentence_picture: String,                // Path to image (optional)
  key: String,                            // Required, Links to vocabulary
  __v: Number
}

// Indexes
sentences.createIndex({ sentence_original: 1 }, { unique: true })
sentences.createIndex({ key: 1 })
```

**Example Document:**
```json
{
  "_id": "65eca95f43a799eec8343dc8",
  "sentence_original": "学校に行きます。",
  "sentence_simplified": "がっこうにいきます。",
  "sentence_romaji": "Gakkō ni ikimasu.",
  "sentence_english": "I go to school.",
  "sentence_audio": "/audio/sentences/s_行く_20231231_学校に行きます.mp3",
  "sentence_picture": "",
  "key": "行く_",
  "__v": 0
}
```

---

#### Collection: grammars (Japanese)

```javascript
{
  _id: ObjectId,
  title: String,                           // Required, Unique, e.g., "～から～にかけて"
  short_explanation: String,                // Required, Brief explanation
  long_explanation: String,                 // Required, Detailed explanation
  formation: String,                        // Required, Grammar structure
  examples: [                              // Array of example objects
    {
      jp: String,                          // Required, Japanese example
      romaji: String,                      // Required, Romanization
      en: String,                          // Required, English translation
      grammar_audio: String                // Path to audio
    }
  ],
  p_tag: String,                           // e.g., "JLPT_N3"
  s_tag: String,                           // e.g., "10"
  __v: Number
}

// Indexes
grammars.createIndex({ title: 1 }, { unique: true })
grammars.createIndex({ p_tag: 1, s_tag: 1 })
```

**Example Document:**
```json
{
  "_id": "65da44a5a033d2048bd1e4ce",
  "title": "～から～にかけて (〜kara 〜ni kakete)",
  "short_explanation": "From...to, spanning a period or area",
  "long_explanation": "Used to indicate a range from one point to another...",
  "formation": "Noun + から + Noun + にかけて",
  "examples": [
    {
      "jp": "夏から秋にかけて、この地域は雨が多い。",
      "romaji": "Natsu kara aki ni kakete, kono chiiki wa ame ga ōi.",
      "en": "From summer to autumn, this region has a lot of rain.",
      "grammar_audio": "/audio/grammar/g_からにかけて_001.mp3"
    }
  ],
  "p_tag": "JLPT_N3",
  "s_tag": "10",
  "__v": 0
}
```

---

#### Collection: kanji

```javascript
{
  _id: ObjectId,
  kanji: String,                           // Single kanji character
  reading: String,                         // Kanji reading (katakana)
  k_audio: String,                         // Kanji pronunciation audio
  exampleWord: String,                     // Example word using this kanji
  exampleReading: String,                  // Reading of example word
  translation: String,                     // English meaning
  audio: String,                           // Example word audio
  p_tag: String,                           // e.g., "JLPT_N3"
  s_tag: String,                           // e.g., "part_1"
  __v: Number
}

// Indexes
kanji.createIndex({ kanji: 1, p_tag: 1, s_tag: 1 })
```

**Example Document:**
```json
{
  "_id": "65da44a5a033d2048bd1e4ce",
  "kanji": "駐",
  "reading": "チュウ",
  "k_audio": "/audio/japanese/kanji/k_駐.mp3",
  "exampleWord": "駐車",
  "exampleReading": "ちゅうしゃ",
  "translation": "parking",
  "audio": "/audio/japanese/kanji/v_駐車.mp3",
  "p_tag": "JLPT_N3",
  "s_tag": "part_1",
  "__v": 0
}
```

---

#### Collection: reading

```javascript
{
  _id: ObjectId,
  key: String,                             // Unique identifier
  title: String,                           // Reading title
  titleRomaji: String,                     // Romanized title
  titleJp: String,                         // Japanese title
  p_tag: String,
  s_tag: String,
  textAudio: String,                       // Main audio file
  textAudio_1: String,                     // Alternate audio
  textAudioEn: String,                     // English audio
  textAudioEn_1: String,                   // Alternate English audio
  japaneseText: [String],                  // Array of Japanese sentences
  romanizedText: [String],                 // Array of romanized sentences
  englishTranslation: [String],            // Array of English translations
  readingVocabulary: [String],             // Vocabulary list (Japanese)
  readingVocabularyEn: [String],           // Vocabulary list (English)
  readingGrammar: [String],                // Grammar points (Japanese)
  readingGrammarEn: [String],              // Grammar points (English)
  sentencePayload: [                       // Detailed sentence breakdown
    {
      japanese: String,
      romanization: String,
      translation: String,
      audioPath: String,
      audioPathEn: String
    }
  ],
  __v: Number
}

// Indexes
reading.createIndex({ key: 1 }, { unique: true })
reading.createIndex({ p_tag: 1, s_tag: 1 })
```

---

## Flask Backend Schemas

### Database: flaskFlashcardDB

#### Collection: kanji

```python
{
  _id: ObjectId,
  userId: String,                          # User identifier
  difficulty: String,                      # 'easy', 'medium', 'hard', 'unknown'
  kanji: String,                          # Single kanji character
  p_tag: String,                          # e.g., 'JLPT_N3'
  s_tag: String                           # e.g., 'part_1'
}

# Indexes
kanji.create_index([('userId', 1), ('kanji', 1), ('p_tag', 1), ('s_tag', 1)])
```

**Example Document:**
```json
{
  "_id": "65f123abc456789def012345",
  "userId": "user123",
  "difficulty": "medium",
  "kanji": "駐",
  "p_tag": "JLPT_N3",
  "s_tag": "part_1"
}
```

**Note:** This collection stores ONLY user-specific progress. Full kanji data is fetched from `zenRelationshipsAutomated.kanji` and merged at runtime.

---

#### Collection: words

```python
{
  _id: ObjectId,
  userId: String,
  difficulty: String,                      # 'easy', 'medium', 'hard', 'unknown'
  vocabulary_original: String,             # e.g., '行く_'
  p_tag: String,
  s_tag: String
}

# Indexes
words.create_index([('userId', 1), ('vocabulary_original', 1), ('p_tag', 1), ('s_tag', 1)])
```

---

#### Collection: grammars

```python
{
  _id: ObjectId,
  userId: String,
  difficulty: String,
  title: String,                          # Grammar point title
  p_tag: String,
  s_tag: String
}

# Indexes
grammars.create_index([('userId', 1), ('title', 1), ('p_tag', 1), ('s_tag', 1)])
```

---

### Database: mecabWords

#### Collection: mecab_words

```python
{
  _id: ObjectId,
  userId: String,                          # User identifier
  original: String,                        # Word as it appears in text
  dictionary: String,                      # Dictionary form
  furigana: String,                       # Reading/pronunciation
  status: String                          # 'seen', 'known', 'learning', 'unknown'
}

# Indexes
mecab_words.create_index([('userId', 1), ('original', 1)])
```

**Example Document:**
```json
{
  "_id": "65f234bcd567890ef123456",
  "userId": "user123",
  "original": "行き",
  "dictionary": "行く",
  "furigana": "いき",
  "status": "known"
}
```

**Purpose:** Used by text parser to color-code words based on user's knowledge level.

---

### Database: sentenceMining

#### Collection: vocabulary

```python
{
  _id: ObjectId,
  userId: String,
  difficulty: String,                      # User's difficulty rating
  p_tag: String,                          # e.g., 'sentence_mining'
  s_tag: String,                          # e.g., 'custom_1'
  lang: String,                           # Language code
  vocabulary_original: String,             # Original form
  vocabulary_simplified: String,           # Simplified form
  vocabulary_english: String,              # English translation
  vocabulary_audio: String,                # Audio file path
  word_type: String,                      # Part of speech
  notes: String,                          # User's notes
  sentences: [                            # Array of example sentences
    {
      sentence_original: String,
      sentence_simplified: String,
      sentence_romaji: String,
      sentence_english: String,
      sentence_audio: String,
      sentence_picture: String
    }
  ]
}

# Indexes
vocabulary.create_index([('userId', 1), ('p_tag', 1), ('s_tag', 1)])
vocabulary.create_index([('_id', 1)])
```

**Example Document:**
```json
{
  "_id": "65f345cde678901f234567",
  "userId": "user123",
  "difficulty": "medium",
  "p_tag": "sentence_mining",
  "s_tag": "custom_1",
  "lang": "ja",
  "vocabulary_original": "興味深い",
  "vocabulary_simplified": "きょうみぶかい",
  "vocabulary_english": "interesting, fascinating",
  "vocabulary_audio": "",
  "word_type": "Adjective",
  "notes": "Found in article about AI",
  "sentences": [
    {
      "sentence_original": "これは興味深い話題です。",
      "sentence_simplified": "これはきょうみぶかいわだいです。",
      "sentence_romaji": "Kore wa kyōmibukai wadai desu.",
      "sentence_english": "This is an interesting topic.",
      "sentence_audio": "",
      "sentence_picture": ""
    }
  ]
}
```

---

### Database: library

#### Collection: texts

```python
{
  _id: ObjectId,
  userId: String,
  topic: String,                          # Text topic/title
  sourceLink: String,                     # Source URL
  actualText: String,                     # Full text content
  p_tag: String,
  s_tag: String,
  lang: String                           # Language code
}

# Indexes
texts.create_index([('userId', 1)])
```

---

#### Collection: videos

```python
{
  _id: ObjectId,
  userId: String,
  url: String,                           # Video URL (YouTube, etc.)
  customTitle: String,                   # User's title
  customDescription: String,              # User's description
  p_tag: String,
  s_tag: String,
  lang: String
}

# Indexes
videos.create_index([('userId', 1)])
```

---

### Database: login_db

#### Collection: logins

```python
{
  _id: ObjectId,
  userId: String,
  date: String,                          # Format: 'YYYY-MM-DD'
  count: Number                          # Login count for this date
}

# Indexes
logins.create_index([('userId', 1), ('date', 1)])
```

**Example Document:**
```json
{
  "_id": "65f456def789012345678",
  "userId": "user123",
  "date": "2025-10-23",
  "count": 3
}
```

---

### Database: email_db

#### Collection: emails

```python
{
  _id: ObjectId,
  email: String                          # Email address
}
```

---

## Entity Relationships

### 1. Word → Sentences Relationship

```
┌─────────────────────────────────┐
│  zenRelationshipsAutomated.words │
├─────────────────────────────────┤
│  _id: ObjectId                   │
│  vocabulary_original: "行く_"    │
│  sentences: [                    │───┐
│    ObjectId("...dc8"),          │   │
│    ObjectId("...dc9")           │   │
│  ]                              │   │
└─────────────────────────────────┘   │
                                      │
                                      │ Reference
                                      │
                                      ▼
            ┌──────────────────────────────────────┐
            │ zenRelationshipsAutomated.sentences  │
            ├──────────────────────────────────────┤
            │ _id: ObjectId("...dc8")              │
            │ sentence_original: "学校に行きます。"  │
            │ sentence_english: "I go to school."  │
            │ key: "行く_"                         │
            └──────────────────────────────────────┘
```

**Relationship Type:** One-to-Many (One word has many sentences)  
**Implementation:** Array of ObjectIds in `words.sentences`

---

### 2. User Progress → Static Content Relationship

```
User Makes Flashcard Request
         │
         ▼
┌────────────────────────────┐
│ flaskFlashcardDB.kanji     │
├────────────────────────────┤
│ userId: "user123"          │
│ kanji: "駐"                │
│ difficulty: "medium"       │◄─────┐
│ p_tag: "JLPT_N3"          │      │
│ s_tag: "part_1"           │      │
└────────────────────────────┘      │
         │                          │
         │ Matches on:              │
         │ - kanji                  │
         │ - p_tag                  │
         │ - s_tag                  │
         │                          │
         ▼                          │
┌────────────────────────────┐      │
│ zenRelationshipsAutomated  │      │
│        .kanji              │      │
├────────────────────────────┤      │
│ kanji: "駐"                │      │
│ reading: "チュウ"          │      │
│ exampleWord: "駐車"        │      │
│ translation: "parking"     │      │
│ audio: "/audio/..."        │      │
│ p_tag: "JLPT_N3"          │      │
│ s_tag: "part_1"           │──────┘
└────────────────────────────┘
         │
         ▼
┌────────────────────────────┐
│   MERGED RESULT            │
├────────────────────────────┤
│ userId: "user123"          │
│ difficulty: "medium"       │
│ kanji: "駐"                │
│ reading: "チュウ"          │
│ exampleWord: "駐車"        │
│ translation: "parking"     │
│ audio: "/audio/..."        │
│ p_tag: "JLPT_N3"          │
│ s_tag: "part_1"           │
└────────────────────────────┘
```

**Relationship Type:** Logical Join (not enforced by database)  
**Implementation:** Application-level merge in Flask backend

---

### 3. User Vocabulary Knowledge Relationship

```
User Reads Text
         │
         ▼
┌────────────────────────────┐
│ mecabWords.mecab_words     │
├────────────────────────────┤
│ userId: "user123"          │
│ original: "行き"           │
│ dictionary: "行く"         │
│ status: "known"            │
└────────────────────────────┘
         │
         │ Used to color-code
         │ text in parser
         ▼
┌────────────────────────────┐
│ Frontend Display           │
├────────────────────────────┤
│ Text: "学校に行きます"      │
│                            │
│ 学校 - unknown (red)       │
│ に - seen (yellow)         │
│ 行き - known (green)       │
│ ます - known (green)       │
└────────────────────────────┘
```

---

## Data Flow Diagrams

### Flashcard Study Session Flow

```
┌──────────┐
│  User    │
└────┬─────┘
     │ 1. Request flashcards
     │    (userId, p_tag, s_tag)
     ▼
┌─────────────────────────────────────┐
│  Flask Backend (port 5100)          │
│                                     │
│  /f-api/v1/combine-flashcard-data  │
└─────────┬───────────────────────────┘
          │
          │ 2. Fetch user progress
          ▼
┌──────────────────────────┐
│  flaskFlashcardDB.kanji  │
│  [userId, difficulty]    │
└─────────┬────────────────┘
          │
          │ 3. Request static content
          ▼
┌──────────────────────────────────┐
│  Express Backend (port 8000)     │
│  /e-api/v1/kanji                 │
└─────────┬────────────────────────┘
          │
          │ 4. Fetch static data
          ▼
┌────────────────────────────────────┐
│  zenRelationshipsAutomated.kanji   │
│  [full kanji data]                 │
└─────────┬──────────────────────────┘
          │
          │ 5. Return static data
          ▼
┌──────────────────────────────────┐
│  Flask Backend                    │
│  - Merge static + user data       │
│  - Apply SRS algorithm            │
│  - Adjust frequency by difficulty │
│  - Shuffle cards                  │
└─────────┬────────────────────────┘
          │
          │ 6. Return flashcard deck
          ▼
┌──────────────────────────────────┐
│  Frontend (Next.js)               │
│  - Display flashcard              │
│  - Capture user response          │
└─────────┬────────────────────────┘
          │
          │ 7. Update difficulty
          │    (POST difficulty change)
          ▼
┌──────────────────────────────────┐
│  Flask Backend                    │
│  /f-api/v1/flashcard              │
│  - Update user's difficulty       │
└─────────┬────────────────────────┘
          │
          │ 8. Save progress
          ▼
┌──────────────────────────┐
│  flaskFlashcardDB.kanji  │
│  [update difficulty]     │
└──────────────────────────┘
```

---

### Text Parser with Vocabulary Highlighting Flow

```
┌──────────┐
│  User    │
└────┬─────┘
     │ 1. Submit text for parsing
     │    (userId, text)
     ▼
┌─────────────────────────────────────┐
│  Frontend (Next.js)                 │
│  - Tokenize text (Mecab)            │
│  - Extract words                    │
└─────────┬───────────────────────────┘
          │
          │ 2. Enhance vocabulary
          │    POST /f-api/v1/enhance-vocabulary
          │    { userId, data: [[{original, dictionary, furigana}]] }
          ▼
┌──────────────────────────────────┐
│  Flask Backend (port 5100)       │
└─────────┬────────────────────────┘
          │
          │ 3. Lookup each word
          ▼
┌──────────────────────────┐
│  mecabWords.mecab_words  │
│  Find by userId + word   │
└─────────┬────────────────┘
          │
          │ 4. Return status for each word
          │    { status: 'known'/'seen'/'unknown' }
          ▼
┌─────────────────────────────────────┐
│  Frontend                           │
│  - Color code words:                │
│    * known → green                  │
│    * seen → yellow                  │
│    * unknown → red                  │
│  - Display to user                  │
└─────────────────────────────────────┘
          │
          │ User clicks word to update status
          ▼
┌──────────────────────────────────┐
│  POST /f-api/v1/user-vocabulary  │
│  { userId, word, status }        │
└─────────┬────────────────────────┘
          │
          │ 5. Update word status
          ▼
┌──────────────────────────┐
│  mecabWords.mecab_words  │
│  Upsert status           │
└──────────────────────────┘
```

---

### Sentence Mining Flow

```
┌──────────┐
│  User    │
└────┬─────┘
     │ 1. Mine new vocabulary
     │    (word + custom sentences)
     ▼
┌─────────────────────────────────────┐
│  Frontend                           │
│  - Enter vocabulary                 │
│  - Add example sentences            │
│  - Add notes                        │
└─────────┬───────────────────────────┘
          │
          │ 2. POST /f-api/v1/store-vocabulary-data
          │    { userId, vocabulary_original, sentences: [...] }
          ▼
┌──────────────────────────────────┐
│  Flask Backend                    │
└─────────┬────────────────────────┘
          │
          │ 3. Store in database
          ▼
┌──────────────────────────────────┐
│  sentenceMining.vocabulary        │
│  - Full vocabulary data           │
│  - User's sentences               │
│  - User's notes                   │
└─────────┬────────────────────────┘
          │
          │ 4. Later: Retrieve for study
          │    GET /f-api/v1/text-parser-words
          ▼
┌──────────────────────────────────┐
│  Frontend                         │
│  - Display as flashcards          │
│  - Use in text parser             │
└───────────────────────────────────┘
```

---

## Schema Evolution & Versioning

### Version Tracking

All Mongoose schemas include a `__v` field for version tracking:
```javascript
{
  _id: ObjectId("..."),
  // ... document fields ...
  __v: 0  // Incremented on each update
}
```

### Schema Changes Log

| Date | Database | Collection | Change | Breaking? |
|------|----------|-----------|--------|-----------|
| Initial | All | All | Initial schema design | N/A |

---

## Indexes Reference

### Critical Indexes (Already Implemented)

```javascript
// zenRelationshipsAutomated.words
db.words.createIndex({ vocabulary_original: 1 }, { unique: true })

// zenRelationshipsAutomated.sentences  
db.sentences.createIndex({ sentence_original: 1 }, { unique: true })

// zenRelationshipsAutomated.grammars
db.grammars.createIndex({ title: 1 }, { unique: true })
```

### Recommended Indexes (Should Add)

```javascript
// Performance optimization
db.words.createIndex({ p_tag: 1, s_tag: 1 })
db.grammars.createIndex({ p_tag: 1, s_tag: 1 })
db.kanji.createIndex({ p_tag: 1, s_tag: 1 })

// User-specific collections
db.flaskFlashcardDB.kanji.createIndex({ userId: 1, p_tag: 1, s_tag: 1 })
db.flaskFlashcardDB.words.createIndex({ userId: 1, p_tag: 1, s_tag: 1 })
db.flaskFlashcardDB.grammars.createIndex({ userId: 1, p_tag: 1, s_tag: 1 })

db.mecabWords.mecab_words.createIndex({ userId: 1, original: 1 })
db.sentenceMining.vocabulary.createIndex({ userId: 1, p_tag: 1, s_tag: 1 })
db.login_db.logins.createIndex({ userId: 1, date: 1 }, { unique: true })
```

---

## Document Size Limits

### MongoDB Document Limits
- **Maximum document size:** 16 MB
- **Maximum nesting depth:** 100 levels

### Current Usage

| Collection | Typical Size | Max Expected |
|-----------|--------------|--------------|
| words | ~500 bytes | 2 KB |
| sentences | ~300 bytes | 1 KB |
| grammars | ~2 KB | 10 KB |
| kanji | ~300 bytes | 500 bytes |
| reading | ~50 KB | 500 KB |
| vocabulary (mined) | ~5 KB | 50 KB |

**Note:** The `reading` collection has large documents due to arrays of text. Consider splitting if documents approach 16 MB.

---

## Data Validation

### Application-Level Validation

**Express Backend (Mongoose):**
```javascript
{
  vocabulary_original: { type: String, unique: true, required: true },
  vocabulary_english: { type: String, required: true }
}
```

**Flask Backend (PyMongo):**
```python
# Validation in application code
if "userId" not in data:
    return jsonify({"error": "userId is missing"}), 400
```

### Recommended Database-Level Validation

```javascript
// Add schema validation
db.createCollection("words", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["vocabulary_original", "vocabulary_english", "p_tag"],
      properties: {
        vocabulary_original: {
          bsonType: "string",
          description: "must be a string and is required"
        },
        vocabulary_english: {
          bsonType: "string",
          description: "must be a string and is required"
        },
        p_tag: {
          bsonType: "string",
          enum: ["JLPT_N5", "JLPT_N4", "JLPT_N3", "JLPT_N2", "JLPT_N1", 
                 "essential_600_verbs", "suru_essential_600_verbs"],
          description: "must be a valid primary tag"
        },
        difficulty: {
          enum: ["easy", "medium", "hard", "unknown"],
          description: "must be a valid difficulty level"
        }
      }
    }
  }
})
```

---

## Summary

This schema reference provides visual and detailed documentation of:

- ✅ 11 MongoDB databases
- ✅ 30+ collections
- ✅ Complete schema definitions
- ✅ Entity relationships
- ✅ Data flow diagrams
- ✅ Index recommendations
- ✅ Validation rules

For API endpoint details and usage examples, see [DATABASE_SUMMARY.md](DATABASE_SUMMARY.md).

---

**Last Updated:** October 23, 2025  
**Document Version:** 1.0

