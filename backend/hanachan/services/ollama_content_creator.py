"""
AI Content Creator Agent using Ollama
Receives user input, generates content via Ollama LLM, and saves to MongoDB
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
from pymongo import MongoClient
from bson import ObjectId
import requests
import json
import re
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Ollama configuration
OLLAMA_BASE_URL = "http://localhost:11434"
OLLAMA_MODEL = "qwen3:1.7b"

# MongoDB configuration
MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "hanachan"
COLLECTION_NAME = "ai_generated_contents"


class OllamaContentCreator:
    """AI-powered content creator using Ollama for generation"""
    
    def __init__(self):
        self.mongo_client = MongoClient(MONGO_URI)
        self.db = self.mongo_client[DB_NAME]
        self.collection = self.db[COLLECTION_NAME]
        
        # Create indexes
        self.collection.create_index([("pattern_type", 1)])
        self.collection.create_index([("tags", 1)])
        self.collection.create_index([("created_at", -1)])
    
    def _call_ollama(self, prompt: str, system_prompt: str = None) -> str:
        """Call Ollama API to generate content"""
        try:
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})
            
            response = requests.post(
                f"{OLLAMA_BASE_URL}/api/chat",
                json={
                    "model": OLLAMA_MODEL,
                    "messages": messages,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "num_predict": 2048
                    }
                },
                timeout=120
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get("message", {}).get("content", "")
            else:
                logger.error(f"Ollama API error: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"Error calling Ollama: {e}")
            return None
    
    def _extract_json(self, text: str) -> Dict:
        """Extract JSON from LLM response"""
        # Try to find JSON in code blocks
        json_match = re.search(r'```(?:json)?\s*([\s\S]*?)```', text)
        if json_match:
            try:
                return json.loads(json_match.group(1).strip())
            except:
                pass
        
        # Try direct JSON parsing
        try:
            return json.loads(text)
        except:
            pass
        
        # Try to find JSON object in text
        json_match = re.search(r'\{[\s\S]*\}', text)
        if json_match:
            try:
                return json.loads(json_match.group())
            except:
                pass
        
        return None
    
    def generate_vocabulary(self, request: str) -> Dict[str, Any]:
        """Generate vocabulary content based on user request"""
        system_prompt = """You are a Japanese language expert. Generate vocabulary content in JSON format.
        
Output ONLY valid JSON with this structure:
{
    "words": [
        {
            "vocabulary_original": "漢字の単語",
            "vocabulary_simplified": "かんじのたんご",
            "vocabulary_english": "English meaning",
            "word_type": "noun/verb/adjective",
            "p_tag": "JLPT_N3",
            "s_tag": "vocab-001"
        }
    ],
    "level": "N5/N4/N3/N2/N1",
    "topic": "topic name"
}"""
        
        prompt = f"""Generate 10 Japanese vocabulary words for this request: {request}

Include proper readings (hiragana), English meanings, and JLPT level tags.
Output only valid JSON."""
        
        response = self._call_ollama(prompt, system_prompt)
        if not response:
            return None
        
        data = self._extract_json(response)
        if not data:
            return None
        
        return {
            "pattern_type": "Word",
            "content": data,
            "tags": ["private", "ai-generated"],
            "status": "active",
            "request": request,
            "generated_at": datetime.utcnow()
        }
    
    def generate_grammar(self, request: str) -> Dict[str, Any]:
        """Generate grammar content based on user request"""
        system_prompt = """You are a Japanese grammar expert. Generate grammar explanations in JSON format.

Output ONLY valid JSON with this structure:
{
    "patterns": [
        {
            "title": "〜てから",
            "short_explanation": "After doing ~",
            "long_explanation": "Detailed explanation of usage...",
            "formation": "Verb て-form + から",
            "examples": [
                {
                    "jp": "ご飯を食べてから、勉強します。",
                    "romaji": "Gohan wo tabete kara, benkyou shimasu.",
                    "en": "After eating, I will study."
                }
            ],
            "p_tag": "JLPT_N4",
            "s_tag": "grammar-001"
        }
    ],
    "level": "N5/N4/N3/N2/N1"
}"""
        
        prompt = f"""Generate 5 Japanese grammar patterns for this request: {request}

Include proper examples with romanization and English translation.
Output only valid JSON."""
        
        response = self._call_ollama(prompt, system_prompt)
        if not response:
            return None
        
        data = self._extract_json(response)
        if not data:
            return None
        
        return {
            "pattern_type": "Grammar",
            "content": data,
            "tags": ["private", "ai-generated"],
            "status": "active",
            "request": request,
            "generated_at": datetime.utcnow()
        }
    
    def generate_quiz(self, request: str) -> Dict[str, Any]:
        """Generate quiz content based on user request"""
        system_prompt = """You are a Japanese language teacher. Generate quiz questions in JSON format.

