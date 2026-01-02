import logging
import math
from typing import List, Dict, Any, Optional
from services.llm_factory import ModelFactory
from langchain_core.messages import SystemMessage, HumanMessage
from utils.token_counter import estimate_tokens

logger = logging.getLogger(__name__)

class SummarizerService:
    def __init__(self, model_name: Optional[str] = None):
        # Use lower temperature for consistent summarization
        self.llm = ModelFactory.create_chat_model(temperature=0.3)
        self.chunk_limit = 4000 # Tokens before recursive summarization triggers

    def summarize_messages(self, messages: List[Dict[str, str]], existing_summary: Optional[str] = None) -> str:
        """
        Summarizes a list of messages, incorporating into an existing summary if provided.
        Resource-aware: Instructs the LLM to preserve file/resource references.
        """
        if not messages and not existing_summary:
            return ""

        # 1. Format messages into a block of text
        formatted_history = ""
        for msg in messages:
            role = msg.get('role', 'unknown').upper()
            content = msg.get('content', '')
            # Check for attachments in message if available (though usually handled at service layer)
            attachments = msg.get('attachments', [])
            attachment_text = f" [Files: {', '.join([a.get('title', 'Unknown') for a in attachments])}]" if attachments else ""
            formatted_history += f"{role}: {content}{attachment_text}\n"

        # 2. Check for recursion need
        total_text = formatted_history
        if existing_summary:
            total_text = f"PREVIOUS SUMMARY: {existing_summary}\n\nNEW MESSAGES:\n{formatted_history}"

        token_count = estimate_tokens(total_text)
        if token_count > self.chunk_limit:
            logger.info(f"Recursive summarization triggered ({token_count} tokens)")
            return self._recursive_summarize(total_text)
        
        # 3. Direct summarization
        return self._run_summarization_prompt(total_text)

    def _run_summarization_prompt(self, context_text: str) -> str:
        """Executes the summarization LLM call"""
        system_prompt = (
            "You are a conversation memory assistant for Hanachan.org. "
            "Your goal is to create a concise, high-density summary of a language learning interaction. "
            "STRICT RULES:\n"
            "1. PRESERVE all Resource/File names and IDs mentioned (e.g., 'grammar.pdf').\n"
            "2. FOCUS on what the user learned, what they struggled with, and established facts.\n"
            "3. KEEP it under 200 words.\n"
            "4. INTEGRATE the new info into the previous summary seamlessly."
        )

        try:
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=f"Please update/create the summary for this state:\n\n{context_text}")
            ]
            
            response = self.llm.invoke(messages)
            return response.content.strip()
        except Exception as e:
            logger.error(f"Summarization LLM call failed: {e}")
            return context_text[:1000] + "... [Summarization Failed]"

    def _recursive_summarize(self, large_text: str) -> str:
        """Handles text larger than CHUNK_LIMIT using a tree-reduction approach"""
        words = large_text.split()
        # Rough estimate for chunking (1.3 tokens per word approx)
        words_per_chunk = int(self.chunk_limit / 1.5)
        
        chunks = []
        for i in range(0, len(words), words_per_chunk):
            chunks.append(" ".join(words[i : i + words_per_chunk]))

        logger.info(f"Splitting text into {len(chunks)} segments for recursive reduction.")
        
        summaries = []
        for i, chunk in enumerate(chunks):
            prompt = f"Summarize this segment of a larger conversation (Part {i+1}/{len(chunks)}):\n\n{chunk}"
            try:
                msg = [
                    SystemMessage(content="Summarize this segment briefly, preserving key learning points and file names."),
                    HumanMessage(content=prompt)
                ]
                resp = self.llm.invoke(msg)
                summaries.append(resp.content.strip())
            except Exception as e:
                logger.error(f"Recursive chunk summarization failed: {e}")
                summaries.append(chunk[:200]) # Fallback to snippet

        # Combine and reduce
        combined_summaries = "\n\n".join(summaries)
        if estimate_tokens(combined_summaries) > self.chunk_limit:
            return self._recursive_summarize(combined_summaries)
        
        return self._run_summarization_prompt(combined_summaries)
