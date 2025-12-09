from app import create_app
from database.database import db

def init_db():
    app = create_app()
    with app.app_context():
        try:
            print("Creating database tables...", flush=True)
            # Import all models to ensure they are registered
            from models.action import ProposedTask, Suggestion
            from models.content.flashcard import FlashcardSet, Flashcard
            from models.content.mindmap import Mindmap, MindmapNode
            from models.content.audio import AudioContent
            from models.message import ChatMessage
            from models.conversation import Conversation
            from models.resource import Resource
            from models.artifact import MessageArtifact, Citation
            
            db.create_all()
            print("Database tables created successfully.", flush=True)
        except Exception as e:
            print(f"Error creating tables: {e}", flush=True)

if __name__ == "__main__":
    init_db()
