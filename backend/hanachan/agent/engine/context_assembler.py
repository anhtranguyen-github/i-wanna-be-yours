import asyncio
import logging
from typing import List, Optional, Dict, Any
from schemas.context import LearnerContext
from agent.engine.retrievers.resource_retriever import ResourceRetriever
from agent.engine.retrievers.memory_retriever import MemoryRetriever
from agent.engine.retrievers.artifact_retriever import ArtifactRetriever
from agent.engine.retrievers.study_retriever import StudyRetriever

logger = logging.getLogger(__name__)

class ContextAssembler:
    """
    The 'Aperture'. 
    Coordinates parallel retrieval from all system memory sources.
    Hides 'guts' and ensures fixed-latency retrieval.
    """
    
    def __init__(self, memory_manager):
        self.memory_manager = memory_manager
        self.resource_retriever = ResourceRetriever(memory_manager)
        self.memory_retriever = MemoryRetriever(memory_manager)
        self.artifact_retriever = ArtifactRetriever()
        self.study_retriever = StudyRetriever(memory_manager)
    
    async def assemble(self, 
                       query: str, 
                       user_id: str, 
                       resource_ids: List[str] = None, 
                       token: str = None,
                       timeout: float = 5.0) -> LearnerContext:
        """
        Gathers all context in parallel.
        [SYSTEM] Parallel Fan-Out implementation.
        """
        logger.info(f"🛰️ [Aperture] Starting parallel retrieval for user: {user_id}")
        
        # Define tasks for fan-out
        tasks = [
            self.resource_retriever.get_resources(query, user_id, resource_ids or [], token),
            self.memory_retriever.get_memories(query, user_id, token),
            self.study_retriever.get_study_state(user_id, token),
            self.artifact_retriever.get_recent_artifacts(user_id)
        ]
        
        try:
            # Parallel Fan-Out with strict timeout
            results = await asyncio.wait_for(asyncio.gather(*tasks), timeout=timeout)
            
            # Unpack results
            resources, memories, study_state, artifacts = results
            
            context = LearnerContext(
                resources=resources,
                memories=memories,
                study_state=study_state,
                artifacts=artifacts
            )
            
            logger.info("✅ [Aperture] Concluded parallel context assembly.")
            return context
            
        except asyncio.TimeoutError:
            logger.warning("🕒 [Aperture] Context assembly TIMED OUT. Providing partial/empty context.")
            return LearnerContext()
        except Exception as e:
            logger.error(f"❌ [Aperture] Retrieval failure: {e}")
            return LearnerContext()
