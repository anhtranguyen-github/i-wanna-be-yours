import os
from motor.motor_asyncio import AsyncIOMotorClient
import logging

logger = logging.getLogger(__name__)

class MongoManager:
    _instance = None
    _client = None
    _db = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        mongo_uri = os.environ.get("MONGO_URI", "mongodb://localhost:27017/flaskFlashcardDB")
        try:
            self._client = AsyncIOMotorClient(mongo_uri)
            # Parse DB name from URI or use default
            db_name = mongo_uri.split('/')[-1].split('?')[0] or "flaskFlashcardDB"
            self._db = self._client[db_name]
            logger.info(f"🍃 [ASYNC] Connected to MongoDB: {db_name}")
        except Exception as e:
            logger.error(f"❌ Failed to connect to MongoDB: {e}")
            raise e

    @property
    def db(self):
        return self._db

    def get_collection(self, name):
        return self._db[name]

def get_db():
    return MongoManager.get_instance().db
