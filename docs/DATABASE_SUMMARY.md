# Hanabira.org - Database Summary Documentation

## Overview

Hanabira.org is a Japanese language learning platform that uses **MongoDB** as its primary database system. The application follows a microservices architecture with multiple databases serving different purposes across three main backend services:

1. **Express Backend** (port 8000) - Static educational content
2. **Flask Backend** (port 5100) - User-specific dynamic data
3. **Dictionary Backend** (port 5200) - Japanese dictionary services

All databases run on a single MongoDB instance at `mongodb://localhost:27017/`

---

## Database Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    MongoDB Instance                      │
│                 localhost:27017                          │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼────┐      ┌───────▼──────┐    ┌──────▼──────┐
   │ Express │      │    Flask     │    │ Dictionary  │
   │ Backend │      │   Backend    │    │  Backend    │
   │ (8000)  │      │   (5100)     │    │   (5200)    │
   └─────────┘      └──────────────┘    └─────────────┘
        │                   │                   │
        │                   │                   │
   Static DB         User Dynamic DBs      Dict DBs
```

---

## Database Catalog

### 1. zenRelationshipsAutomated (Express Backend)
**Purpose:** Static educational content database  
**Backend:** Express.js (Node.js)  
**Port:** 8000  
**Connection:** Mongoose

#### Collections:

##### 1.1 words
**Schema:**
```javascript
{
  vocabulary_original: String (unique, required),
  vocabulary_simplified: String,
  vocabulary_english: String (required),
  vocabulary_audio: String,
  word_type: String,
  p_tag: String,        // Primary tag (e.g., 'JLPT_N3', 'essential_600_verbs')
  s_tag: String,        // Secondary tag (e.g., '100', 'verbs-1')
  sentences: [ObjectId] // References to Sentence collection
}
```
**Purpose:** Japanese vocabulary with audio, translations, and example sentences  
**Tags:** JLPT N5-N1 levels, essential verbs collections

##### 1.2 tanoswords
**Schema:**
```javascript
{
  // Similar to words collection
  // Vocabulary from Tanos.co.uk JLPT lists
  vocabulary_original: String,
  vocabulary_simplified: String,
  vocabulary_english: String,
  p_tag: String,
  s_tag: String
}
```
**Purpose:** JLPT vocabulary lists from Tanos source

##### 1.3 sentences
**Schema:**
```javascript
{
  sentence_original: String (unique, required),
  sentence_simplified: String,
  sentence_romaji: String,
  sentence_english: String (required),
  sentence_audio: String,
  sentence_picture: String,
  key: String (required)
}
```
**Purpose:** Example sentences for vocabulary words

##### 1.4 grammars (Japanese)
**Schema:**
```javascript
{
  title: String (unique, required),
  short_explanation: String (required),
  long_explanation: String (required),
  formation: String (required),
  examples: [{
    jp: String (required),
    romaji: String (required),
    en: String (required),
    grammar_audio: String
  }],
  p_tag: String,  // e.g., 'JLPT_N3'
  s_tag: String   // e.g., '10'
}
```
**Purpose:** Japanese grammar explanations for JLPT levels

##### 1.5 vngrammars (Vietnamese)
**Schema:** Same as grammars  
**Purpose:** Vietnamese grammar explanations

##### 1.6 cngrammars (Mandarin Chinese)
**Schema:** Same as grammars  
**Purpose:** Mandarin Chinese grammar explanations (HSK levels)

##### 1.7 krgrammars (Korean)
**Schema:** Same as grammars  
**Purpose:** Korean grammar explanations

##### 1.8 thgrammars (Thai)
**Schema:** Same as grammars  
**Purpose:** Thai grammar explanations (CU-TFL levels)

##### 1.9 kanji
**Schema:**
```javascript
{
  kanji: String,
  reading: String,
  k_audio: String,         // Kanji pronunciation audio
  exampleWord: String,
  exampleReading: String,
  translation: String,
  audio: String,           // Example word audio
  p_tag: String,           // e.g., 'JLPT_N3'
  s_tag: String            // e.g., 'part_1'
}
```
**Purpose:** Kanji characters with readings, examples, and audio

##### 1.10 reading
**Schema:**
```javascript
{
  key: String,
  title: String,
  titleRomaji: String,
  titleJp: String,
  p_tag: String,
  s_tag: String,
  textAudio: String,
  textAudio_1: String,
  textAudioEn: String,
  textAudioEn_1: String,
  japaneseText: [String],
  romanizedText: [String],
  englishTranslation: [String],
  readingVocabulary: [String],
  readingVocabularyEn: [String],
  readingGrammar: [String],
  readingGrammarEn: [String],
  sentencePayload: [{
    japanese: String,
    romanization: String,
    translation: String,
    audioPath: String,
    audioPathEn: String
  }]
}
```
**Purpose:** Reading materials with audio and translations

---

### 2. flaskFlashcardDB (Flask Backend)
**Purpose:** User-specific SRS (Spaced Repetition System) flashcard progress  
**Backend:** Flask (Python)  
**Port:** 5100  
**Connection:** PyMongo

#### Collections:

##### 2.1 kanji
**Schema:**
```python
{
  userId: String,
  difficulty: String,      # 'easy', 'medium', 'hard', 'unknown'
  kanji: String,
  p_tag: String,
  s_tag: String
}
```
**Purpose:** Track user's kanji flashcard difficulty/progress

##### 2.2 words
**Schema:**
```python
{
  userId: String,
  difficulty: String,
  vocabulary_original: String,
  p_tag: String,
  s_tag: String
}
```
**Purpose:** Track user's vocabulary flashcard difficulty/progress

##### 2.3 grammars
**Schema:**
```python
{
  userId: String,
  difficulty: String,
  title: String,
  p_tag: String,
  s_tag: String
}
```
**Purpose:** Track user's grammar flashcard difficulty/progress

**Note:** This database stores minimal user-specific data (userId, difficulty). Full content is fetched from the static database and merged at runtime to save space.

---

### 3. mecabWords (Flask Backend)
**Purpose:** User vocabulary mining and word knowledge tracking  
**Backend:** Flask (Python)  
**Port:** 5100  
**Connection:** PyMongo

#### Collections:

##### 3.1 mecab_words
**Schema:**
```python
{
  userId: String,
  original: String,        # Word as it appears in text
  dictionary: String,      # Dictionary form of the word
  furigana: String,        # Reading/pronunciation
  status: String           # 'seen', 'known', 'learning', 'unknown'
}
```
**Purpose:** Track which words users have encountered and their knowledge level  
**Use Case:** Text parser color-coding based on user's vocabulary knowledge

---

### 4. sentenceMining (Flask Backend)
**Purpose:** User-created vocabulary and sentence mining  
**Backend:** Flask (Python)  
**Port:** 5100  
**Connection:** PyMongo

#### Collections:

##### 4.1 vocabulary
**Schema:**
```python
{
  userId: String,
  difficulty: String,
  p_tag: String,           # e.g., 'sentence_mining'
  s_tag: String,           # e.g., 'verbs-1'
  lang: String,            # Language code
  vocabulary_original: String,
  vocabulary_simplified: String,
  vocabulary_english: String,
  vocabulary_audio: String,
  word_type: String,
  notes: String,
  sentences: [{
    sentence_original: String,
    sentence_simplified: String,
    sentence_romaji: String,
    sentence_english: String,
    sentence_audio: String,
    sentence_picture: String
  }]
}
```
**Purpose:** Store user-mined vocabulary with custom sentences and notes  
**Features:** Full CRUD operations (GET, POST, PATCH, DELETE)

---

### 5. library (Flask Backend)
**Purpose:** User's personal library of texts and videos  
**Backend:** Flask (Python)  
**Port:** 5100  
**Connection:** PyMongo

#### Collections:

##### 5.1 texts
**Schema:**
```python
{
  userId: String,
  topic: String,
  sourceLink: String,
  actualText: String,
  p_tag: String,
  s_tag: String,
  lang: String
}
```
**Purpose:** Store user's custom Japanese texts for study

##### 5.2 videos
**Schema:**
```python
{
  userId: String,
  url: String,
  customTitle: String,
  customDescription: String,
  p_tag: String,
  s_tag: String,
  lang: String
}
```
**Purpose:** Store user's custom video links for immersion learning

---

### 6. login_db (Flask Backend)
**Purpose:** Track user login streaks  
**Backend:** Flask (Python)  
**Port:** 5100  
**Connection:** PyMongo

#### Collections:

##### 6.1 logins
**Schema:**
```python
{
  userId: String,
  date: String,            # Format: 'YYYY-MM-DD'
  count: Number            # Number of logins on this date
}
```
**Purpose:** Track daily logins for streak calculation  
**Features:** Calculates longest login streak for gamification

---

### 7. email_db (Flask Backend)
**Purpose:** Email waitlist collection  
**Backend:** Flask (Python)  
**Port:** 5100  
**Connection:** PyMongo

#### Collections:

##### 7.1 emails
**Schema:**
```python
{
  email: String
}
```
**Purpose:** Collect email addresses for waitlist/notifications

---

### 8. jmdictDatabase (Dictionary Backend)
**Purpose:** Japanese-English dictionary data (JMDict)  
**Backend:** Node.js/Express  
**Port:** 5200  
**Connection:** Mongoose

#### Collections:

This database contains the full JMDict Japanese-English dictionary data. The exact schema is determined by the JMDict data structure from the [JMdict-simplified](https://github.com/scriptin/jmdict-simplified) repository.

**Purpose:** Provide dictionary lookup functionality for Japanese words  
**Data Source:** JMdict-EDICT Dictionary Project (Creative Commons License)

---

### 9. jitendexDatabase (Dictionary Backend)
**Purpose:** Alternative Japanese dictionary data (Jitendex)  
**Backend:** Node.js/Express  
**Port:** 5200  
**Connection:** Mongoose

**Purpose:** Additional dictionary source with audio generation capabilities  
**Status:** May be used for future enhancements

---

### 10. flashcardDB & 11. sourceDB (Legacy - Dictionary Backend)
**Purpose:** Legacy/reference databases from dictionary service  
**Backend:** Node.js/Express  
**Port:** 5200  
**Connection:** Mongoose

#### Collections in flashcardDB:
- flashcardstates - Legacy flashcard state storage

#### Collections in sourceDB:
- kanji - Reference kanji data
- vocabulary - Reference vocabulary data
- grammar - Reference grammar data
- reading - Reference reading materials

**Status:** These appear to be legacy databases or used for local development/testing. The main production databases are in Express backend.

---

## Data Flow Architecture

### Static Content Flow
```
User Request → Express Backend (8000) → zenRelationshipsAutomated → Response
```

### Dynamic User Data Flow
```
User Request → Flask Backend (5100) → User-specific DB → Response
```

### Flashcard SRS Flow
```
1. User Request → Flask Backend
2. Fetch user progress from flaskFlashcardDB
3. Fetch full content from Express Backend (zenRelationshipsAutomated)
4. Merge data (static + user progress)
5. Apply SRS algorithm (frequency adjustment based on difficulty)
6. Return shuffled flashcard deck
```

### Dictionary Lookup Flow
```
User Request → Dictionary Backend (5200) → jmdictDatabase → Response
```

---

## API Endpoints Summary

### Express Backend (8000)
- `GET /e-api/v1/words` - Get vocabulary words (filterable by p_tag, s_tag)
- `GET /e-api/v1/tanos_words` - Get Tanos vocabulary
- `GET /e-api/v1/grammars` - Get grammar points (multi-language support)
- `GET /e-api/v1/grammar-titles` - Get list of grammar titles
- `POST /e-api/v1/grammar-details` - Get specific grammar details
- `POST /e-api/v1/{language}/grammar-details` - Language-specific grammar
- `GET /e-api/v1/kanji` - Get kanji data
- `GET /e-api/v1/reading` - Get reading materials

### Flask Backend (5100)

#### Flashcard Endpoints
- `POST /f-api/v1/clone-static-collection-kanji` - Clone kanji to user's flashcard deck
- `POST /f-api/v1/clone-static-collection-words` - Clone words to user's flashcard deck
- `POST /f-api/v1/clone-static-collection-grammars` - Clone grammar to user's flashcard deck
- `GET/POST /f-api/v1/combine-flashcard-data-kanji` - Get merged flashcard data
- `GET/POST /f-api/v1/combine-flashcard-data-words` - Get merged word flashcards
- `GET/POST /f-api/v1/combine-flashcard-data-grammars` - Get merged grammar flashcards
- `POST /f-api/v1/flashcard` - Update flashcard difficulty
- `GET /f-api/v1/flashcard/<userId>` - Get user's flashcard progress

#### Vocabulary Mining Endpoints
- `POST /f-api/v1/user-vocabulary` - Add/update user vocabulary knowledge
- `POST /f-api/v1/enhance-vocabulary` - Enhance text with user's knowledge status

#### Sentence Mining Endpoints
- `POST /f-api/v1/store-vocabulary-data` - Store mined vocabulary
- `GET /f-api/v1/text-parser-words` - Get user's mined vocabulary
- `POST /f-api/v1/text-parser-words` - Create mined vocabulary record
- `PATCH /f-api/v1/text-parser-words/<id>` - Update mined vocabulary
- `DELETE /f-api/v1/text-parser-words` - Delete mined vocabulary

#### Library Endpoints
- `GET /f-api/v1/japanese-texts/<userId>` - Get user's custom texts
- `POST /f-api/v1/japanese-texts` - Create custom text
- `DELETE /f-api/v1/japanese-texts/<id>` - Delete custom text
- `GET /f-api/v1/custom-videos` - Get custom videos (filterable)
- `POST /f-api/v1/custom-videos` - Create custom video
- `DELETE /f-api/v1/custom-videos/<id>` - Delete custom video

#### Login Tracking Endpoints
- `POST /f-api/v1/notify-login` - Record user login
- `GET /f-api/v1/get-logins/<userId>` - Get login history
- `GET /f-api/v1/streak/<userId>` - Get longest login streak

#### Email Endpoints
- `POST /f-api/v1/submit_email` - Submit email to waitlist

#### Health Check
- `GET /health` - Service health check

---

## Data Relationships

### Parent-Child Relationships
```
Word (zenRelationshipsAutomated.words)
  ├─> Sentences (zenRelationshipsAutomated.sentences)
  └─> Referenced via ObjectId array in 'sentences' field
