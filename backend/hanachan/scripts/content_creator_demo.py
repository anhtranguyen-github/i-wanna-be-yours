#!/usr/bin/env python3
"""
Content Creator Demo - Practice, Quoot, Flashcards
User input → Ollama → JSON → Validate → Save → Reload → Verify
"""

import requests
import json
import re
from datetime import datetime
from pymongo import MongoClient
from bson import ObjectId

# === Configuration ===
import os
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434/api/chat")
OLLAMA_MODEL = os.environ.get("CHAT_MODEL", "qwen3:1.7b")
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "hanabira")
COLLECTION = "ai_generated_contents"

# === Data Models for Practice, Quoot, Flashcards ===
DATA_MODELS = {
    # PRACTICE - JLPT Practice Exams (JLPTUserExam model)
    "practice": {
        "description": "JLPT Practice Exam for /practice route",
        "db_collection": "jlptuserexams",
        "required_fields": ["config", "questions"],
        "example": {
            "type": "practice",
            "config": {
                "mode": "QUIZ",  # QUIZ | SINGLE_EXAM | FULL_EXAM
                "title": "N5 Vocabulary Practice",
                "description": "Practice N5 vocabulary",
                "level": "N5",  # N5 | N4 | N3 | N2 | N1
                "skills": ["VOCABULARY"],
                "questionCount": 10,
                "timerMode": "RELAXED",
                "timeLimitMinutes": 10
            },
            "questions": [
                {
                    "id": "q1",
                    "type": "VOCABULARY",
                    "content": "What is the reading of 食べる?",
                    "options": [
                        {"id": "a", "text": "たべる"},
                        {"id": "b", "text": "のべる"},
                        {"id": "c", "text": "あべる"},
                        {"id": "d", "text": "さべる"}
                    ],
                    "correctOptionId": "a",
                    "explanation": "食べる (たべる) means 'to eat'"
                }
            ],
            "origin": "chatbot",
            "isPublic": False,
            "tags": ["personal", "ai-generated"]
        }
    },
    
    # QUOOT - Vocabulary Game Decks (Deck model)
    "quoot": {
        "description": "Quoot Game Deck for /quoot route",
        "db_collection": "decks",
        "required_fields": ["title", "cards"],
        "example": {
            "type": "quoot",
            "_id": "ai-vocab-n5-food",
            "title": "N5 Food Vocabulary",
            "description": "Learn food words in Japanese",
            "tags": ["personal", "ai-generated", "vocabulary", "N5", "food"],
            "level": "Beginner",
            "icon": "utensils",
            "cards": [
                {
                    "_id": "card-1",
                    "front": "食べ物",
                    "back": "food",
                    "sub_detail": "たべもの",
                    "type": "vocabulary",
                    "extra_data": {
                        "audio": "",
                        "example_sentence": "日本の食べ物が好きです。"
                    }
                }
            ]
        }
    },
    
    # FLASHCARDS - Flashcard Decks (same Deck model, different use)
    "flashcard": {
        "description": "Flashcard Deck for /flashcards route",
        "db_collection": "decks",
        "required_fields": ["title", "cards"],
        "example": {
            "type": "flashcard",
            "_id": "ai-flashcard-n5-verbs",
            "title": "N5 Essential Verbs",
            "description": "Common N5 verbs with readings",
            "tags": ["personal", "ai-generated", "vocabulary", "N5", "verbs"],
            "level": "Beginner",
            "icon": "book",
            "cards": [
                {
                    "_id": "card-1",
                    "front": "食べる (たべる)",
                    "back": "to eat",
                    "sub_detail": "たべる",
                    "type": "vocabulary",
                    "extra_data": {
                        "audio": "",
                        "example_sentence": "ごはんを食べる。"
                    }
                }
            ]
        }
    }
}

# Build system prompt with all models
def build_system_prompt():
    prompt = """You are a Japanese language content creator for a learning app.
Generate content for ONE of these three features: Practice, Quoot, or Flashcards.

Output ONLY valid JSON. No explanations, just JSON.

=== CONTENT TYPES ===
"""
    for ctype, schema in DATA_MODELS.items():
        prompt += f"\n### {ctype.upper()}\n"
        prompt += f"{schema['description']}\n"
        prompt += f"```json\n{json.dumps(schema['example'], indent=2, ensure_ascii=False)}\n```\n"
    
    return prompt

