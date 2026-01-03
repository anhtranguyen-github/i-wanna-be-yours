import logging
from typing import List
from schemas.context import ResourceChunk

logger = logging.getLogger(__name__)

class ResourceRetriever:
    def __init__(self, memory_manager):
        self.memory_manager = memory_manager

    async def get_resources(self, query: str, user_id: str, resource_ids: List[str], token: str) -> List[ResourceChunk]:
        """
        Retrieves relevant chunks from documents using RAG.
        """
        if not resource_ids:
            return []
            
        try:
            # Note: The underlying memory_manager method is likely synchronous for now.
            # We wrap it in run_in_executor to keep it non-blocking in the async loop.
            import asyncio
            loop = asyncio.get_event_loop()
            
            raw_context = await loop.run_in_executor(
                None, 
                self.memory_manager.retrieve_resource_context,
                query, user_id, resource_ids, token
            )
            
            if not raw_context:
                return []
                
            # For now, we wrap the whole blob as one chunk. 
            # In a better system, this would return discrete chunks.
            return [ResourceChunk(
                title="Sourced Documents",
                content=raw_context,
                source_id="multi-source"
            )]
        except Exception as e:
            logger.error(f"Error in ResourceRetriever: {e}")
            return []