Output ONLY valid JSON with this structure:
{
    "title": "Quiz Title",
    "description": "Quiz description",
    "jlpt_level": "N5/N4/N3/N2/N1",
    "category": "vocabulary/grammar/kanji",
    "questions": [
        {
            "question_id": "q1",
            "question_type": "vocab_reading",
            "content": {
                "prompt": "What is the reading of 食べる?",
                "options": ["たべる", "のべる", "あべる", "さべる"],
                "correct_answer": "たべる"
            },
            "points": 1
        }
    ]
}"""
        
        prompt = f"""Generate a Japanese quiz for this request: {request}

Create 10 multiple-choice questions with 4 options each.
Output only valid JSON."""
        
        response = self._call_ollama(prompt, system_prompt)
        if not response:
            return None
        
        data = self._extract_json(response)
        if not data:
            return None
        
        return {
            "pattern_type": "Quiz",
            "content": data,
            "tags": ["private", "ai-generated"],
            "status": "active",
            "request": request,
            "generated_at": datetime.utcnow()
        }
    
    def generate_exam(self, request: str) -> Dict[str, Any]:
        """Generate JLPT exam content based on user request"""
        system_prompt = """You are a JLPT exam preparation expert. Generate exam content in JSON format.

Output ONLY valid JSON with this structure:
{
    "config": {
        "mode": "FULL_EXAM",
        "title": "Exam Title",
        "description": "Exam description",
        "level": "N5/N4/N3/N2/N1",
        "skills": ["VOCABULARY", "GRAMMAR", "READING"],
        "questionCount": 20,
        "timerMode": "JLPT_STANDARD",
        "timeLimitMinutes": 45
    },
    "questions": [
        {
            "id": "exam-q1",
            "type": "VOCABULARY",
            "content": "Question text",
            "options": [
                {"id": "a", "text": "Option A"},
                {"id": "b", "text": "Option B"},
                {"id": "c", "text": "Option C"},
                {"id": "d", "text": "Option D"}
            ],
            "correctOptionId": "a",
            "explanation": "Explanation text"
        }
    ]
}"""
        
        prompt = f"""Generate a JLPT practice exam for this request: {request}

Create 20 questions covering vocabulary, grammar, and reading.
Output only valid JSON."""
        
        response = self._call_ollama(prompt, system_prompt)
        if not response:
            return None
        
        data = self._extract_json(response)
        if not data:
            return None
        
        return {
            "pattern_type": "JLPTUserExam",
            "content": data,
            "tags": ["private", "ai-generated"],
            "status": "active",
            "request": request,
            "generated_at": datetime.utcnow()
        }
    
    def generate_reading(self, request: str) -> Dict[str, Any]:
        """Generate reading passage content based on user request"""
        system_prompt = """You are a Japanese reading comprehension expert. Generate reading passages in JSON format.

Output ONLY valid JSON with this structure:
{
    "key": "reading-001",
    "title": "Reading Title",
    "titleJp": "日本語タイトル",
    "p_tag": "JLPT_N4",
    "japaneseText": ["日本語の文章1。", "日本語の文章2。"],
    "romanizedText": ["Romaji text 1.", "Romaji text 2."],
    "englishTranslation": ["English translation 1.", "English translation 2."],
    "readingVocabulary": ["単語1", "単語2"],
    "readingVocabularyEn": ["word1", "word2"],
    "readingGrammar": ["文法1", "文法2"],
    "readingGrammarEn": ["grammar1", "grammar2"]
}"""
        
        prompt = f"""Generate a Japanese reading passage for this request: {request}

Create a short passage (5-8 sentences) with vocabulary and grammar points.
Output only valid JSON."""
        
        response = self._call_ollama(prompt, system_prompt)
        if not response:
            return None
        
        data = self._extract_json(response)
        if not data:
            return None
        
        return {
            "pattern_type": "Reading",
            "content": data,
            "tags": ["private", "ai-generated"],
            "status": "active",
            "request": request,
            "generated_at": datetime.utcnow()
        }
    
    def generate_flashcards(self, request: str) -> Dict[str, Any]:
        """Generate flashcard deck based on user request"""
        system_prompt = """You are a Japanese language flashcard creator. Generate flashcard content in JSON format.

Output ONLY valid JSON with this structure:
{
    "title": "Deck Title",
    "description": "Deck description",
    "level": "Beginner/Intermediate/Advanced",
    "tags": ["vocabulary", "JLPT"],
    "cards": [
        {
            "front": "日本語 (にほんご)",
            "back": "Japanese language",
            "sub_detail": "にほんご",
            "type": "vocabulary",
            "extra_data": {
                "example_sentence": "日本語を勉強する。"
            }
        }
    ]
}"""
        
        prompt = f"""Generate a flashcard deck for this request: {request}

