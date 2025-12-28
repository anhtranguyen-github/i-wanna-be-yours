"""
Database Table Creation Script
Creates all SQLAlchemy models that don't exist yet.
"""
import sys
sys.path.insert(0, '/app')

from database.database import db
from models.episode import Episode
from models.memory_job import MemoryJob
from app import create_app

def create_tables():
    app = create_app()
    with app.app_context():
        db.create_all()
        print("✅ Database tables created successfully!")
        
        # Verify tables exist
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        print(f"📋 Available tables: {tables}")

if __name__ == "__main__":
    create_tables()
