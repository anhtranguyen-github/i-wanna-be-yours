"""
Artifact Service - CRUD operations for AI-generated artifacts.
Uses MongoDB for flexible schema storage.
Artifacts can have any fields in metadata and data - no validation here.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from bson import ObjectId
from database.mongo import get_artifacts_collection


class ArtifactService:
    """
    Service for managing AI-generated artifacts.
    
    Artifacts are stored with flexible schema:
    - metadata: Any fields the AI generates (level, skill, tags, etc.)
    - data: Any structure (cards for flashcards, questions for quizzes, etc.)
    
    No validation is performed - store whatever is sent.
    Filtering and validation is done by other services.
    """

    @staticmethod
    def create_artifact(
        user_id: str,
        artifact_type: str,
        title: str,
        data: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None,
        conversation_id: Optional[str] = None,
        message_id: Optional[str] = None,
        save_to_library: bool = False
    ) -> Dict[str, Any]:
        """
        Create a new artifact in MongoDB.
        
        Args:
            user_id: Owner of the artifact
            artifact_type: flashcard_single, flashcard_deck, quiz, exam, etc.
            title: Display title
            data: Artifact content (any structure)
            metadata: Optional metadata (any fields)
            conversation_id: Optional link to chat session
            message_id: Optional link to specific message
            save_to_library: Whether to mark as saved
            
        Returns:
            Created artifact document with _id
        """
        collection = get_artifacts_collection()
        
        now = datetime.utcnow()
        doc = {
            "userId": user_id,
            "conversationId": conversation_id,
            "messageId": message_id,
            "type": artifact_type,
            "title": title,
            "data": data,                    # Store as-is, no validation
            "metadata": metadata or {},       # Store as-is, any fields
            "createdAt": now,
            "updatedAt": now,
            "savedToLibrary": save_to_library,
            "source": "hanachan",
            "isPublic": False
        }
        
        result = collection.insert_one(doc)
        doc["_id"] = str(result.inserted_id)
        
        return doc

    @staticmethod
    def get_artifact(artifact_id: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Get artifact by ID.
        
        Args:
            artifact_id: MongoDB ObjectId as string
            user_id: Optional - if provided, only return if user owns it
            
        Returns:
            Artifact document or None
        """
        collection = get_artifacts_collection()
        
        query = {"_id": ObjectId(artifact_id)}
        if user_id:
            query["userId"] = user_id
            
        doc = collection.find_one(query)
        if doc:
            doc["_id"] = str(doc["_id"])
        return doc

    @staticmethod
    def get_user_artifacts(
        user_id: str,
        artifact_type: Optional[str] = None,
        saved_only: bool = False,
        limit: int = 50,
        skip: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Get artifacts for a user.
        
        Args:
            user_id: User's ID
            artifact_type: Optional filter by type
            saved_only: Only return artifacts saved to library
            limit: Max results
            skip: Pagination offset
            
        Returns:
            List of artifact documents
        """
        collection = get_artifacts_collection()
        
        query: Dict[str, Any] = {"userId": user_id}
        if artifact_type:
            query["type"] = artifact_type
        if saved_only:
            query["savedToLibrary"] = True
            
        cursor = collection.find(query).sort("createdAt", -1).skip(skip).limit(limit)
        
        artifacts = []
        for doc in cursor:
            doc["_id"] = str(doc["_id"])
            artifacts.append(doc)
            
        return artifacts

    @staticmethod
    def save_to_library(artifact_id: str, user_id: str) -> bool:
        """
        Mark artifact as saved to user's library.
        
        Args:
            artifact_id: Artifact to save
            user_id: User making the request (for ownership check)
            
        Returns:
            True if updated, False if not found/not owned
        """
        collection = get_artifacts_collection()
        
        result = collection.update_one(
            {"_id": ObjectId(artifact_id), "userId": user_id},
            {
                "$set": {
                    "savedToLibrary": True,
                    "updatedAt": datetime.utcnow()
                }
            }
        )
        
        return result.modified_count > 0

    @staticmethod
    def update_artifact(
        artifact_id: str,
        user_id: str,
        updates: Dict[str, Any]
    ) -> bool:
        """
        Update artifact fields.
        
        Args:
            artifact_id: Artifact to update
            user_id: User making the request
            updates: Fields to update (title, metadata, data, etc.)
            
        Returns:
            True if updated
        """
        collection = get_artifacts_collection()
        
        # Always update updatedAt
        updates["updatedAt"] = datetime.utcnow()
        
        result = collection.update_one(
            {"_id": ObjectId(artifact_id), "userId": user_id},
            {"$set": updates}
        )
        
        return result.modified_count > 0

    @staticmethod
    def add_cards_to_deck(artifact_id: str, user_id: str, cards: List[Dict[str, Any]]) -> bool:
        """
        Add cards to an existing flashcard deck.
        
        Args:
            artifact_id: Flashcard deck artifact
            user_id: User making the request
            cards: Cards to add
            
        Returns:
            True if updated
        """
        collection = get_artifacts_collection()
        
        result = collection.update_one(
            {"_id": ObjectId(artifact_id), "userId": user_id, "type": {"$in": ["flashcard_deck", "flashcard"]}},
            {
                "$push": {"data.cards": {"$each": cards}},
                "$set": {"updatedAt": datetime.utcnow()}
            }
        )
        
        return result.modified_count > 0

    @staticmethod
    def delete_artifact(artifact_id: str, user_id: str) -> bool:
        """
        Delete an artifact.
        
        Args:
            artifact_id: Artifact to delete
            user_id: User making the request
            
        Returns:
            True if deleted
        """
        collection = get_artifacts_collection()
        
        result = collection.delete_one(
            {"_id": ObjectId(artifact_id), "userId": user_id}
        )
        
        return result.deleted_count > 0

    @staticmethod
    def get_conversation_artifacts(
        conversation_id: str,
        user_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get all artifacts created in a conversation.
        
        Args:
            conversation_id: Chat session ID
            user_id: Optional ownership check
            
        Returns:
            List of artifacts from that conversation
        """
        collection = get_artifacts_collection()
        
        query: Dict[str, Any] = {"conversationId": conversation_id}
        if user_id:
            query["userId"] = user_id
            
        cursor = collection.find(query).sort("createdAt", 1)
        
        artifacts = []
        for doc in cursor:
            doc["_id"] = str(doc["_id"])
            artifacts.append(doc)
            
        return artifacts
