# JMDict Database (jmdictDatabase) Documentation

This document provides a detailed breakdown of the MongoDB collections and document fields within the `jmdictDatabase`.

---

## 1. Collection: `entries`
The `entries` collection contains general Japanese vocabulary sourced from JMDict.

### Document Count
- **Total Documents**: ~367,619

### Field Specifications
| Field Name | Type | Description |
| :--- | :--- | :--- |
| `_id` | `ObjectId` | Unique Mongo identifier. |
| `expression` | `String` | The word in written form (Kanji or Kana). |
| `reading` | `String` | Phonetic reading in Hiragana/Katakana. |
| `type` | `String` | Part-of-speech tag (e.g., `n` for noun, `v5u` for Godan verb). |
| `meanings` | `Array<String>` | List of English definitions. |
| `__v` | `Number` | Mongoose version key. |

---

## 2. Collection: `kanjis`
The `kanjis` collection contains technical data for individual characters sourced from Kanjidic2.

### Document Count
- **Total Documents**: ~13,108

### Field Specifications
| Field Name | Type | Description |
| :--- | :--- | :--- |
| `_id` | `ObjectId` | Unique Mongo identifier. |
| `literal` | `String` | The single Kanji character (e.g., "家"). **(Indexed)** |
| `codepoint` | `Object` | Unicodes and JIS encodings mapping. |
| `radical` | `Object` | Radical information (classical, Nelson, etc.). |
| `misc` | `Object` | Categorization data (grade, stroke\_count, freq, jlpt). |
| `dic_number` | `Object` | Indices for external dictionaries (Heisig, Nelson, Halpern). |
| `query_code` | `Object` | Lookup codes (Four Corner, Skip, etc.). |
| `reading_meaning`| `Object` | Container for readings and meanings. |
| `__v` | `Number` | Mongoose version key. |

### Nested Structure: `reading_meaning`
This is the most critical object for the UI:

#### `readings` (Array of Objects)
Each object identifies a specific reading type and its value:
- `type`: `ja_on` (Onyomi), `ja_kun` (Kunyomi), `vietnam`, `pinyin`, `korean_r`.
- `value`: The actual reading string.

#### `meanings` (Array of Objects)
Contains translations in various languages:
- `value`: The translation string.
- `lang`: Optional language code (e.g., `fr`, `es`, `pt`). If missing, defaults to English.

---

## 3. Data Integrity & Relationships
- **Lookup Key**: The `literal` field in `kanjis` is indexed for sub-millisecond retrieval.
- **Cross-Referencing**: When a user searches for a vocabulary word (`entries`), the UI extractor can pull each unique kanji character from the `expression` field and perform a separate lookup in the `kanjis` collection to show detailed stroke and radical data.
