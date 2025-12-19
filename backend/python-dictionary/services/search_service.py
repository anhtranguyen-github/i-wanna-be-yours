from data.mongodb import db
from services.tokenizer import tokenizer_service
from models.vocab import VocabResponse
from models.kanji import KanjiResponse
from typing import List, Dict, Any, Set
import re

class SearchService:
    @staticmethod
    async def search(text: str) -> Dict[str, Any]:
        # 1. Tokenize
        tokens = tokenizer_service.tokenize(text, mode="C")
        
        vocab_list = []
        kanji_set = set()
        
        # 2. Lookup Vocab for each token
        for token in tokens:
            # We look up by dictionary form and surface if different
            lookups = {token["dictionary_form"], token["surface"], token["normalized_form"]}
            
            for query in lookups:
                # Find in Mongo entries collection
                cursor = db.db.entries.find({
                    "$or": [
                        {"expression": query},
                        {"reading": query}
                    ]
                })
                
                async for entry in cursor:
                    # Map to UI response
                    vocab_list.append({
                        "expression": entry.get("expression"),
                        "reading": entry.get("reading"),
                        "meanings": entry.get("meanings", []),
                        "pos_tags": [token["pos"][0]], # Simplified POS for now
                        "id": str(entry.get("_id"))
                    })
                    
                    # Extract kanji from expression for next phase
                    expr = entry.get("expression", "")
                    for char in expr:
                        if re.match(r'[\u4e00-\u9faf]', char):
                            kanji_set.add(char)

        # 3. Lookup Kanji info
        kanji_details = []
        if kanji_set:
            cursor = db.db.kanjis.find({"literal": {"$in": list(kanji_set)}})
            async for k in cursor:
                # Extract On/Kun from reading_meaning
                onyomi = []
                kunyomi = []
                rm = k.get("reading_meaning", {})
                readings = rm.get("readings", []) if isinstance(rm, dict) else []
                
                # Check structure of Kanjidic2 (it might vary depending on how it was seeded)
                # Based on previous inspection, it was reading_meaning.readings
                for r in readings:
                    if r.get("type") == "ja_on":
                        onyomi.append(r.get("value"))
                    elif r.get("type") == "ja_kun":
                        kunyomi.append(r.get("value"))
                
                # Meanings
                meanings = []
                m_list = rm.get("meanings", []) if isinstance(rm, dict) else []
                for m in m_list:
                    if isinstance(m, dict) and (not m.get("lang") or m.get("lang") == "en"):
                        meanings.append(m.get("value"))
                    elif isinstance(m, str):
                        meanings.append(m)

                kanji_details.append({
                    "literal": k.get("literal"),
                    "stroke_count": k.get("misc", {}).get("stroke_count", [None])[0] if k.get("misc") else None,
                    "onyomi": onyomi,
                    "kunyomi": kunyomi,
                    "meanings": meanings,
                    "jlpt": k.get("misc", {}).get("jlpt") if k.get("misc") else None
                })

        return {
            "query": text,
            "vocab": vocab_list,
            "kanji": kanji_details
        }

search_service = SearchService()