SYSTEM_PROMPT = build_system_prompt()


def step(num: int, msg: str):
    """Print step for debugging"""
    print(f"\n[Step {num}] {msg}")


def call_ollama(user_input: str) -> str:
    """Step 1: Send request to Ollama"""
    step(1, "Calling Ollama API...")
    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": OLLAMA_MODEL,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_input}
                ],
                "stream": False,
                "options": {"temperature": 0.7}
            },
            timeout=120
        )
        
        if response.status_code == 200:
            content = response.json().get("message", {}).get("content", "")
            print(f"    ✅ Ollama responded ({len(content)} chars)")
            return content
        else:
            print(f"    ❌ Ollama error: {response.status_code}")
            return None
    except Exception as e:
        print(f"    ❌ Error: {e}")
        return None


def extract_json(text: str) -> dict:
    """Step 2: Extract JSON from response"""
    step(2, "Extracting JSON from response...")
    
    # Try code block first
    match = re.search(r'```(?:json)?\s*([\s\S]*?)```', text)
    if match:
        try:
            result = json.loads(match.group(1).strip())
            print("    ✅ Extracted from code block")
            return result
        except Exception as e:
            print(f"    ⚠️ Code block parse failed: {e}")
    
    # Try direct parse
    try:
        result = json.loads(text)
        print("    ✅ Direct JSON parse")
        return result
    except:
        pass
    
    # Try to find JSON object
    match = re.search(r'\{[\s\S]*\}', text)
    if match:
        try:
            result = json.loads(match.group())
            print("    ✅ Extracted JSON object from text")
            return result
        except Exception as e:
            print(f"    ❌ JSON extraction failed: {e}")
    
    print("    ❌ No valid JSON found")
    return None


def validate_data(data: dict) -> tuple[bool, str]:
    """Step 3: Validate against Practice/Quoot/Flashcard models"""
    step(3, "Validating data model...")
    
    if not isinstance(data, dict):
        return False, "Data is not a dictionary"
    
    # Detect content type
    content_type = data.get("type")
    if not content_type:
        print("    ⚠️ No 'type' field, inferring...")
        if "config" in data and "questions" in data:
            content_type = "practice"
        elif "cards" in data:
            # Check for quoot vs flashcard hints
            content_type = "quoot" if "game" in str(data).lower() else "flashcard"
        else:
            content_type = "unknown"
        data["type"] = content_type
    
    print(f"    📋 Content type: {content_type}")
    
    if content_type not in DATA_MODELS:
        return False, f"Unknown type: {content_type}. Must be: practice, quoot, or flashcard"
    
    schema = DATA_MODELS[content_type]
    print(f"    📝 {schema['description']}")
    
    # Check required fields
    for field in schema["required_fields"]:
        if field not in data:
            return False, f"Missing required field: {field}"
        print(f"    ✅ Has: {field}")
    
    # Type-specific validation
    if content_type == "practice":
        config = data.get("config", {})
        if not config.get("mode"):
            return False, "config.mode is required (QUIZ/SINGLE_EXAM/FULL_EXAM)"
        if config.get("mode") not in ["QUIZ", "SINGLE_EXAM", "FULL_EXAM"]:
            return False, f"Invalid mode: {config.get('mode')}"
        if not config.get("level"):
            return False, "config.level is required (N5/N4/N3/N2/N1)"
        if config.get("level") not in ["N5", "N4", "N3", "N2", "N1"]:
            return False, f"Invalid level: {config.get('level')}"
        questions = data.get("questions", [])
        if not questions:
            return False, "questions array is empty"
        print(f"    ✅ Practice: {config.get('title')} - {len(questions)} questions")
        
    elif content_type in ["quoot", "flashcard"]:
        if not data.get("title"):
            return False, "title is required"
        cards = data.get("cards", [])
        if not cards:
            return False, "cards array is empty"
        # Validate card structure
        for i, card in enumerate(cards):
            if not card.get("front") or not card.get("back"):
                return False, f"Card {i+1} missing front or back"
        print(f"    ✅ {content_type.title()}: {data.get('title')} - {len(cards)} cards")
    
    return True, "Validation passed"


