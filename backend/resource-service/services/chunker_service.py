import logging
import asyncio
from typing import List, Optional
from langchain_text_splitters import RecursiveCharacterTextSplitter
from .llm_factory import ModelFactory

logger = logging.getLogger(__name__)

class ChunkerService:
    """Handles different chunking strategies (Asynchronous)."""

    def __init__(self, chunk_size: int = 800, chunk_overlap: int = 100):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk_recursive(self, text: str) -> List[str]:
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            separators=["\n\n", "\n", ".", "!", "?", ",", " ", ""]
        )
        return splitter.split_text(text)

    async def chunk_semantic(self, text: str) -> List[str]:
        """Semantic chunking based on embedding similarity (Async)."""
        try:
            from langchain_experimental.text_splitter import SemanticChunker
            
            # Embeddings are usually sync in current LangChain versions but can be run in executor
            embeddings = ModelFactory.create_embeddings()
            splitter = SemanticChunker(embeddings, breakpoint_threshold_type="percentile")
            
            # Since SemanticChunker.split_text is sync, run in executor
            loop = asyncio.get_event_loop()
            chunks = await loop.run_in_executor(None, splitter.split_text, text)
            
            logger.info(f"Semantic chunking completed: {len(chunks)} chunks.")
            return chunks
        except Exception as e:
            logger.error(f"Semantic chunking failed: {e}. Falling back to recursive.")
            return self.chunk_recursive(text)

    async def chunk_content(self, text: str, strategy: str = "recursive") -> List[str]:
        if strategy == "semantic":
            return await self.chunk_semantic(text)
        return self.chunk_recursive(text)
