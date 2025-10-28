# Hanabira.org - Database Quick Reference

## Quick Database Lookup Table

| Database Name | Backend | Port | Purpose | Key Collections |
|--------------|---------|------|---------|-----------------|
| **zenRelationshipsAutomated** | Express | 8000 | Static educational content | words, grammars, kanji, sentences, reading |
| **flaskFlashcardDB** | Flask | 5100 | User SRS progress | kanji, words, grammars |
| **mecabWords** | Flask | 5100 | Vocabulary mining | mecab_words |
| **sentenceMining** | Flask | 5100 | Custom mined vocab | vocabulary |
| **library** | Flask | 5100 | User text/video library | texts, videos |
| **login_db** | Flask | 5100 | Login tracking | logins |
| **email_db** | Flask | 5100 | Email waitlist | emails |
| **jmdictDatabase** | Dictionary | 5200 | JMDict data | (JMDict entries) |
| **jitendexDatabase** | Dictionary | 5200 | Jitendex data | (Jitendex entries) |
| **flashcardDB** *(legacy)* | Dictionary | 5200 | Legacy flashcards | flashcardstates |
| **sourceDB** *(legacy)* | Dictionary | 5200 | Legacy source data | kanji, vocabulary, grammar |

---

## Collection Quick Reference

### Static Content (zenRelationshipsAutomated)

```
words              → Vocabulary with audio & sentences (JLPT, 600 verbs)
tanoswords         → Tanos JLPT vocabulary lists
sentences          → Example sentences for vocabulary
grammars           → Japanese grammar (JLPT)
vngrammars         → Vietnamese grammar
cngrammars         → Mandarin Chinese grammar (HSK)
krgrammars         → Korean grammar
thgrammars         → Thai grammar (CU-TFL)
kanji              → Kanji with readings & audio
reading            → Reading materials with audio
```

### User Progress (flaskFlashcardDB)

```
kanji              → User's kanji flashcard progress (difficulty tracking)
words              → User's vocabulary flashcard progress
grammars           → User's grammar flashcard progress
```

### User Data (Flask DBs)

```
mecab_words        → User vocabulary knowledge status (mecabWords DB)
vocabulary         → User mined vocabulary + sentences (sentenceMining DB)
texts              → User's custom texts (library DB)
videos             → User's custom videos (library DB)
logins             → Login streak tracking (login_db DB)
emails             → Email waitlist (email_db DB)
```

---

## Common Query Patterns

### Get JLPT N3 Vocabulary
```bash
# Express API
curl 'http://localhost:8000/e-api/v1/words?p_tag=JLPT_N3'
```

### Get User's Flashcard Progress
```bash
# Flask API
curl 'http://localhost:5100/f-api/v1/flashcard/userId?collectionName=kanji&p_tag=JLPT_N3&s_tag=part_1'
```

### Get Combined Flashcard Data (SRS)
```bash
# Flask API - Merges user progress + static content
curl -X POST http://localhost:5100/f-api/v1/combine-flashcard-data-kanji \
  -H "Content-Type: application/json" \
  -d '{"userId":"testUser","collectionName":"kanji","p_tag":"JLPT_N3","s_tag":"part_1"}'
```

### Track Vocabulary Knowledge
```bash
# Flask API
curl -X POST http://localhost:5100/f-api/v1/user-vocabulary \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "user123",
    "original": "行き",
    "dictionary": "行く",
    "furigana": "いき",
    "status": "seen"
  }'
```

---

## Tag System Cheat Sheet

### Primary Tags (p_tag)

**Japanese:**
- `JLPT_N5`, `JLPT_N4`, `JLPT_N3`, `JLPT_N2`, `JLPT_N1`
- `essential_600_verbs`
- `suru_essential_600_verbs`

**Other Languages:**
- `VIET` (Vietnamese)
- `HSK_*` (Mandarin Chinese)
- `KOREAN_*` (Korean)
- `CU-TFL_*` (Thai)

**Custom:**
- `sentence_mining` (user mined content)

### Secondary Tags (s_tag)
- Numbers: `10`, `100`, `200`
- Parts: `part_1`, `part_2`
- Categories: `verbs-1`, `verbs-2`
- Special: `all` (get everything)

---

## Data Type Reference

### Difficulty Levels (SRS)
```
'unknown'  → Not studied yet (highest frequency in SRS)
'hard'     → Difficult (high frequency)
'medium'   → Moderate (medium frequency)
'easy'     → Easy (low frequency)
```

### Word Status (Vocabulary Mining)
```
'unknown'  → Never seen
'seen'     → Encountered but not learned
'learning' → Currently studying
'known'    → Already mastered
```

---

## Connection Strings

```javascript
// Express Backend
mongoose.connect('mongodb://localhost:27017/zenRelationshipsAutomated')

// Flask Backend
client = MongoClient('mongodb://localhost:27017/')
db = client['flaskFlashcardDB']  // or other DB names

// Dictionary Backend
mongoose.connect('mongodb://localhost:27017/jmdictDatabase')
```

---

## Port Reference

```
3000  → Next.js Frontend
8000  → Express Backend (static content)
5100  → Flask Backend (user data)
5200  → Dictionary Backend
8888  → Nginx (external access point)
```

---

## Docker Services

```yaml
frontend-next       → Next.js app (port 3000)
express-db          → Static content API (port 8000)
flask-dynamic-db    → User data API (port 5100)
dictionary-db       → Dictionary API (port 5200)
nginx               → Reverse proxy (port 8888)
```

