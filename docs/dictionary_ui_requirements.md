# Dictionary UI Data & API Requirements

This document specifies the required data fields and API contract for the refactored Hanabira Dictionary UI. These fields ensure the interface correctly displays rich linguistic details, search results, and navigation tabs.

---

## 1. Search & Tokenization API
**Endpoint:** `/d-api/v1/parse-split` (or equivalent dictionary parser)

### Request Payload
- `text` (String): The input query (e.g., "学校に行きます").
- `mode` (String): `book`, `lyrics`, or `single`.

### Response Structure (Required Fields)
The parser must return an array of tokens, each containing:
- `original` (String): The word as it appears in the text.
- `dictionary` (String): The lemma/base form (used for backreferenced lookups).
- `furigana` (String): Reading for the specific token.
- `type` (Enum): `vocab`, `kanji`, `grammar`.

---

## 2. Content Detail Requirements (By Tab)

### A. Vocabulary Tab (`vocab`)
Required for the main detail pane and the side list items.
- `head` (String): The word in Kanji/Kana (e.g., "家族").
- `reading` (String): Hiragana/Katakana reading ("かぞく").
- `meaning` (String): English/Vietnamese definition.
- `audio` (String): URL/Path to MPEG/MP3 pronunciation file.
- `tags` (Array of Strings): JLPT level, Part of Speech (e.g., `["jlpt-n5", "noun"]`).
- `grammarNote` (Optional String): Contextual usage notes (e.g., "Danh từ sở hữu...").

### B. Kanji Tab (`kanji`)
Required for the technical breakdown view.
- `head` (String): Single literal character ("家").
- `onyomi` (String): Chinese readings ("カ, ケ").
- `kunyomi` (String): Japanese readings ("いえ, や").
- `meaning` (String): English definition.
- `strokes` (Number): Total stroke count.
- `tags` (Array of Strings): Grade level, JLPT level.

### C. Sentences Tab (`sentence`)
Required for example sentence listings.
- `ja` (String): Japanese sentence.
- `en` (String): English translation.
- `audio` (Optional String): URL for sentence pronunciation.

### D. Grammar Tab (`grammar`)
Required for grammar point overview.
- `head` (String): Grammar point title ("〜てください").
- `meaning` (String): English explanation.
- `example` (String): A single formatted example sentence "JP (EN)".

---

## 3. UI Feature Specific Requirements

### Search Input Methods
- **Voice Search**: Requires an endpoint or provider for STT (Speech-to-Text).
- **Handwriting**: Requires a coordinate-based stroke recognizer or image-based classifier.
- **OCR/Image**: Requires an endpoint that accepts a `File` or `Base64` image and returns Japanese text.

### Sidebar Lists
- **Related Words**: Requires a "Similarity" or "Related" API that returns a list of `DictionaryEntry` objects based on semantic or radical similarity to the current headword.

---

## 4. Global State Requirements
To maintain the multi-pane navigation, the frontend requires:
- `activeTab` (String): Tracking the user's current context (`vocab`, `kanji`, `sentences`, `grammar`, `jj`).
- `searchResult` (Object): The full parsed payload from the initial text analysis.
- `selectedItem` (Object): The specific entry currently being displayed in the main detail pane.
