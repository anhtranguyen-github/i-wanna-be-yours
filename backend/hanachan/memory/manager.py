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

# Set up logging
logging.basicConfig(level=logging.INFO)
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
        # Configuration
        self.memory_mode = os.environ.get("MEMORY_MODE", "live").lower()
        self.use_mock = self.memory_mode == "mock"
        
        self.episodic = None
        self.semantic = None
        self.llm = None

        if not self.use_mock:
            try:
                # Lazy imports of memory sub-modules to prevent top-level hang
                from .episodic import EpisodicMemory
                from .semantic import SemanticMemory
                
                logger.info(f"MemoryManager: Initializing live services...")
                
                logger.debug("MemoryManager: Connecting to EpisodicMemory...")
                self.episodic = EpisodicMemory()
                logger.debug("MemoryManager: EpisodicMemory OK")
                
                logger.debug("MemoryManager: Connecting to SemanticMemory...")
                self.semantic = SemanticMemory()
                logger.debug("MemoryManager: SemanticMemory OK")
                
                logger.debug("MemoryManager: Creating Chat Model...")
                # Use Factory for LLM
                self.llm = ModelFactory.create_chat_model(temperature=0)
                logger.debug("MemoryManager: Chat Model OK")
                
                logger.info("MemoryManager: Live services successfully initialized.")
            except Exception as e:
                logger.error(f"MemoryManager: Live services init failed: {e}. Falling back to safe mode.")
                self.use_mock = True
        
        if self.use_mock:
            logger.info("MemoryManager: Operating in MOCK mode.")

    def retrieve_context(self, query: str) -> str:
        """Retrieves formatted context from both memory stores with timing and logging."""
        if self.use_mock:
            return "--- MOCK MEMORY CONTEXT ---\nRelevant Past Conversations:\n- User expressed interest in Japanese JLPT N2 level.\nRelevant Facts found in Knowledge Graph:\nUser --[WANTS_TO_LEARN]--> JLPT_N2\n"

        start_time = time.time()
        try:
            episodic_context = self.episodic.retrieve(query)
            semantic_context = self.semantic.retrieve(query, limit=5)
            
            context_parts = []
            if episodic_context:
                context_parts.append(f"Relevant Past Conversations:\n{episodic_context}")
            if semantic_context and "No semantic memories" not in semantic_context:
                context_parts.append(f"Relevant Facts from Knowledge Graph:\n{semantic_context}")
                
            elapsed = time.time() - start_time
            logger.info(f"MemoryManager: Retrieval completed in {elapsed:.2f}s")
            
            if context_parts:
                return "--- MEMORY CONTEXT ---\n" + "\n\n".join(context_parts) + "\n"
            return ""
        except Exception as e:
            logger.error(f"MemoryManager: Context retrieval error: {e}")
            return ""

    def save_interaction(self, session_id: str, user_message: str, agent_response: str):
        """
        Offload memory processing to the background worker.
        """
        try:
            from services.queue_factory import get_queue
            from tasks.memory import process_interaction
            
            q = get_queue()
            job = q.enqueue(
                process_interaction,
                session_id=session_id,
                user_message=user_message,
                agent_response=agent_response
            )
            logger.info(f"MemoryManager: Enqueued background task {job.id} for session {session_id}")
            
        except Exception as e:
            logger.error(f"MemoryManager: Failed to enqueue background task: {e}")
            # Fail soft: Chat continues even if memory fails

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
