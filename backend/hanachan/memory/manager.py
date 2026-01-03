from typing import Dict, Any, List
from services.llm_factory import ModelFactory
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.documents import Document
from pydantic import BaseModel, Field
import os
import uuid
import json
import logging
import time

import logging
from rq import Retry

logger = logging.getLogger("hanachan.memory")

# Define Pydantic models for Knowledge Graph extraction
class Node(BaseModel):
    id: str = Field(description="Unique identifier for the node")
    type: str = Field(description="The type of the node")
    properties: Dict[str, Any] = Field(default_factory=dict)

class Relationship(BaseModel):
    source: Node
    target: Node
    type: str
    properties: Dict[str, Any] = Field(default_factory=dict)

class KnowledgeGraph(BaseModel):
    relationships: List[Relationship] = Field(default_factory=list)

class MemoryManager:
    def __init__(self):
        # 1. Initialize Queue FIRST for non-blocking operations
        self.queue = None
        try:
            from services.queue_factory import get_queue
            self.queue = get_queue()
            logger.info("MemoryManager: Background queue initialized.")
        except Exception as e:
            logger.error(f"MemoryManager: Failed to initialize background queue: {e}")

        # 2. Initialize live services (each independently to allow partial degradation)
        self.active = False
        self.episodic = None
        self.resource_memory = None
        self.semantic = None
        self.study = None
        self.llm = None
        
        # Initialize Episodic Memory (Qdrant)
        try:
            from .episodic import EpisodicMemory
            logger.debug("MemoryManager: Initializing EpisodicMemory...")
            self.episodic = EpisodicMemory()
            logger.info("MemoryManager: ✅ Episodic Memory (Qdrant) initialized.")
        except Exception as e:
            logger.warning(f"MemoryManager: ⚠️ Episodic Memory init failed: {e}")
        
        # Initialize Resource Memory (Qdrant - separate collection)
        try:
            from .episodic import EpisodicMemory
            logger.debug("MemoryManager: Initializing Resource Memory...")
            self.resource_memory = EpisodicMemory(collection_name="resource_vectors")
            logger.info("MemoryManager: ✅ Resource Memory (Qdrant) initialized.")
        except Exception as e:
            logger.warning(f"MemoryManager: ⚠️ Resource Memory init failed: {e}")
        
        # Initialize Semantic Memory (Neo4j)
        try:
            from .semantic import SemanticMemory
            logger.debug("MemoryManager: Initializing SemanticMemory...")
            self.semantic = SemanticMemory()
            if self.semantic and self.semantic.graph:
                logger.info("MemoryManager: ✅ Semantic Memory (Neo4j) initialized.")
            else:
                logger.warning("MemoryManager: ⚠️ Semantic Memory initialized but Neo4j not connected.")
        except Exception as e:
            logger.warning(f"MemoryManager: ⚠️ Semantic Memory init failed: {e}")
        
        # Initialize Study Memory (External API)
        try:
            from .study import StudyMemory
            logger.debug("MemoryManager: Initializing StudyMemory...")
            self.study = StudyMemory()
            logger.info("MemoryManager: ✅ Study Memory initialized.")
        except Exception as e:
            logger.warning(f"MemoryManager: ⚠️ Study Memory init failed: {e}")
        
        # Set active if any memory service is available
        if self.episodic or self.semantic:
            self.active = True
            logger.info("MemoryManager: Live memory services are active.")

        # 3. Initialize LLM
        try:
            self.llm = ModelFactory.create_chat_model(temperature=0)
            logger.debug("MemoryManager: Memory LLM initialized.")
        except Exception as e:
            logger.error(f"MemoryManager: Memory LLM init failed: {e}")

    def retrieve_resource_context(self, query: str, user_id: str, resource_ids: List[str], token: str = None) -> str:
        """Retrieves relevant chunks from attached resources via NRS (MICROSERVICE)."""
        if not resource_ids or not user_id:
            return ""
            
        try:
            import requests
            # NRS_URL is http://localhost:5300/v1/resources
            # Note: We call it through the Express proxy if possible, but internal cluster call is fine too.
            # Local dev: http://localhost:5300/v1/resources/search
            nrs_api = os.environ.get("NRS_API_URL", "http://localhost:5300/v1/resources")
            headers = {"Authorization": f"Bearer {token}"} if token else {}
            
            # Form-encoded or JSON? Routes expect Form/JSON depending on implementation.
            # My NRS routes use Form for search or Body?
            # Let's check NRS routes again.
            
            payload = {
                "query": query,
                "resource_ids": resource_ids, # List
                "limit": 5
            }
            
            # NRS Search API (Async backend, but we call it sync here)
            resp = requests.post(f"{nrs_api}/search", data=payload, headers=headers)
            if resp.ok:
                results = resp.json()
                context_str = ""
                for doc in results:
                    title = doc["metadata"].get("title", "Unknown Source")
                    context_str += f"\n[Source: {title}]:\n{doc['content']}\n"
                return context_str.strip()
            else:
                logger.error(f"NRS Search failed: {resp.status_code} - {resp.text}")
                
        except Exception as e:
            logger.error(f"Error retrieving resource context from NRS: {e}")
        return ""

    def retrieve_context(self, query: str, user_id: str, token: str = None) -> str:
        """Retrieves formatted context from both memory stores, scoped to user."""
        if not self.active or not user_id:
            return ""

        start_time = time.time()
        try:
            episodic_context = self.episodic.retrieve(query, user_id=user_id) if self.episodic else ""
            semantic_context = self.semantic.retrieve(user_id=user_id, query=query, limit=5) if self.semantic else ""
            study_context = self.study.retrieve_learner_context(user_id=user_id, token=token) if self.study else ""
            
            context_parts = []
            if study_context:
                context_parts.append(study_context)
            if episodic_context:
                context_parts.append(f"Relevant Past Conversations:\n{episodic_context}")
            if semantic_context and "No semantic memories" not in semantic_context:
                context_parts.append(f"Relevant Facts from Knowledge Graph:\n{semantic_context}")
                
            elapsed = time.time() - start_time
            logger.info(f"MemoryManager: Retrieval completed in {elapsed:.2f}s for user {user_id}")
            
            if context_parts:
                return "--- MEMORY CONTEXT ---\n" + "\n\n".join(context_parts) + "\n"
            return ""
        except Exception as e:
            logger.error(f"MemoryManager: Context retrieval error: {e}")
            return ""

    def save_interaction(self, session_id: str, user_id: str, user_message: str, agent_response: str):
        """
        Offload memory processing to the background worker.
        """
        if not self.queue:
            logger.warning("MemoryManager: Cannot save interaction, background queue is unavailable.")
            return

        try:
            from tasks.memory import process_interaction
            
            job = self.queue.enqueue(
                process_interaction,
                session_id=session_id,
                user_id=user_id,
                user_message=user_message,
                agent_response=agent_response,
                retry=Retry(max=3, interval=[60, 300, 600])
            )
            logger.info(f"MemoryManager: Enqueued background task {job.id} for session {session_id}")
            
        except Exception as e:
            logger.error(f"MemoryManager: Failed to enqueue background task: {e}")

    def _parse_json_safely(self, text: str) -> Dict[str, Any]:
        """Robust JSON extraction from LLM output."""
        try:
            return json.loads(text)
        except:
            try:
                start = text.find('{')
                end = text.rfind('}') + 1
                if start != -1 and end > start:
                    return json.loads(text[start:end])
            except Exception as e:
                logger.warning(f"MemoryManager: JSON parse failed: {e}")
        return {}

_memory_manager_instance = None

def get_memory_manager():
    """
    Returns the singleton instance of MemoryManager.
    """
    global _memory_manager_instance
    if _memory_manager_instance is None:
        logger.info("Initializing MemoryManager Singleton...")
        _memory_manager_instance = MemoryManager()
    return _memory_manager_instance
