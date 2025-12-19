# Japanese Learning Services API Documentation

This document describes the input and output structures for the various services used in the Hanabira learning platform.

## 1. Express Backend Service (Port 8000)
Used for structured curriculum data (JLPT, Lessons, Library).

### `GET /e-api/v1/tanos_words`
Queries the database for JLPT vocabulary.
- **Input (Query Params):**
  - `p_tag`: Parent tag (e.g., `JLPT_N3`)
  - `s_tag`: (Optional) Sub-grouping tag (e.g., `100`)
- **Output:**
  ```json
  {
    "words": [
      {
        "_id": "64...",
        "vocabulary_original": "家族",
        "vocabulary_simplified": "かぞく",
        "vocabulary_english": "family",
        "word_type": "noun",
        "p_tag": "JLPT_N5"
      }
    ]
  }
  ```

### `GET /e-api/v1/kanji`
Queries the database for Kanji characters.
- **Input (Query Params):**
  - `p_tag`: Required (e.g., `JLPT_N3`)
  - `s_tag`: (Optional)
- **Output:**
  ```json
  [
    {
      "kanji": "家",
      "reading": "いえ",
      "translation": "house",
      "p_tag": "JLPT_N4"
    }
  ]
  ```

### `POST /e-api/v1/grammar-details`
Fetches a specific grammar lesson.
- **Input (JSON Body):**
  - `title`: The "key" title of the grammar point.
- **Output:**
  ```json
  {
    "grammar": {
      "title": "〜たい",
      "short_explanation": "Want to do...",
      "formation": "Verb [Masu-form] + たい",
      "examples": [
        { "jp": "水が飲みたい", "en": "I want to drink water" }
      ]
    }
  }
  ```

---

## 2. Dictionary Backend Service (Port 5200)
Used for linguistic analysis, translations, and raw dictionary lookups.

### `POST /d-api/v1/parse-split`
Tokenizes Japanese text into sentences and individual words.
- **Input (JSON Body):**
  - `text`: The string to analyze.
  - `mode`: `book` (full text) or `lyrics` (line-by-line).
- **Output:**
  ```json
  [
    [
      { "original": "学校", "dictionary": "学校", "furigana": "がっこう" },
      { "original": "に", "dictionary": "に", "furigana": "" },
      { "original": "行く", "dictionary": "行く", "furigana": "いく" }
    ]
  ]
  ```

### `GET /d-api/v1/simple-vocabulary/:expression`
Look up a word in JMDict.
- **Input (Path Param):**
  - `:expression`: Word or lemma (URL encoded).
- **Output:**
  ```json
  {
    "original": "寿司屋",
    "hiragana": "すしや",
    "englishTranslations": ["sushi shop", "sushi restaurant"]
  }
  ```

### `GET /d-api/v1/kanji/:character`
Detailed Kanji lookup from Kanjidic2.
- **Input (Path Param):**
  - `:character`: Single Kanji character.
- **Output:**
  ```json
  {
    "literal": "亜",
    "readings": [
      { "type": "ja_on", "value": "ア" },
      { "type": "ja_kun", "value": "つ.ぐ" }
    ],
    "meanings": ["Asia", "rank next"],
    "stroke_count": "7",
    "jlpt_level": "1"
  }
  ```

### `POST /d-api/v1/convert/all`
Kuroshiro conversion for various Japanese scripts.
- **Input (JSON Body):**
  - `text`: Japanese string.
- **Output:**
  ```json
  {
    "original": "感じ",
    "hiragana": "かんじ",
    "romaji": "kanji",
    "furigana": "<ruby>感<rt>かん</rt></ruby>じ"
  }
  ```

---

## 3. Flashcard/Dynamic Service (Port 5100)
Manages user-specific data like flashcards and known vocabulary.

### `POST /f-api/v1/enhance-vocabulary` (Common Pattern)
Takes parsed MeCab tokens and attaches user status (Known/Unknown).
- **Input (JSON Body):**
  - `tokens`: Result from `/d-api/v1/parse-split`.
- **Output:**
  - Same structure as input but each word object includes a `status` or `user_id` context.

### `POST /f-api/v1/flashcards`
Creates or fetches flashcards.
- **Input (JSON Body):**
  - `front`: Front side of card.
  - `back`: Back side of card.
  - `tags`: Array of tags.
- **Output:**
  ```json
  {
    "id": "fc_123",
    "front": "猫",
    "back": "Cat",
    "next_review": "2025-12-20..."
  }
  ```