```

### Cross-Database Relationships (Logical)
```
User Progress (flaskFlashcardDB.kanji)
  └─> Links to → Static Content (zenRelationshipsAutomated.kanji)
      via: userId + kanji + p_tag + s_tag

User Progress (flaskFlashcardDB.words)
  └─> Links to → Static Content (zenRelationshipsAutomated.words)
      via: userId + vocabulary_original + p_tag + s_tag

User Progress (flaskFlashcardDB.grammars)
  └─> Links to → Static Content (zenRelationshipsAutomated.grammars)
      via: userId + title + p_tag + s_tag
```

---

## Tagging System

The application uses a hierarchical tagging system across all content:

### Primary Tags (p_tag)
- **Japanese:** `JLPT_N5`, `JLPT_N4`, `JLPT_N3`, `JLPT_N2`, `JLPT_N1`
- **Japanese Verbs:** `essential_600_verbs`, `suru_essential_600_verbs`
- **Vietnamese:** `VIET`
- **Chinese:** `HSK_` prefix
- **Korean:** `KOREAN_` prefix
- **Thai:** `CU-TFL_` prefix
- **Custom:** `sentence_mining`

### Secondary Tags (s_tag)
- Numeric divisions: `100`, `10`, `part_1`, `part_2`, etc.
- Category divisions: `verbs-1`, `verbs-2`, etc.
- Special: `all` (fetch all items under p_tag)

---

## Storage Optimization Strategy

The application uses a **two-tier storage model** to optimize space:

### Tier 1: Static Content (zenRelationshipsAutomated)
- Full content stored once
- Includes all text, audio paths, translations, examples
- Shared across all users
- Large storage footprint

### Tier 2: User Progress (flaskFlashcardDB)
- Minimal user-specific data
- Only stores: userId, difficulty, identifying keys
- Small storage footprint per user
- Data merged with static content at runtime

**Benefits:**
- Prevents data duplication across users
- Easy to fix typos/errors in static content
- Scales efficiently with user growth
- User-specific data remains small and fast

---

## Technology Stack

### Database
- **MongoDB** - Primary database (all collections)
- **Version:** Compatible with MongoDB 4.x+
- **Storage Engine:** WiredTiger

### Backend Frameworks
- **Express.js** (Node.js) - Static content API
- **Flask** (Python) - Dynamic user data API
- **Mongoose** - MongoDB ODM for Node.js
- **PyMongo** - MongoDB driver for Python
- **Flask-PyMongo** - Flask integration for PyMongo

### Frontend
- **Next.js 14** - React framework
- **Port:** 3000

### Reverse Proxy
- **Nginx** - Routes traffic to appropriate backend services
- **Port:** 8888 (external access)

---

## Deployment

### Docker Compose Architecture
```yaml
Services:
  - frontend-next (port 3000)
  - express-db (port 8000)
  - flask-dynamic-db (port 5100)
  - dictionary-db (port 5200)
  - nginx (port 8888)