Create 15 flashcards with Japanese on front and English on back.
Output only valid JSON."""
        
        response = self._call_ollama(prompt, system_prompt)
        if not response:
            return None
        
        data = self._extract_json(response)
        if not data:
            return None
        
        return {
            "pattern_type": "Deck",
            "content": data,
            "tags": ["private", "ai-generated"],
            "status": "active",
            "request": request,
            "generated_at": datetime.utcnow()
        }
    
    def generate_content(self, request: str, content_type: str = "auto") -> Dict[str, Any]:
        """Main entry point - generate content based on request and type"""
        
        # Auto-detect content type if not specified
        if content_type == "auto":
            lower_request = request.lower()
            if any(w in lower_request for w in ["vocab", "word", "単語"]):
                content_type = "vocabulary"
            elif any(w in lower_request for w in ["grammar", "文法", "pattern"]):
                content_type = "grammar"
            elif any(w in lower_request for w in ["quiz", "クイズ", "test me"]):
                content_type = "quiz"
            elif any(w in lower_request for w in ["exam", "試験", "jlpt"]):
                content_type = "exam"
            elif any(w in lower_request for w in ["reading", "読解", "passage"]):
                content_type = "reading"
            elif any(w in lower_request for w in ["flashcard", "カード", "deck"]):
                content_type = "flashcards"
            else:
                content_type = "vocabulary"  # Default
        
        logger.info(f"Generating {content_type} content for: {request[:50]}...")
        
        # Generate content based on type
        generators = {
            "vocabulary": self.generate_vocabulary,
            "grammar": self.generate_grammar,
            "quiz": self.generate_quiz,
            "exam": self.generate_exam,
            "reading": self.generate_reading,
            "flashcards": self.generate_flashcards
        }
        
        generator = generators.get(content_type)
        if not generator:
            return {"error": f"Unknown content type: {content_type}"}
        
        return generator(request)
    
    def generate_and_save(self, request: str, content_type: str = "auto") -> Dict[str, Any]:
        """Generate content and save to database"""
        content = self.generate_content(request, content_type)
        
        if not content or "error" in content:
            return content
        
        # Save to MongoDB
        try:
            result = self.collection.insert_one(content)
            content["_id"] = str(result.inserted_id)
            logger.info(f"Saved content with ID: {content['_id']}")
            return content
        except Exception as e:
            logger.error(f"Error saving to database: {e}")
            return {"error": str(e)}
    
    def get_generated_content(self, pattern_type: str = None, limit: int = 20) -> List[Dict]:
        """Retrieve generated content from database"""
        query = {}
        if pattern_type:
            query["pattern_type"] = pattern_type
        
        cursor = self.collection.find(query).sort("generated_at", -1).limit(limit)
        results = []
        for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results
    
    def close(self):
        """Close MongoDB connection"""
        self.mongo_client.close()


# Flask route integration
def register_content_creator_routes(app):
    """Register content creator API routes"""
    from flask import request, jsonify
    
    creator = OllamaContentCreator()
    
    @app.route("/v1/content/generate", methods=["POST"])
    def generate_content():
        """API endpoint to generate content"""
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        user_request = data.get("request", data.get("prompt", ""))
        content_type = data.get("type", "auto")
        save = data.get("save", True)
        
        if not user_request:
            return jsonify({"error": "Request text is required"}), 400
        
        if save:
            result = creator.generate_and_save(user_request, content_type)
        else:
            result = creator.generate_content(user_request, content_type)
        
        if result and "error" not in result:
            return jsonify(result), 201
        else:
            return jsonify(result or {"error": "Generation failed"}), 500
    
    @app.route("/v1/content/list", methods=["GET"])
    def list_content():
        """API endpoint to list generated content"""
        pattern_type = request.args.get("type")
        limit = int(request.args.get("limit", 20))
        
        results = creator.get_generated_content(pattern_type, limit)
        return jsonify({"items": results, "count": len(results)}), 200


# CLI for testing
if __name__ == "__main__":
    import sys
    
    creator = OllamaContentCreator()
    
    if len(sys.argv) > 1:
        request_text = " ".join(sys.argv[1:])
    else:
        request_text = "Create N4 vocabulary about daily activities"
    
    print(f"\n🤖 Generating content for: {request_text}\n")
    result = creator.generate_and_save(request_text)
    
    if result and "error" not in result:
        print(f"✅ Generated {result['pattern_type']} content")
        print(f"📝 ID: {result.get('_id', 'N/A')}")
        print(f"📊 Content preview:")
        print(json.dumps(result.get("content", {}), indent=2, ensure_ascii=False)[:500])
    else:
        print(f"❌ Error: {result}")
    
    creator.close()
