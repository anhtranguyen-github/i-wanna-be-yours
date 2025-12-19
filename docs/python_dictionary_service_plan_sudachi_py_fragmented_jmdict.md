# Dictionary Service – Implementation Report (COMPLETED)

## 0. Goal & Status
**STATUS: COMPLETED**
Build a **Python-based dictionary service** that:
- Uses **SudachiPy** for robust Japanese morphological analysis
- Serves vocabulary, kanji, and contextual data from a **fragmented MongoDB-backed JMDict / Kanjidic2 dataset**
- Powers the **full-page Dictionary UI** described (Vocabulary / Kanji / Sentences / Grammar tabs)
- Is extensible for AI-generated content (sentences, grammar) without blocking core dictionary accuracy

This plan focuses on **architecture, data flow, and responsibilities**, not code implementation.

---

## 1. Core Architecture Overview

### 1.1 Service-Oriented Layout

```
dictionary-service/
├─ api/
│  ├─ search.py          # Unified search endpoint
│  ├─ vocab.py           # Vocabulary-specific APIs
│  ├─ kanji.py           # Kanji lookup APIs
│  ├─ sentences.py       # Example sentences (future / AI)
│  └─ grammar.py         # Grammar patterns (future / AI)
│
├─ services/
│  ├─ tokenizer.py       # SudachiPy integration
│  ├─ vocab_service.py   # JMDict query + aggregation logic
│  ├─ kanji_service.py   # Kanjidic2 lookup + normalization
│  ├─ relationship.py    # Related words, cross-links
│  └─ audio.py           # TTS / audio resolution
│
├─ models/
│  ├─ vocab.py           # Internal normalized vocab schema
│  ├─ kanji.py           # Internal normalized kanji schema
│  └─ ui_payload.py      # UI-facing response contracts
│
├─ data/
│  ├─ mongodb.py         # Database access layer
│  └─ indexes.md         # Index & performance notes
│
└─ config/
   ├─ sudachi.json
   └─ settings.py
```

---

## 2. Data Sources & Fragmentation Strategy

### 2.1 MongoDB Collections (Given)

- **entries** (~367k docs)
  - Vocabulary-level data (expression, reading, meanings, POS)
- **kanjis** (~13k docs)
  - Character-level technical data (readings, radicals, stroke count, JLPT)

### 2.2 Fragmentation Principle

- **No joins at DB level**
- Each collection is queried independently
- Aggregation happens **in service layer**, not database

Benefits:
- Fast indexed lookups (kanjis.literal)
- Flexible UI composition
- Easier future sharding (vocab vs kanji vs examples)

---

## 3. SudachiPy Integration Plan

### 3.1 Responsibilities of SudachiPy

SudachiPy is **not** the dictionary — it is the **linguistic analyzer**.

Used for:
- Tokenizing user input (sentences, phrases, conjugated forms)
- Lemmatization (base/dictionary form)
- POS normalization
- Handling:
  - Inflected verbs/adjectives
  - Mixed kanji–kana input
  - Full sentences

### 3.2 Tokenization Modes

- **Search input** → SudachiPy A or B mode (shortest tokens)
- **Sentence analysis** → SudachiPy C mode (longest tokens)

### 3.3 Output Contract

Each token produces:
- surface form
- dictionary form
- reading
- POS

These become **lookup keys** into `entries`.

---

## 4. Vocabulary Lookup Flow

### 4.1 Input Types

- Single word (kanji / kana)
- Inflected form (食べた, 行かなかった)
- Multi-word phrase
- Full sentence

### 4.2 Processing Pipeline

```
User Input
  ↓
SudachiPy Tokenization
  ↓
Base Form Extraction
  ↓
entries Collection Lookup
  ↓
Vocabulary Aggregation
  ↓
Kanji Extraction (from expression)
  ↓
kanjis Collection Lookup
  ↓
UI Payload Assembly
```

### 4.3 Vocabulary Matching Strategy

Lookup priority:
1. Exact `expression` match
2. `reading` match
3. Base form match (from Sudachi)
4. Fallback partial / prefix matches

---

## 5. Kanji Data Resolution

### 5.1 Kanji Extraction

- Extract **unique kanji characters** from vocab `expression`
- Ignore kana and punctuation

### 5.2 Kanji Lookup

- Query `kanjis` by indexed `literal`
- Batch lookup for performance

### 5.3 Normalization for UI

From `reading_meaning`:
- Onyomi → grouped list
- Kunyomi → grouped list
- Meanings → English-first, fallback multilingual

Additional surfaced fields:
- stroke_count
- radicals
- JLPT / grade

---

## 6. UI Payload Design (Critical)

### 6.1 Vocabulary Tab Payload

Includes:
- expression
- reading
- meanings (ordered, short → long)
- POS tags (human-readable)
- JLPT level (derived or mapped)
- audio reference (URL or key)
- usage notes (if available / future)

### 6.2 Kanji Tab Payload

Per character:
- literal
- stroke_count
- onyomi[]
- kunyomi[]
- meanings[]
- radical info
- education level
- drawing metadata (future)

### 6.3 Sentences & Grammar Tabs

- Marked as **generated / supplemental**
- Can be AI-backed
- Must reference base vocab IDs

---

## 7. Search Results & Navigation

### 7.1 Search Result List

Returned when:
- Multiple vocab matches
- Ambiguous readings

Each item shows:
- expression
- reading
- primary meaning
- POS

### 7.2 Related Words Engine (Phase 2)

Sources:
- Shared kanji
- Same POS + similar meaning tokens
- Sudachi semantic similarity (future)

---

## 8. Performance & Indexing Plan

- `entries.expression` → index
- `entries.reading` → index
- `kanjis.literal` → **already indexed**

Optimizations:
- Batch kanji lookups
- Cache hot vocab (LRU / Redis)
- Cache Sudachi tokenization results

---

## 9. Extensibility Roadmap

### Phase 1 – Core Dictionary
- Vocab lookup
- Kanji details
- Sudachi-based normalization

### Phase 2 – Context
- Example sentences
- Audio (TTS or pre-recorded)

### Phase 3 – Learning Layer
- Grammar explanations
- Difficulty scoring
- Personalized recommendations

---

## 10. Key Design Principles

- **SudachiPy = analyzer, not truth**
- **MongoDB = source of truth**
- **Service layer = aggregator**
- **UI payloads are explicit contracts**
- **AI content is additive, never authoritative**

---

If you want next steps, the natural follow-ups are:
1. UI payload JSON schemas
2. Sudachi POS → UI grammar tag mapping
3. JLPT / difficulty inference strategy
4. Caching & latency budget per request