Volumes:
  - ./user_db:/data/db (MongoDB data persistence)

Network:
  - hanabira-network (internal Docker network)
```

### Data Persistence
- MongoDB data stored in `./user_db` directory
- Mounted as Docker volume
- Survives container restarts

---

## Content Licensing

### Database Content Sources

#### Japanese Content
- **JMdict:** Creative Commons Attribution-ShareAlike License (V4.0)
- **KANJIDIC2:** EDRDG License
- **Tanos Vocabulary:** Creative Commons BY
- **RADKFILE/KRADFILE:** EDRDG License (commercial use restrictions)

#### In-House Content
- **License:** Creative Commons License
- **Repository:** [hanabira.org-japanese-content](https://github.com/tristcoil/hanabira.org-japanese-content)

---

## Database Maintenance

### Seeding Scripts

#### Express Backend
Located in `/backend/express/seeding_scripts/`
- Seeds static content into zenRelationshipsAutomated

#### Dictionary Backend
- `seed_jmdict_data.js` - Seeds JMDict data
- `seed_jitendex_data.js` - Seeds Jitendex data

### Backup Recommendations
1. Regular MongoDB dumps of user-specific databases
2. Static content can be re-seeded from source data
3. Priority: flaskFlashcardDB, mecabWords, sentenceMining, library, login_db

---

## Performance Considerations

### Indexing
Recommended indexes:
```javascript
// zenRelationshipsAutomated.words
db.words.createIndex({ p_tag: 1, s_tag: 1 })
db.words.createIndex({ vocabulary_original: 1 })

