import logging
import asyncio
from typing import List, Optional, Dict, Any
from .llm_factory import ModelFactory
from langchain_core.prompts import ChatPromptTemplate
from utils.token_counter import estimate_tokens

logger = logging.getLogger(__name__)

class SummarizerService:
    """Handles high-density summarization (Asynchronous)."""

    def __init__(self, chunk_limit=4000):
        self.chunk_limit = chunk_limit
        self.llm = ModelFactory.create_chat_model(temperature=0.1)

    async def summarize_content(self, title: str, content: str) -> str:
        """Summarizes the content of a single resource (Async)."""
        if not content:
            return "No content to summarize."

        tokens = estimate_tokens(content)
        
        if tokens > self.chunk_limit:
            logger.info(f"Recursive summarization triggered for '{title}' ({tokens} tokens).")
            return await self._recursive_summarize(content, title)
        
        return await self._run_summarization_prompt(content, title)

    async def _run_summarization_prompt(self, text: str, title: str) -> str:
        """Executes the standard summarization prompt (Async)."""
        system_prompt = """
        You are a highly efficient Neural Summarizer. 
        Compress the following document into a high-density, 3-5 sentence summary.
        Keep all proper nouns and technical terms. Focus on core value.
        """
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", f"Document Title: {title}\n\nContent:\n{text}")
        ])
        
        try:
            # Use ainvoke for async LLM call
            response = await self.llm.ainvoke(prompt.format_messages())
            return response.content.strip()
        except Exception as e:
            logger.error(f"Summarization failed for '{title}': {e}")
            return "Summarization currently unavailable."

    async def _recursive_summarize(self, full_text: str, title: str) -> str:
        words = full_text.split()
        chunk_size = 3000
        chunks = [" ".join(words[i:i + chunk_size]) for i in range(0, len(words), chunk_size)]
        
        # Parallel chunk summarization
        tasks = [self._run_summarization_prompt(chunk, f"{title} (Part {i+1})") for i, chunk in enumerate(chunks)]
        summaries = await asyncio.gather(*tasks)
            
        combined_summaries = "\n\n".join(summaries)
        
        if estimate_tokens(combined_summaries) > self.chunk_limit:
            return await self._recursive_summarize(combined_summaries, f"Synthesis: {title}")
        
        return await self._run_summarization_prompt(combined_summaries, f"Final Synthesis: {title}")
