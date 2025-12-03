import pymongo
from datetime import datetime
import uuid
from typing import List, Dict, Any, Optional
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
import logging

logger = logging.getLogger(__name__)

class ChatRepository:
    """Handles all database interactions for chat and resources."""
    def __init__(self, db_config: Dict[str, Any]):
        self.client = pymongo.MongoClient(
            host=db_config.get("host", "localhost"),
            port=db_config.get("port", 27017)
        )
        self.db_name = db_config.get("name", "hanachan_db")
        self.db = self.client[self.db_name]
        logger.info(f"Connected to MongoDB: {self.db_name}")

    def get_user_conversations(self, user_id: str) -> List[Dict[str, Any]]:
        if not user_id:
            return []
        cursor = self.db.chat_history.find(
            {"user_id": user_id},
            {"messages": 0}
        ).sort("updated_at", -1)
        return [doc for doc in cursor]

    def delete_conversation(self, conversation_id: str, user_id: str) -> bool:
        result = self.db.chat_history.delete_one({"conversation_id": conversation_id, "user_id": user_id})
        return result.deleted_count > 0

    def get_conversation_history(self, conversation_id: str, user_id: str = None) -> List[BaseMessage]:
        if not conversation_id:
            return []
        query = {"conversation_id": conversation_id}
        if user_id:
            query["user_id"] = user_id
            
        history = self.db.chat_history.find_one(query)
        if not history:
            return []
            
        messages = []
        for msg in history.get("messages", []):
            if msg["speaker"] == "USER":
                messages.append(HumanMessage(content=msg["text"]))
            elif msg["speaker"] == "AGENT":
                messages.append(AIMessage(content=msg["text"]))
        return messages

    def get_history_json(self, conversation_id: str, user_id: str = None) -> List[Dict[str, Any]]:
        if not conversation_id:
            return []
        query = {"conversation_id": conversation_id}
        if user_id:
            query["user_id"] = user_id
        history = self.db.chat_history.find_one(query)
        return history.get("messages", []) if history else []

    def save_message(self, conversation_id: str, user_id: str, speaker: str, text: str, title: str = None):
        if not conversation_id:
            return

        message_entry = {
            "speaker": speaker,
            "text": text,
            "timestamp": datetime.now().isoformat()
        }
        
        update_fields = {
            "$push": {"messages": message_entry},
            "$set": {"updated_at": datetime.now()},
            "$setOnInsert": {
                "conversation_id": conversation_id,
                "user_id": user_id,
                "created_at": datetime.now(),
                "title": title or "New Conversation"
            }
        }
        if title:
             update_fields["$set"]["title"] = title

        self.db.chat_history.update_one(
            {"conversation_id": conversation_id},
            update_fields,
            upsert=True
        )

    def create_resource(self, user_id: str, type: str, content: str, title: str) -> Dict[str, Any]:
        resource_id = str(uuid.uuid4())
        resource = {
            "resource_id": resource_id,
            "user_id": user_id,
            "type": type,
            "content": content,
            "title": title,
            "created_at": datetime.now().isoformat()
        }
        self.db.resources.insert_one(resource)
        resource.pop("_id")
        return resource

    def get_user_resources(self, user_id: str) -> List[Dict[str, Any]]:
        cursor = self.db.resources.find({"user_id": user_id}).sort("created_at", -1)
        return [doc for doc in cursor if doc.pop("_id", None) is not None or True] # Pop _id

    def delete_resource(self, resource_id: str, user_id: str) -> bool:
        result = self.db.resources.delete_one({"resource_id": resource_id, "user_id": user_id})
        return result.deleted_count > 0
