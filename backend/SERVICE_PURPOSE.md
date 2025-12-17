# Backend Services Overview

This document describes the purpose and responsibilities of each backend service in the hanachan.org Japanese learning platform.

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                          │
└───────────────┬─────────────┬─────────────┬─────────────┬───────────┘
                │             │             │             │
                ▼             ▼             ▼             ▼
         ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
         │ express  │  │  flask   │  │dictionary│  │ hanachan │
         │ :8000    │  │  :5100   │  │  :5200   │  │  :5400   │
         └──────────┘  └──────────┘  └──────────┘  └──────────┘
              │             │             │             │
              ▼             ▼             ▼             ▼
         ┌──────────────────────────────────────────────────┐
         │              MongoDB (localhost:27017)            │
         └──────────────────────────────────────────────────┘
```

---

## 🔵 Express Service (`backend/express`)

**Port:** 8000  
**Type:** Node.js / Express  
**Database:** `zenRelationshipsAutomated`  

### Purpose
Serves **static educational content** - the curriculum data that is the same for all users.

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/e-api/v1/grammars` | GET | JLPT N1-N5 grammar points |
| `/e-api/v1/grammar-titles` | GET | List of grammar titles by level |
| `/e-api/v1/grammar-details` | POST | Single grammar point details |
| `/e-api/v1/words` | GET | Vocabulary words with sentences |
| `/e-api/v1/tanos_words` | GET | Tanos JLPT vocabulary list |
| `/e-api/v1/kanji` | GET | Kanji by JLPT level |
| `/e-api/v1/reading` | GET | Reading passages |

### Data Collections

| Collection | Count | Description |
|------------|-------|-------------|
| `grammars` | ~828 | Japanese grammar (JLPT N1-N5) |
| `tanoswords` | ~50,808 | JLPT vocabulary |
| `sentences` | ~5,281 | Example sentences |
| `kanji` | ~345 | Kanji characters |
| `words` | ~1,043 | Additional vocabulary |
| `reading` | ~10 | Reading passages |

---

## 🟢 Flask Service (`backend/flask`)

**Port:** 5100  
**Type:** Python / Flask  
**Database:** `flaskFlashcardDB`  

### Purpose
Manages **user-specific data** - personal progress, flashcards, and learning features.

### Modules

| Module | File | Purpose |
|--------|------|---------|
| Flashcards | `flashcards.py` | SRS flashcard system (create, review, schedule) |
| Vocabulary Mining | `vocabulary_mining.py` | Track user's known vocabulary |
| Sentence Mining | `sentence_mining.py` | Save sentences for learning |
| Library | `library.py` | Personal text library |
| Login Streak | `login_streak.py` | Daily login streak tracking |
| Email Waitlist | `email_waitlist.py` | Email signup management |

### Key Features
- Spaced Repetition System (SRS) for flashcards
- User progress tracking
- Personal vocabulary list
- Sentence collection

---

## 📖 Dictionary Service (`backend/dictionary`)

**Port:** 5200  
**Type:** Node.js / Express  
**Database:** `jmdictDatabase`  

### Purpose
**Real-time Japanese text processing** - tokenization, translation, and dictionary lookups.

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/d-api/v1/parse` | POST | MeCab tokenization (break text into words) |
| `/d-api/v1/parse-simple` | POST | Simplified parse result |
| `/d-api/v1/deepl-translate` | POST | Japanese → English translation |
| `/d-api/v1/convert/hiragana` | POST | Convert kanji to hiragana |
| `/d-api/v1/convert/katakana` | POST | Convert text to katakana |
| `/d-api/v1/convert/furigana` | POST | Add furigana readings |
| `/d-api/v1/simple-vocabulary/:expression` | GET | Dictionary word lookup |
| `/d-api/v1/kanji/:character` | GET | Kanji information lookup |

### Technologies
- **MeCab** - Japanese morphological analyzer
- **Kuroshiro** - Kanji to kana/romaji converter
- **JMDict** - Japanese dictionary database
- **Kanjidic** - Kanji dictionary
- **DeepL API** - Machine translation

---

## 🤖 Hanachan Service (`backend/hanachan`)

**Port:** 5400  
**Type:** Python / Flask  
**Database:** `hanachan_db`  

### Purpose
**AI Chat Agent** - conversational Japanese learning assistant.

### Features
- Streaming chat responses
- Multi-agent system (MAS) with specialized agents:
  - **Scenario Actor** - Natural conversation
  - **Sensei** - Language analysis
  - **Grammar Police** - Error correction
  - **Pitch Coach** - Pronunciation guidance

### Technologies
- LangChain / LangGraph
- Ollama (local LLM)
- MongoDB for chat history

---

## Database Summary

| Database | Service | Content Type |
|----------|---------|--------------|
| `zenRelationshipsAutomated` | express | Static curriculum (shared) |
| `flaskFlashcardDB` | flask | User data (personal) |
| `jmdictDatabase` | dictionary | Dictionary entries |
| `hanachan_db` | hanachan | Chat history |

---

## Quick Reference

| Service | Port | Language | Purpose |
|---------|------|----------|---------|
| express | 8000 | Node.js | Static content (curriculum) |
| flask | 5100 | Python | User data (progress) |
| dictionary | 5200 | Node.js | Text processing |
| hanachan | 5400 | Python | AI chat agent |

---

*Last updated: 2024-12-13*
