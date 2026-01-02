import chromadb
from chromadb.config import Settings
import uuid
from typing import List, Dict, Optional
from datetime import datetime
import os

class MemoryService:
    def __init__(self, persistence_path: str = "./chroma_db"):
        self.client = chromadb.PersistentClient(path=persistence_path)
        # Episodic Memory Collection
        self.episodic_collection = self.client.get_or_create_collection(name="episodic_memory")
        # Semantic Memory Collection (Facts)
        self.semantic_collection = self.client.get_or_create_collection(name="semantic_memory")

    def _generate_id(self) -> str:
        return str(uuid.uuid4())

    def add_episodic_memory(self, user_id: str, text: str, metadata: Optional[Dict] = None):
        """
        Store an event or interaction in episodic memory.
        """
        if metadata is None:
            metadata = {}
        
        metadata["user_id"] = user_id
        metadata["timestamp"] = datetime.now().isoformat()
        metadata["type"] = "episodic"

        self.episodic_collection.add(
            documents=[text],
            metadatas=[metadata],
            ids=[self._generate_id()]
        )

    def retrieve_episodic_memory(self, user_id: str, query: str, n_results: int = 3) -> List[Dict]:
        """
        Retrieve relevant episodic memories for a user.
        """
        results = self.episodic_collection.query(
            query_texts=[query],
            n_results=n_results,
            where={"user_id": user_id}
        )
        
        memories = []
        if results["documents"]:
            for i, doc in enumerate(results["documents"][0]):
                memories.append({
                    "content": doc,
                    "metadata": results["metadatas"][0][i]
                })
        return memories

    def add_semantic_fact(self, user_id: str, fact: str, category: str = "general"):
        """
        Store a factual piece of information about the user (e.g., 'User hates cilantro').
        """
        metadata = {
            "user_id": user_id,
            "category": category,
            "timestamp": datetime.now().isoformat(),
            "type": "semantic"
        }

        self.semantic_collection.add(
            documents=[fact],
            metadatas=[metadata],
            ids=[self._generate_id()]
        )

    def retrieve_semantic_facts(self, user_id: str, query: str = "", n_results: int = 5) -> List[Dict]:
        """
        Retrieve semantic facts. If query is empty, could return recent/random, but Chroma requires query.
        We'll use a generic query if empty or rely on metadata filtering if supported by 'get'.
        For now, we use query.
        """
        if not query:
            # If no query, just get the first N items for the user (not semantic search)
            # functionality limited in pure retrieve by vector without query in simple interface
            # So we enforce query or use a wildcard semantic search
            query = "user facts"

        results = self.semantic_collection.query(
            query_texts=[query],
            n_results=n_results,
            where={"user_id": user_id}
        )

        facts = []
        if results["documents"]:
            for i, doc in enumerate(results["documents"][0]):
                facts.append({
                    "fact": doc,
                    "metadata": results["metadatas"][0][i]
                })
        return facts
