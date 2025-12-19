# Hanabira Learning Database Documentation

This document outlines the database architecture, collection schemas, and data relationships for the Hanabira platform. The system primarily uses **MongoDB** across two distinct database instances.

---

## 1. Primary Curriculum Database: `zenRelationshipsAutomated`
Located in the **Express Backend** (Port 8000), this database contains hand-curated and seeded learning materials categorized by JLPT levels.

### Collection: `kanji`
Stores character-specific data for Kanji recognition and stroke order.
- **Fields**:
  - `kanji` (String): The literal character.
  - `reading` (String): Primary reading (usually Hiragana).
  - `onYomi` (String): Chinese readings.
  - `kunYomi` (String): Japanese readings.
  - `translation` (String): English meaning.
  - `exampleWord` (String): A word using this kanji.
  - `exampleReading` (String): Reading of the example word.
  - `p_tag` (String): JLPT Level (e.g., `JLPT_N4`).
  - `s_tag` (String): Subsection/part tag.

### Collection: `tanosWord`
Stores a vast vocabulary list synchronized with Tanos JLPT requirements.
- **Fields**:
  - `vocabulary_original` (String): Word in Kanji/Kana.
  - `vocabulary_simplified` (String): Furigana/Reading.
  - `vocabulary_english` (String): Meaning.
  - `word_type` (String): Grammatical category (e.g., `noun`, `v5u`).
  - `vocabulary_audio` (String): Static path to audio file.
  - `p_tag` (String): JLPT Level.

### Collection: `Grammar`
Stores structured grammar lessons with explanations and formation rules.
- **Fields**:
  - `title` (String): Unique name of the grammar point.
  - `short_explanation` (String): Summary.
  - `long_explanation` (String): Exhaustive notes.
  - `formation` (String): Usage pattern (e.g., "V-te + iru").
  - `examples` (Array):
    - `jp` (String): Japanese sentence.
    - `en` (String): English translation.
    - `romaji` (String): Romanization.
    - `grammar_audio` (String): Audio path.
  - `p_tag` (String): JLPT Level.

### Collection: `Sentence`
General-purpose example sentences for search context.
- **Fields**:
  - `sentence_original` (String): Japanese text.
  - `sentence_english` (String): Translation.
  - `key` (String): Link to a specific word category (e.g., `600_verbs`).
  - `sentence_audio` (String): Audio path.

---

## 2. Linguistic Reference Database: `jmdictDatabase`
Located in the **Dictionary Service** (Port 5200), this contains the massive open-source JMDict and Kanjidic datasets for live lookup.

### Collection: `entries` (JMDict)
The primary source for the dictionary search.
- **Fields**:
  - `expression` (String): Base form of the word.
  - `reading` (String): Hiragana reading.
  - `meanings` (Array of Strings): List of English definitions.
  - `type` (String): Indicator of entry type.

### Collection: `kanjidic2` (Kanjidic)
Exhaustive data for every Kanji in the JIS standards (approx. 13,000+ characters).
- Provides radicals, frequency, grade levels, and historical mappings.

---

## 3. Dynamic User Database: `flaskFlashcardDB`
Located in the **Flask/Dynamic Service** (Port 5100), this tracks per-user state.

### Collection: `flashcards`
User-created cards linked to curriculum items.
- **Fields**:
  - `user_id` (ObjectId): Owner.
  - `front` / `back` (String): Content.
  - `interval` / `ease` (Number): Spaced Repetition (SRS) metrics.
  - `next_review` (Date): Schedule for next study session.

### Collection: `known_vocabulary`
Tracks which words a user has already mastered to customize text parsing/branching.
- **Fields**:
  - `user_id` (ObjectId): Owner.
  - `word_id` (String): Reference to `tanosWord` or `Entry`.
  - `status` (String): `learned`, `ignored`, or `studying`.