// zenRelationshipsAutomated.grammars
db.grammars.createIndex({ p_tag: 1, s_tag: 1 })
db.grammars.createIndex({ title: 1 })

// flaskFlashcardDB collections
db.kanji.createIndex({ userId: 1, p_tag: 1, s_tag: 1 })
db.words.createIndex({ userId: 1, p_tag: 1, s_tag: 1 })
db.grammars.createIndex({ userId: 1, p_tag: 1, s_tag: 1 })

// mecabWords.mecab_words
db.mecab_words.createIndex({ userId: 1, original: 1 })

// sentenceMining.vocabulary
db.vocabulary.createIndex({ userId: 1, p_tag: 1, s_tag: 1 })

// login_db.logins
db.logins.createIndex({ userId: 1, date: 1 })
```

### Query Optimization
- Use projection to limit returned fields
- Paginate large result sets
- Cache frequently accessed static content
- Use lean() queries in Mongoose for read-only operations

---

## Security Considerations

### Current Implementation
- All databases on localhost (not exposed externally)
- No authentication on MongoDB (localhost-only access)
- No user email storage in flashcard collections (privacy)

### Production Recommendations
1. Enable MongoDB authentication
2. Use separate MongoDB instances for static vs. dynamic data
3. Implement user authentication/authorization
4. Encrypt user-specific data
5. Regular security audits
6. Rate limiting on API endpoints
7. HTTPS/TLS for all external communications

---

## Monitoring & Logging

### Application Logging
- Express: Console logging
- Flask: Python logging module (INFO level)
- Log locations: Container stdout/stderr

### Database Monitoring
- MongoDB logs in user_db/diagnostic.data/
- Monitor collection sizes
- Track query performance
- Alert on failed writes

---

## Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check MongoDB is running
docker-compose ps

# Check MongoDB logs
docker-compose logs flask-dynamic-db
```

