import requests
import json
from enum import Enum
from typing import Optional, List, Dict, Any, Union
from mcp.server.fastmcp import FastMCP

# Initialize FastMCP server
mcp = FastMCP("Hanabira Tools")

# Configuration
DICTIONARY_API_BASE = "http://localhost:5200/d-api/v1"

class TextMode(str, Enum):
    LYRICS = "lyrics"
    BOOK = "book"

class WordRelationType(str, Enum):
    VERB_CONJUGATION = "verb conjugation"
    WORD_SIMILARITY = "word similarity"
    SYNONYMS = "synonyms"
    ANTONYMS = "antonyms"
    HYPERNYMS = "hypernyms"
    HYPONYMS = "hyponyms"
    COLLOCATIONS = "collocations"
    PART_OF_SPEECH = "part of speech"
    IDIOMS = "idioms"
    PRONUNCIATION_SIMILARITY = "pronounciation/kanji similarity"

@mcp.tool()
def analyze_japanese_text(text: str, mode: TextMode = TextMode.BOOK) -> Dict[str, Any]:
    """
    Analyze Japanese text to break it down into words/tokens with dictionary forms and readings.
    Useful for understanding sentence structure, reading (furigana), and granular analysis.

    Args:
        text: The Japanese text to analyze.
        mode: Analysis mode. 'book' for standard sentences, 'lyrics' for line-by-line (poems/songs).
    """
    url = f"{DICTIONARY_API_BASE}/parse-split"
    try:
        response = requests.post(url, json={"text": text, "mode": mode.value})
        response.raise_for_status()
        parse_result = response.json()
        
        # Also get various readings/conversions
        convert_url = f"{DICTIONARY_API_BASE}/convert/all"
        convert_res = requests.post(convert_url, json={"text": text})
        convert_data = convert_res.json() if convert_res.ok else {}

        return {
            "parsed_structure": parse_result,
            "readings": convert_data
        }
    except requests.RequestException as e:
        return {"error": str(e)}

@mcp.tool()
def generate_grammar_graph(sentence: str, language: str = "Japanese") -> Dict[str, Any]:
    """
    Generate a grammatical parse tree for a sentence to visualize its structure.
    Explains how parts of the sentence relate to each other (subject, object, verb phrases, etc.).

    Args:
        sentence: The sentence to analyze.
        language: The language of the sentence (e.g., 'Japanese', 'Korean', 'English').
    """
    url = f"{DICTIONARY_API_BASE}/parse-tree"
    try:
        # The backend expects 'userId' as well, we can generate a dummy one or omit if optional
        # Looking at page.tsx, it sends userId.
        payload = {
            "sentence": sentence,
            "language": language,
            "userId": "mcp-agent"
        }
        response = requests.post(url, json=payload)
        response.raise_for_status()
        
        # The API returns a stringified JSON in 'parseTree' field
        data = response.json()
        if "parseTree" in data:
            try:
                data["parseTree"] = json.loads(data["parseTree"])
            except:
                pass # Keep as string if parsing fails
        
        return data
    except requests.RequestException as e:
        return {"error": str(e)}

@mcp.tool()
def translate_text(text: str) -> str:
    """
    Translate Japanese text to English using DeepL.
    
    Args:
        text: The Japanese text to translate.
    """
    url = f"{DICTIONARY_API_BASE}/deepl-translate"
    try:
        response = requests.post(url, json={"japaneseText": text})
        response.raise_for_status()
        return response.json().get("translatedText", "")
    except requests.RequestException as e:
        return f"Error: {str(e)}"

@mcp.tool()
def explore_word_relations(word: str, relation_type: WordRelationType, language: str = "Japanese") -> Dict[str, Any]:
    """
    Explore relationships for a given word, such as conjugations, synonyms, idioms, etc.
    Helpful for deep word study and expanding vocabulary.

    Args:
        word: The target word.
        relation_type: The type of relationship/analysis to perform (e.g., 'verb conjugation', 'synonyms').
        language: 'Japanese' or 'Korean'.
    """
    # Map relation type to endpoint
    # Based on word-relations/page.tsx:
    # "verb conjugation" -> /verb-conjugation
    # ...
    # Wait, the endpoint names in page.tsx matched keys exactly for most part? 
    # Let's check the map in page.tsx:
    # "verb conjugation": `${apiBaseUrl}/verb-conjugation`,
    # "word similarity": `${apiBaseUrl}/word-similarity`,
    # ...
    
    endpoint_map = {
        "verb conjugation": "verb-conjugation",
        "word similarity": "word-similarity",
        "synonyms": "synonyms",
        "antonyms": "antonyms",
        "hypernyms": "hypernyms",
        "hyponims": "hyponyms", # Note spelling in page.tsx: hyponims vs hyponyms endpoint
        "hyponyms": "hyponyms",
        "collocations": "collocations",
        "part of speech": "part-of-speech",
        "idioms": "idioms",
        "pronounciation/kanji similarity": "pronounciation-similarity"
    }
    
    endpoint_suffix = endpoint_map.get(relation_type.value)
    if not endpoint_suffix:
        return {"error": f"Unknown relation type: {relation_type}"}
        
    url = f"{DICTIONARY_API_BASE}/{endpoint_suffix}"
    
    try:
        response = requests.post(url, json={"userPrompt": word})
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        return {"error": str(e)}

if __name__ == "__main__":
    mcp.run()
