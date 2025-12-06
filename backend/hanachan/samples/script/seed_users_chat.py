import pymongo
import uuid
from datetime import datetime, timedelta

# Configuration
DB_HOST = 'localhost'
DB_PORT = 27017
DB_NAME = 'hanachan_db'

def get_db():
    client = pymongo.MongoClient(f"mongodb://{DB_HOST}:{DB_PORT}/")
    return client[DB_NAME]

def seed_users(db):
    users_collection = db['users']
    
    # Check if users already exist
    if users_collection.count_documents({}) > 0:
        print("Users already exist. Skipping user seeding.")
        return []

    print("Seeding users...")
    
    users = [
        {
            "id": "user_001",
            "name": "Alice",
            "native_language": "English",
            "target_language": "Japanese",
            "proficiency_level": "Beginner",
            "interests": ["Anime", "Travel", "Food"],
            "learning_goals": [
                {
                    "goal_id": "goal_001",
                    "topic": "Basic Greetings",
                    "status": "ACTIVE",
                    "proficiency_target": "N5",
                    "start_date": datetime.now().isoformat()
                }
            ],
            "created_at": datetime.now()
        },
        {
            "id": "user_002",
            "name": "Bob",
            "native_language": "Spanish",
            "target_language": "Japanese",
            "proficiency_level": "Intermediate",
            "interests": ["History", "Technology"],
            "learning_goals": [],
            "created_at": datetime.now()
        }
    ]
    
    users_collection.insert_many(users)
    print(f"Seeded {len(users)} users.")
    return users

def seed_chat_history(db, users):
    chat_collection = db['chat_history']
    
    # Check if chat history already exists
    if chat_collection.count_documents({}) > 0:
        print("Chat history already exists. Skipping chat history seeding.")
        return

    print("Seeding chat history...")
    
    chat_histories = []
    
    if not users:
        # Fetch users if not passed (e.g. if we skipped seeding)
        users = list(db['users'].find())

    for user in users:
        # Create a couple of conversations for each user
        
        # Conversation 1
        chat_histories.append({
            "conversation_id": str(uuid.uuid4()),
            "user_id": user['id'],
            "title": "Introduction",
            "messages": [
                {
                    "speaker": "USER",
                    "text": "Hello, I want to learn Japanese.",
                    "timestamp": (datetime.now() - timedelta(days=1)).isoformat()
                },
                {
                    "speaker": "AGENT",
                    "text": "Konnichiwa! I can help you with that. Let's start with greetings.",
                    "timestamp": (datetime.now() - timedelta(days=1, minutes=1)).isoformat()
                }
            ],
            "created_at": datetime.now() - timedelta(days=1)
        })
        
        # Conversation 2
        chat_histories.append({
            "conversation_id": str(uuid.uuid4()),
            "user_id": user['id'],
            "title": "Grammar Practice",
            "messages": [
                {
                    "speaker": "USER",
                    "text": "Explain the particle 'wa'.",
                    "timestamp": datetime.now().isoformat()
                },
                {
                    "speaker": "AGENT",
                    "text": "'Wa' is the topic marker. It marks the topic of the sentence.",
                    "timestamp": (datetime.now() + timedelta(minutes=1)).isoformat()
                }
            ],
            "created_at": datetime.now()
        })

    chat_collection.insert_many(chat_histories)
    print(f"Seeded {len(chat_histories)} chat history entries.")

def main():
    try:
        db = get_db()
        print(f"Connected to database: {DB_NAME}")
        
        users = seed_users(db)
        seed_chat_history(db, users)
        
        print("Seeding completed successfully.")
        
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()
