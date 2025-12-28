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

        # 2. Initialize live services
        self.active = False
        self.episodic = None
        self.semantic = None
        self.llm = None
        
        # Lazy imports
        try:
            from .episodic import EpisodicMemory
            from .semantic import SemanticMemory
            
            logger.debug("MemoryManager: Initializing EpisodicMemory...")
            self.episodic = EpisodicMemory()
            self.resource_memory = EpisodicMemory(collection_name="resource_vectors")
            
            logger.debug("MemoryManager: Initializing SemanticMemory...")
            self.semantic = SemanticMemory()
            
            if self.episodic or self.semantic:
                self.active = True
                logger.info("MemoryManager: Live memory services are active.")

    def retrieve_resource_context(self, query: str, user_id: str, resource_ids: List[str]) -> str:
        """Retrieves relevant chunks from attached resources."""
        if not self.resource_memory or not resource_ids or not user_id:
            return ""
            
        try:
            # We filter by resource_id to only search within attached docs
            return self.resource_memory.retrieve(
                query=query, 
                user_id=user_id, 
                k=5, 
                metadata_filter={"resource_id": resource_ids}
            )
        except Exception as e:
            logger.error(f"Error retrieving resource context: {e}")
            return ""
        except Exception as e:
            logger.error(f"MemoryManager: Live services init failed: {e}")

        # 3. Initialize LLM
        try:
            self.llm = ModelFactory.create_chat_model(temperature=0)
            logger.debug("MemoryManager: Memory LLM initialized.")
        except Exception as e:
            logger.error(f"MemoryManager: Memory LLM init failed: {e}")

    def retrieve_context(self, query: str, user_id: str) -> str:
        """Retrieves formatted context from both memory stores, scoped to user."""
        if not self.active or not user_id:
            return ""

        start_time = time.time()
        try:
            episodic_context = self.episodic.retrieve(query, user_id=user_id) if self.episodic else ""
            semantic_context = self.semantic.retrieve(user_id=user_id, query=query, limit=5) if self.semantic else ""
            
            context_parts = []
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
