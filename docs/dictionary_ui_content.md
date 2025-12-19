# Dictionary UI Content Requirements

This document outlines the specific types of information (content) required to build the full-page Dictionary interface. This focus is on **what the user sees**, independent of technical implementation.

---

## 1. Core Vocabulary Information
When a user looks up a word, the UI needs to present:
- **Written Forms**: The word as it appears in standard Japanese (including any Kanji).
- **Phonetic Reading**: A clear breakdown of how the word is pronounced (using Hiragana or Katakana).
- **Core Meaning**: One or more clear definitions of the word in the user's target language.
- **Pronunciation Audio**: A way for the user to hear the word spoken aloud.
- **Grammar Tags**: Contextual classification, such as whether it is a noun, a specific type of verb, or an adjective.
- **Difficulty Markers**: Indication of the word's level (e.g., JLPT N5-N1).
- **Usage Notes**: Helpful tips on how to use the word correctly in conversation.

---

## 2. Kanji Technical Details
For any Kanji characters found within a search, the UI provides:
- **The Character Box**: A large, clear display of the Kanji.
- **Stroke Count**: The total number of pen strokes required to write it.
- **Readings**: Two types of Japanese readings:
  - **Onyomi**: The Chinese-origin readings.
  - **Kunyomi**: The native Japanese readings.
- **Technical Meanings**: Specific definitions unique to just that individual character.
- **Radicals**: The smaller "building blocks" or components that make up the character.
- **Education Level**: Information on which school grade or JLPT level the character belongs to.
- **Animation/Drawing**: Ideally, information that would allow for showing how to draw the character.

---

## 3. Contextual Content
To help the user understand how words fit into the language:
- **Example Sentences**: Real-world sentences using the searched word, complete with translations.
- **Sentence Audio**: Pronunciation for the full example sentences.
- **Grammar Patterns**: If the search involves a grammar point, the UI needs the title, a short summary of it's use, and rules on how to form it (e.g., which verb endings to use).

---

## 4. Navigation & Relationships
To help the user explore further:
- **Search Results List**: A list of similar or matching items for the user to choose from.
- **Related Words**: A secondary list of words that are semantically related (synonyms or words commonly used together).
- **Tab Categories**: Clear categorization of results into:
  - Vocabulary
  - Kanji
  - Sentences
  - Grammar

