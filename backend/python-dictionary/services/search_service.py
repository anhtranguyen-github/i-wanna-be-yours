from data.mongodb import db
from services.tokenizer import tokenizer_service
from models.vocab import VocabResponse
from models.kanji import KanjiResponse
from typing import List, Dict, Any, Set
import re

def katakana_to_hiragana(text: str) -> str:
    """Converts Katakana characters to Hiragana."""
    if not text:
        return ""
    return "".join(
        chr(ord(c) - 0x60) if 0x30a1 <= ord(c) <= 0x30f6 else c
        for c in text
    )

class SearchService:
    @staticmethod
    async def get_sentences(query: str, limit: int = 20) -> List[Dict[str, Any]]:
        sentence_list = []
        sentence_seen = set()
        
        sentence_db = db.client["zenRelationshipsAutomated"]
        
        # 1. Key match (primary)
        cursor = sentence_db.sentences.find({"key": query}).limit(limit)
        async for s in cursor:
            s_id = str(s.get("_id"))
            if s_id not in sentence_seen:
                sentence_list.append({
                    "id": s_id,
                    "original": s.get("sentence_original"),
                    "english": s.get("sentence_english"),
                    "simplified": s.get("sentence_simplified"),
                    "audio": s.get("sentence_audio"),
                    "key": s.get("key")
                })
                sentence_seen.add(s_id)
        
        # 2. Regex match (fallback)
        if len(sentence_list) < limit:
            cursor = sentence_db.sentences.find({"sentence_original": {"$regex": re.escape(query)}}).limit(limit - len(sentence_list))
            async for s in cursor:
                s_id = str(s.get("_id"))
                if s_id not in sentence_seen:
                    sentence_list.append({
                        "id": s_id,
                        "original": s.get("sentence_original"),
                        "english": s.get("sentence_english"),
                        "simplified": s.get("sentence_simplified"),
                        "audio": s.get("sentence_audio"),
                        "key": s.get("key")
                    })
                    sentence_seen.add(s_id)
        
        return sentence_list

    @staticmethod
    async def search(text: str) -> Dict[str, Any]:
        # 1. Tokenize
        tokens = tokenizer_service.tokenize(text, mode="C")
        
        vocab_map = {}
        
        # 2. Lookup Vocab for each token
        for token in tokens:
            pos0 = token["pos"][0]
            # Skip common "noise" tokens if they are part of a longer sentence
            is_noise = pos0 in ["助詞", "助動詞", "補助記号", "記号"]
            if is_noise and len(text) > len(token["surface"]) + 1:
                continue

            lookups_expr = {token["dictionary_form"], token["surface"], token["normalized_form"]}
            
            # Smart Reading Lookup:
            # Sudachi provides Katakana readings; JMDict uses Hiragana.
            lookups_read = set()
            is_very_short = len(token["surface"]) <= 2
            is_single_kanji = len(token["surface"]) == 1 and re.match(r'[\u4e00-\u9faf]', token["surface"])
            
            if not is_single_kanji:
                # Avoid reading matches for short words in sentence context to reduce noise
                if not (is_very_short and len(text) > 4):
                    raw_reading = token.get("reading")
                    if raw_reading:
                        hira_reading = katakana_to_hiragana(raw_reading)
                        lookups_read.add(hira_reading)
            
            # Build and execute MongoDB query for this token
            query_filter = {"$or": [
                {"expression": {"$in": list(lookups_expr)}}
            ]}
            if lookups_read:
                clean_read = [r for r in lookups_read if r]
                if clean_read:
                    query_filter["$or"].append({"reading": {"$in": clean_read}})

            cursor = db.db.entries.find(query_filter).limit(20)
            
            async for entry in cursor:
                expr = entry.get("expression")
                read = entry.get("reading")
                
                if expr not in vocab_map:
                    vocab_map[expr] = {
                        "expression": expr,
                        "readings": {read} if read else set(),
                        "meanings": entry.get("meanings", []),
                        "pos_tags": [token["pos"][0]],
                        "id": str(entry.get("_id"))
                    }
                else:
                    if read:
                        vocab_map[expr]["readings"].add(read)
                    
                    # Consolidate meanings
                    existing_meanings = set(vocab_map[expr]["meanings"])
                    for m in entry.get("meanings", []):
                        if m not in existing_meanings:
                            vocab_map[expr]["meanings"].append(m)
                            existing_meanings.add(m)

        # Finalize vocab list (converting sets to sorted strings/lists)
        final_vocab = []
        for expr, data in vocab_map.items():
            # Join readings with " | " if there are multiple
            sorted_readings = sorted(list(data["readings"]))
            data["reading"] = " | ".join(sorted_readings) if sorted_readings else ""
            del data["readings"]
            final_vocab.append(data)

        # 2.5 Fallback for English -> Japanese (if no results or input is purely alpha/spaces)
        is_alpha = re.match(r'^[a-zA-Z\s\d\-_]+$', text.strip())
        if not final_vocab or is_alpha:
            # Search meanings directly if we couldn't find matches via tokenization/expression
            # or if it looks like an English query
            cursor_en = db.db.entries.find({
                "meanings": {"$regex": re.escape(text.strip()), "$options": "i"}
            }).limit(20)
            
            async for entry in cursor_en:
                expr = entry.get("expression")
                if expr not in vocab_map:
                    final_vocab.append({
                        "expression": expr,
                        "reading": entry.get("reading", ""),
                        "meanings": entry.get("meanings", []),
                        "pos_tags": [], # We don't have this from direct lookup
                        "id": str(entry.get("_id"))
                    })
                    # Add to vocab_map to prevent duplicates in this list
                    vocab_map[expr] = True 

        # 3. Extract kanji and collect keys for sentence lookup
        kanji_set = set()
        lookup_keys = set()
        for char in text:
            if re.match(r'[\u4e00-\u9faf]', char):
                kanji_set.add(char)
        
        for token in tokens:
            lookup_keys.add(token["dictionary_form"])
            lookup_keys.add(token["surface"])

        # 4. Lookup Kanji info
        kanji_details = []
        if kanji_set:
            cursor = db.db.kanjis.find({"literal": {"$in": list(kanji_set)}})
            async for k in cursor:
                # Extract On/Kun from reading_meaning
                onyomi = []
                kunyomi = []
                rm = k.get("reading_meaning", {})
                readings = rm.get("readings", []) if isinstance(rm, dict) else []
                
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
        
        # Sort kanji_details back to match order in sentence
        kanji_details.sort(key=lambda item: text.find(item["literal"]))

        # 5. Lookup Sentences from zenRelationshipsAutomated
        sentence_list = []
        sentence_seen = set()
        if lookup_keys:
            sentence_db = db.client["zenRelationshipsAutomated"]
            pattern = "|".join([re.escape(k) for k in lookup_keys if k])
            if pattern:
                cursor = sentence_db.sentences.find({
                    "$or": [
                        {"key": {"$in": list(lookup_keys)}},
                        {"sentence_original": {"$regex": pattern}}
                    ]
                }).limit(20)
                async for s in cursor:
                    s_id = str(s.get("_id"))
                    if s_id not in sentence_seen:
                        sentence_list.append({
                            "id": s_id,
                            "original": s.get("sentence_original"),
                            "english": s.get("sentence_english"),
                            "simplified": s.get("sentence_simplified"),
                            "audio": s.get("sentence_audio"),
                            "key": s.get("key")
                        })
                        sentence_seen.add(s_id)

        return {
            "query": text,
            "vocab": final_vocab,
            "kanji": kanji_details,
            "sentences": sentence_list
        }

search_service = SearchService()