def save_to_db(data: dict, request: str) -> str:
    """Step 4: Save to MongoDB"""
    step(4, "Saving to MongoDB...")
    
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        collection = db[COLLECTION]
        
        # Create document
        doc = {
            "content_type": data.get("type", "unknown"),
            "content": data,
            "request": request,
            "tags": ["private", "ai-generated"],
            "status": "active",
            "created_at": datetime.utcnow()
        }
        
        result = collection.insert_one(doc)
        doc_id = str(result.inserted_id)
        
        print(f"    ✅ Saved with ID: {doc_id}")
        client.close()
        return doc_id
        
    except Exception as e:
        print(f"    ❌ Save failed: {e}")
        return None


def reload_from_db(doc_id: str) -> dict:
    """Step 5: Reload from MongoDB to verify"""
    step(5, "Reloading from MongoDB...")
    
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        collection = db[COLLECTION]
        
        doc = collection.find_one({"_id": ObjectId(doc_id)})
        
        if doc:
            doc["_id"] = str(doc["_id"])
            print(f"    ✅ Reloaded document")
            print(f"    📋 Type: {doc.get('content_type')}")
            print(f"    📅 Created: {doc.get('created_at')}")
            client.close()
            return doc
        else:
            print(f"    ❌ Document not found")
            client.close()
            return None
            
    except Exception as e:
        print(f"    ❌ Reload failed: {e}")
        return None


def verify_roundtrip(original: dict, reloaded: dict) -> bool:
    """Step 6: Verify data integrity"""
    step(6, "Verifying data integrity...")
    
    if not reloaded:
        print("    ❌ No data to verify")
        return False
    
    reloaded_content = reloaded.get("content", {})
    
    if original.get("type") == reloaded_content.get("type"):
        print("    ✅ Type matches")
    else:
        print("    ❌ Type mismatch")
        return False
    
    print("\n" + "="*50)
    print("🎉 FULL PIPELINE SUCCESS!")
    print("="*50)
    return True


def main():
    print("\n" + "="*50)
    print("🎌 Content Creator Demo")
    print("="*50)
    print("Generate content for: Practice, Quoot, Flashcards")
    print("\nExamples:")
    print("  'Create N5 vocabulary practice exam'")
    print("  'Make a quoot deck about food'")
    print("  'Generate N4 verb flashcards'")
    print("\nType 'exit' to quit")
    print("="*50 + "\n")
    
    while True:
        try:
            user_input = input("📝 You: ").strip()
        except (EOFError, KeyboardInterrupt):
            break
        
        if not user_input:
            continue
        if user_input.lower() == "exit":
            break
        
        # Step 1: Call Ollama
        raw_response = call_ollama(user_input)
        if not raw_response:
            print("\n❌ Pipeline failed at Step 1")
            continue
        
        # Step 2: Extract JSON
        parsed = extract_json(raw_response)
        if not parsed:
            print("\n📄 Raw response:")
            print(raw_response[:500])
            print("\n❌ Pipeline failed at Step 2")
            continue
        
        # Show parsed JSON
        print("\n📊 Parsed JSON:")
        print(json.dumps(parsed, indent=2, ensure_ascii=False))
        
        # Step 3: Validate
        valid, msg = validate_data(parsed)
        if not valid:
            print(f"\n❌ Validation failed: {msg}")
            continue
        
        # Ask to save
        try:
            save_choice = input("\n💾 Save to database? (y/n): ").strip().lower()
        except:
            save_choice = "n"
        
        if save_choice != "y":
            print("    ⏭️ Skipping save")
            continue
        
        # Step 4: Save
        doc_id = save_to_db(parsed, user_input)
        if not doc_id:
            print("\n❌ Pipeline failed at Step 4")
            continue
        
        # Step 5: Reload
        reloaded = reload_from_db(doc_id)
        if not reloaded:
            print("\n❌ Pipeline failed at Step 5")
            continue
        
        # Step 6: Verify
        verify_roundtrip(parsed, reloaded)
        
        print()


if __name__ == "__main__":
    main()