#### Data Not Appearing
```bash
# Verify data exists in database
docker exec -it <container> mongosh
use zenRelationshipsAutomated
db.words.countDocuments()
```

#### Stale Data
```bash
# Clear user_db directory (loses all user data!)
rm -rf user_db/*
docker-compose restart
```

---

## Future Enhancements

### Planned Database Changes
- Add MongoDB indexes for performance
- Implement proper user authentication database
- Add analytics database for usage tracking
- Consider Redis for caching frequently accessed data
- Implement database backups and restore procedures
- Add database versioning/migration system

### Potential New Collections
- User profiles (preferences, settings)
- Study sessions (time tracking, analytics)
- Achievements (gamification)
- Community features (shared decks, comments)

---

## Contact & Support

For database-related issues or questions:
- **Website:** [hanabira.org](https://hanabira.org)
- **Discord:** [Hanabira Discord](https://discord.com/invite/afefVyfAkH)
- **GitHub:** [hanabira.org repository](https://github.com/tristcoil/hanabira.org)

---

## Document Version
- **Version:** 1.0
- **Last Updated:** October 23, 2025
- **Project Stage:** Early Alpha
- **Database Count:** 11 MongoDB databases
- **Collection Count:** 30+ collections

---

## Summary Statistics

| Component | Count |
|-----------|-------|
| Total Databases | 11 |
| Active Production DBs | 8 |
| Legacy/Reference DBs | 3 |
| Total Collections | ~30 |
| Backend Services | 3 |
| Supported Languages | 5 (JP, VN, CN, KR, TH) |
| API Endpoints | 40+ |
| MongoDB Instance | 1 |

---

**End of Database Summary Documentation**

