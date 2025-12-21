import logging
import os
from flask import request, jsonify
from .deck_models import Deck, DeckCard
from modules.auth import login_required
from bson import ObjectId
from pymongo import MongoClient

# --- In-Memory Deck Definitions ---
VOCAB_LEVELS = [
    "verbs-1", "verbs-2", "verbs-3", "verbs-4",
    "verbs-5", "verbs-6", "verbs-7", "verbs-8"
]

SURU_LEVELS = [
    "verbs-1", "verbs-2", "verbs-3", "verbs-4", "verbs-5", "verbs-6"
]

class DeckModule:
    def __init__(self):
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s %(levelname)s %(name)s %(threadName)s : %(message)s",
        )
        self.logger = logging.getLogger("DeckModule")
        
        self.env = os.getenv("APP_ENV", "dev")
        self.static_api_host = "localhost" # Default fallback

    # --------------------------------------------------------------------------
    # Helper: Populate Sentences and Sanitize ObjectIds
    # --------------------------------------------------------------------------
    def _populate_and_sanitize(self, db, docs):
        """
        1. Scans docs for 'sentences' (list of ObjectIds).
        2. Fetches full sentence objects from 'sentences' collection.
        3. Replaces IDs with Objects in the docs.
        4. Converts all ObjectIds (including main _id) to strings.
        """
        if not docs:
            return []

        # 1. Collect Sentence IDs
        sentence_ids = []
        for d in docs:
            if 'sentences' in d and isinstance(d['sentences'], list):
                for sid in d['sentences']:
                    if isinstance(sid, ObjectId):
                        sentence_ids.append(sid)
                    elif isinstance(sid, str):
                        try: sentence_ids.append(ObjectId(sid))
                        except: pass
        
        # 2. Fetch Sentences Batch
        sentence_map = {}
        if sentence_ids:
            # Remove duplicates
            sentence_ids = list(set(sentence_ids))
            try:
                s_cursor = db['sentences'].find({"_id": {"$in": sentence_ids}})
                for s in s_cursor:
                    if '_id' in s:
                        s['_id'] = str(s['_id']) # Sanitize immediately
                    sentence_map[str(s['_id'])] = s
            except Exception as e:
                pass # Ignore sentence fetch errors, proceed with partial data

        # 3. Apply back to docs and Sanitize
        cleaned_docs = []
        for d in docs:
            # Sanitize main ID
            if '_id' in d:
                d['_id'] = str(d['_id'])
            
            # Populate Sentences
            full_sentences = []
            if 'sentences' in d and isinstance(d['sentences'], list):
                for sid in d['sentences']:
                    sid_str = str(sid)
                    if sid_str in sentence_map:
                        full_sentences.append(sentence_map[sid_str])
                d['sentences'] = full_sentences # Replace IDs with Objects
            
            cleaned_docs.append(d)
        return cleaned_docs

    # --------------------------------------------------------------------------
    # Helper: Fetch Raw Data from DB
    # --------------------------------------------------------------------------
    def fetch_raw_docs(self, collection, p_tag, s_tag=None):
        db_host = "express-db" if self.env == "prod" else "localhost"
        uri = f"mongodb://{db_host}:27017/zenRelationshipsAutomated"
        
        client = MongoClient(uri)
        db = client["zenRelationshipsAutomated"]
        
        query = {"p_tag": p_tag}
        if s_tag:
            query["s_tag"] = s_tag
        
        # Collection name mapping
        col_name = collection 
        
        cursor = db[col_name].find(query)
        docs = list(cursor)
        
        return self._populate_and_sanitize(db, docs)

    def fetch_raw_docs_by_ids(self, collection, ids):
        db_host = "express-db" if self.env == "prod" else "localhost"
        uri = f"mongodb://{db_host}:27017/zenRelationshipsAutomated"
        
        client = MongoClient(uri)
        db = client["zenRelationshipsAutomated"]
        
        # Convert string IDs to ObjectId
        object_ids = []
        for i in ids:
            try:
                object_ids.append(ObjectId(i))
            except:
                pass
        
        col_name = collection
        cursor = db[col_name].find({"_id": {"$in": object_ids}})
        docs = list(cursor)
        return self._populate_and_sanitize(db, docs)

    # --------------------------------------------------------------------------
    # Helper: Map Raw Doc to DeckCard
    # --------------------------------------------------------------------------
    def map_doc_to_card(self, doc, type="vocabulary"):
        doc_id = str(doc.get('_id', 'unknown'))
        
        if type == "vocabulary":
            # Extract Sentence
            # sentences is now a list of dicts (populated)
            sentences = doc.get('sentences', [])
            example = ""
            sentence_obj = None
            
            if sentences and len(sentences) > 0:
                first_sent = sentences[0]
                if isinstance(first_sent, dict):
                    example = first_sent.get('sentence_original', '')
                    sentence_obj = first_sent
            
            return DeckCard(
                _id=doc_id,
                front=doc.get('vocabulary_original', '?'),
                back=doc.get('vocabulary_english', '?'),
                sub_detail=doc.get('vocabulary_simplified', ''),
                type="vocabulary",
                extra_data={
                    "audio": doc.get('vocabulary_audio', ''),
                    "example_sentence": example,
                    "sentence_obj": sentence_obj,
                    "p_tag": doc.get('p_tag'),
                    "s_tag": doc.get('s_tag')
                }
            )
        elif type == "kanji":
            return DeckCard(
                _id=doc_id,
                front=doc.get('kanji', '?'),
                back=doc.get('translation', '?'),
                sub_detail=doc.get('reading', ''), 
                type="kanji",
                extra_data={
                    "audio": doc.get('k_audio', ''),
                    "example_word": doc.get('exampleWord', ''),
                    "example_reading": doc.get('exampleReading', ''),
                    "p_tag": doc.get('p_tag'),
                    "s_tag": doc.get('s_tag')
                }
            )
        return DeckCard(_id=doc_id, front="?", back="?", type="unknown")

    def register_routes(self, app):

        # --------------------------------------------------------------------------
        # ENDPOINT: GET /api/v1/decks
        # --------------------------------------------------------------------------
        @app.route("/v1/decks", methods=["GET"])
        def get_all_decks():
            decks = []
            
            # 1. Essential Verbs Gen
            for i, part in enumerate(VOCAB_LEVELS):
                decks.append({
                    "_id": f"vocab-essential-{part}",
                    "title": f"Essential Verbs Vol. {i+1}",
                    "description": "Core 600 Essential Japanese Verbs.",
                    "tags": ["vocabulary", "verbs", "essential", "beginner"],
                    "level": "Beginner",
                    "icon": "book",
                })
                
            # 2. Suru Verbs Gen
            for i, part in enumerate(SURU_LEVELS):
                decks.append({
                    "_id": f"vocab-suru-{part}",
                    "title": f"Suru Verbs Vol. {i+1}",
                    "description": "Essential する-verbs.",
                    "tags": ["vocabulary", "suru-verbs", "intermediate"],
                    "level": "Intermediate",
                    "icon": "book",
                })
            
            return jsonify(decks), 200

        # --------------------------------------------------------------------------
        # ENDPOINT: GET /api/v1/decks/<deck_id>
        # --------------------------------------------------------------------------
        @app.route("/v1/decks/<deck_id>", methods=["GET"])
        def get_deck_by_id(deck_id):
            target_config = None
            
            # Check Essential
            for i, part in enumerate(VOCAB_LEVELS):
                if f"vocab-essential-{part}" == deck_id:
                    target_config = {
                        "title": f"Essential Verbs Vol. {i+1}",
                        "desc": "Core 600 Essential Japanese Verbs.",
                        "tags": ["vocabulary", "verbs"],
                        "col": "words", "p": "essential_600_verbs", "s": part
                    }
                    break
            
            if not target_config:
                 # Check Suru
                for i, part in enumerate(SURU_LEVELS):
                    if f"vocab-suru-{part}" == deck_id:
                        target_config = {
                            "title": f"Suru Verbs Vol. {i+1}",
                            "desc": "Essential する-verbs.",
                            "tags": ["vocabulary", "suru"],
                            "col": "words", "p": "suru_essential_600_verbs", "s": part
                        }
                        break
            
            if not target_config:
                return jsonify({"error": "Deck not found"}), 404

            # Query DB
            try:
                raw_docs = self.fetch_raw_docs(target_config['col'], target_config['p'], target_config['s'])
                cards = [self.map_doc_to_card(doc, type="vocabulary") for doc in raw_docs]
                
                deck_response = Deck(
                    _id=deck_id,
                    title=target_config["title"],
                    description=target_config["desc"],
                    tags=target_config["tags"],
                    cards=cards,
                    level="Beginner",
                    icon="book"
                )
                
                return jsonify(deck_response.model_dump(by_alias=True)), 200
            except Exception as e:
                self.logger.error(f"Error fetching deck {deck_id}: {e}")
                return jsonify({"error": "Failed to fetch deck"}), 500

        # --------------------------------------------------------------------------
        # ENDPOINT: POST /api/v1/cards/batch
        # --------------------------------------------------------------------------
        @app.route("/v1/cards/batch", methods=["POST"])
        @login_required
        def get_cards_batch():
            try:
                data = request.json
                collection = data.get("collection", "words")
                ids = data.get("ids", [])
                
                if not ids:
                    return jsonify([]), 200
                
                raw_docs = self.fetch_raw_docs_by_ids(collection, ids)
                
                card_type = "vocabulary"
                if collection == "kanji":
                    card_type = "kanji"
                
                cards = [self.map_doc_to_card(doc, type=card_type) for doc in raw_docs]
                
                return jsonify([c.model_dump(by_alias=True) for c in cards]), 200
            except Exception as e:
                self.logger.error(f"Error in batch fetch: {e}")
                return jsonify({"error": "Batch fetch failed"}), 500
