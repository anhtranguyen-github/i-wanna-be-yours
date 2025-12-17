"""
MongoDB connection and configuration for artifact storage.
Uses flexible schema for storing AI-generated artifacts.
"""
from pymongo import MongoClient
from pymongo.database import Database
from pymongo.collection import Collection
import os

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "hanachan")

# Lazy connection - established on first use
_client: MongoClient = None
_db: Database = None


def get_mongo_client() -> MongoClient:
    """Get or create MongoDB client."""
    global _client
    if _client is None:
        _client = MongoClient(MONGO_URI)
    return _client


def get_database() -> Database:
    """Get the hanachan database."""
    global _db
    if _db is None:
        client = get_mongo_client()
        _db = client[MONGO_DB_NAME]
    return _db


def get_artifacts_collection() -> Collection:
    """Get the artifacts collection."""
    db = get_database()
    return db.artifacts


def init_mongo_indexes():
    """Create indexes for efficient querying."""
    artifacts = get_artifacts_collection()
    
    # Index on userId for user's artifacts
    artifacts.create_index("userId")
    
    # Index on type for filtering by artifact type
    artifacts.create_index("type")
    
    # Compound index for common query patterns
    artifacts.create_index([("userId", 1), ("savedToLibrary", 1)])
    artifacts.create_index([("userId", 1), ("type", 1)])
    
    # Index on conversationId for linking to chats
    artifacts.create_index("conversationId", sparse=True)
    
    # Index on creation time for sorting
    artifacts.create_index("createdAt")
    
    print("✅ MongoDB indexes created for artifacts collection")


def close_mongo_connection():
    """Close MongoDB connection gracefully."""
    global _client, _db
    if _client is not None:
        _client.close()
        _client = None
        _db = None
