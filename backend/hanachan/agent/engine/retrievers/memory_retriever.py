import logging
import asyncio
from typing import List
from schemas.context import MemorySnippet

logger = logging.getLogger(__name__)

class MemoryRetriever:
    def __init__(self, memory_manager):
        self.memory_manager = memory_manager

    async def get_memories(self, query: str, user_id: str, token: str) -> List[MemorySnippet]:
        """
        Retrieves episodic and semantic memories.
        """
        try:
            loop = asyncio.get_event_loop()
            
            # Retrieve from MemoryManager (Synchronous bridge)
            raw_context = await loop.run_in_executor(
                None,
                self.memory_manager.retrieve_context,
                query, user_id, token
            )
            
            if not raw_context:
                return []
                
            return [MemorySnippet(summary=raw_context)]
        except Exception as e:
            logger.error(f"Error in MemoryRetriever: {e}")
            return []