---

## File Locations

```
Backend Code:
  /backend/express/        → Express backend
  /backend/flask/          → Flask backend
  /backend/dictionary/     → Dictionary backend

Database Data:
  /user_db/                → MongoDB data files (WiredTiger)

Models:
  /backend/express/models/ → Mongoose schemas
  /backend/flask/modules/  → Flask modules (with schemas)

Config:
  /config_dummy.json       → Sample config (API keys)
  /docker-compose.yml      → Docker orchestration
```

---

## Environment Variables

```bash
APP_ENV              → "dev" or "prod"
REACT_APP_HOST_IP    → Backend host (for Docker networking)
GA_MEASUREMENT_ID    → Google Analytics ID
```

---

## SRS Algorithm Quick Notes

```python
# Frequency weights (in f_adjust_frequency_and_shuffle)
'easy':    0.2  # 20% of total cards
'medium':  0.4  # 40% of total cards
'hard':    0.6  # 60% of total cards
'unknown': 0.8  # 80% of total cards

# Then shuffled for variety
```

---

## Common MongoDB Commands

```bash
# Access MongoDB in Docker
docker exec -it hanabiraorg-flask-dynamic-db-1 mongosh

# List all databases
show dbs

# Use a specific database
use zenRelationshipsAutomated

# List collections
show collections

# Count documents
db.words.countDocuments()

# Sample query
db.words.find({ p_tag: "JLPT_N3" }).limit(5)

# Get collection stats
db.words.stats()
```

---

## Backup Commands

```bash
# Backup user database
mongodump --db=flaskFlashcardDB --out=/backup/

# Restore user database
mongorestore --db=flaskFlashcardDB /backup/flaskFlashcardDB/

# Backup all databases
mongodump --out=/backup/full/

# Backup specific collection
mongodump --db=sentenceMining --collection=vocabulary --out=/backup/
```

---

## Development Workflow

### 1. Adding New Vocabulary
```
1. Add to JSON in /backend/express/json_data/
2. Run seeding script
3. Data appears in zenRelationshipsAutomated.words
4. Available via Express API
5. Users can clone to their flashcard deck
```

### 2. User Studies Vocabulary
```
1. User clones content → flaskFlashcardDB.words
2. User studies → Updates difficulty
3. Next session → Fetch combined data (user progress + full content)
4. SRS algorithm applies → More hard words, fewer easy words
```

### 3. User Mines Vocabulary
```
1. User encounters word in text parser
2. Saves to sentenceMining.vocabulary
3. Can add custom sentences & notes
4. Available in custom vocab cards
```

---

## API Response Formats

### Words API
```json
{
  "words": [
    {
      "_id": "...",
      "vocabulary_original": "食べる",
      "vocabulary_simplified": "たべる",
      "vocabulary_english": "to eat",
      "vocabulary_audio": "/audio/vocab/v_食べる.mp3",
      "word_type": "Verb",
      "p_tag": "JLPT_N5",
      "s_tag": "100",
      "sentences": [...]
    }
  ]
}
```

### Grammar API
```json
{
  "grammars": [
    {
      "_id": "...",
      "title": "～てもいい (〜te mo ii)",
      "short_explanation": "Permission/approval",
      "long_explanation": "...",
      "formation": "Verb-てform + もいい",
      "examples": [
        {
          "jp": "...",
          "romaji": "...",
          "en": "...",
          "grammar_audio": "..."
        }
      ],
      "p_tag": "JLPT_N4",
      "s_tag": "10"
    }
  ]
}
```

### Flashcard API (Combined)
```json
[
  {
    "_id": "...",
    "kanji": "駐",
    "reading": "チュウ",
    "k_audio": "/audio/japanese/kanji/k_駐.mp3",
    "exampleWord": "駐車",
    "exampleReading": "ちゅうしゃ",
    "translation": "parking",
    "audio": "/audio/japanese/kanji/v_駐車.mp3",
    "p_tag": "JLPT_N3",
    "s_tag": "part_1",
    "userId": "testUser",
    "difficulty": "hard"
  }
]
```

---

## Troubleshooting Quick Fixes

### Can't connect to database
```bash
# Restart MongoDB container
docker-compose restart flask-dynamic-db express-db

# Check MongoDB is running
docker-compose ps | grep db
```

### Data not showing up
```bash
# Check if data exists
docker exec -it hanabiraorg-express-db-1 mongosh
use zenRelationshipsAutomated
db.words.countDocuments()

# Re-seed if needed
cd backend/express
./seed_db_wrapper.sh
```

### Breaking changes in database
```bash
# Clear user data (WARNING: deletes all user progress!)
rm -rf user_db/*
docker-compose restart
```

---

## Performance Tips

1. **Use projection** to limit fields returned
2. **Index frequently queried fields** (userId, p_tag, s_tag)
3. **Paginate** large result sets
4. **Cache** static content in frontend
5. **Use lean()** in Mongoose for read-only queries
6. **Batch updates** instead of individual saves

---

## Security Checklist

- [ ] MongoDB authentication enabled
- [ ] Network isolation (only containers can access DB)
- [ ] User input validation
- [ ] Rate limiting on APIs
- [ ] HTTPS/TLS enabled
- [ ] Regular backups
- [ ] No sensitive data in logs
- [ ] API keys in environment variables (not code)

---

**For detailed information, see DATABASE_SUMMARY.md**

