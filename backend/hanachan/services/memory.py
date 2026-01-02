import uuid
from typing import List, Dict, Optional
from datetime import datetime
import os
import logging
from memory.episodic import EpisodicMemory

logger = logging.getLogger(__name__)

class MemoryService:
    def __init__(self):
        # We reuse the EpisodicMemory class for both types of storage in Qdrant
        self.episodic_db = EpisodicMemory(collection_name="episodic_memory")
        self.semantic_db = EpisodicMemory(collection_name="semantic_memory")

    def add_episodic_memory(self, user_id: str, text: str, metadata: Optional[Dict] = None):
        """Store an event or interaction in episodic memory."""
        if metadata is None:
            metadata = {}
        
        metadata["timestamp"] = datetime.now().isoformat()
        metadata["type"] = "episodic"
        metadata["source"] = metadata.get("source", "agent")
        
        self.episodic_db.add_memory(text, user_id, metadata)

    def retrieve_episodic_memory(self, user_id: str, query: str, n_results: int = 3) -> List[Dict]:
        """Retrieve relevant episodic memories for a user."""
        # The EpisodicMemory.get_recent_memories or retrieve can be used.
        # For the dashboard, we usually want recent ones. For AI, we want similarity search.
        if query == "recent":
            return self.episodic_db.get_recent_memories(user_id, limit=n_results)
        
        # If it's a real query, we do similarity search
        try:
            from qdrant_client.http import models
            must_conditions = [
                models.FieldCondition(
                    key="metadata.user_id",
                    match=models.MatchValue(value=str(user_id))
                )
            ]
            filter_condition = models.Filter(must=must_conditions)
            
            docs = self.episodic_db.vector_store.similarity_search(
                query, 
                k=n_results,
                filter=filter_condition
            )
            
            memories = []
            for doc in docs:
                memories.append({
                    "content": doc.page_content,
                    "metadata": doc.metadata
                })
            return memories
        except Exception as e:
            logger.error(f"Error in retrieve_episodic_memory: {e}")
            return []

    def add_semantic_fact(self, user_id: str, fact: str, category: str = "general"):
        """Store a factual piece of information about the user."""
        metadata = {
            "category": category,
            "timestamp": datetime.now().isoformat(),
            "type": "semantic"
        }
        self.semantic_db.add_memory(fact, user_id, metadata)

    def retrieve_semantic_facts(self, user_id: str, query: str = "", n_results: int = 5) -> List[Dict]:
        """Retrieve semantic facts from Qdrant."""
        search_query = query if query else "user personality facts"
        
        try:
            from qdrant_client.http import models
            must_conditions = [
                models.FieldCondition(
                    key="metadata.user_id",
                    match=models.MatchValue(value=str(user_id))
                )
            ]
            filter_condition = models.Filter(must=must_conditions)
            
            docs = self.semantic_db.vector_store.similarity_search(
                search_query, 
                k=n_results,
                filter=filter_condition
            )
            
            facts = []
            for doc in docs:
                facts.append({
                    "fact": doc.page_content,
                    "metadata": doc.metadata
                })
            return facts
        except Exception as e:
            logger.error(f"Error in retrieve_semantic_facts: {e}")
            return []

    def get_memory_stats(self, user_id: str) -> Dict[str, int]:
        """Returns the count of episodic and semantic memories for a user in Qdrant."""
        try:
            from qdrant_client.http import models
            
            def count_for_user(client, coll, uid):
                res = client.count(
                    collection_name=coll,
                    count_filter=models.Filter(
                        must=[models.FieldCondition(key="metadata.user_id", match=models.MatchValue(value=str(uid)))]
                    )
                )
                return res.count

            return {
                "episodic_count": count_for_user(self.episodic_db.client, "episodic_memory", user_id),
                "semantic_count": count_for_user(self.semantic_db.client, "semantic_memory", user_id)
            }
        except Exception as e:
            logger.error(f"Error fetching memory stats: {e}")
            return {"episodic_count": 0, "semantic_count": 0}
