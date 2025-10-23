

# --- Configuration ---
import os
from langchain_openai import ChatOpenAI, OpenAIEmbeddings


LLM_MODEL = os.environ.get("LLM_MODEL", "gpt-4o-mini")
EMBEDDING_MODEL = os.environ.get("EMBEDDING_MODEL", "text-embedding-3-small")

class FlexibleModels:
    """A container for flexible LLM and Embedding models."""
    def __init__(self, mode: str = "HYBRID"):
        # Use a faster/cheaper model for FAST mode logic decisions
        model_name = "gpt-3.5-turbo" if mode == "FAST" else LLM_MODEL
        
        # Instantiate LLMs (one for text, one for JSON output)
        self.llm = ChatOpenAI(model=model_name, temperature=0.1)
        # Use structured output for reliable routing/grading
        self.json_llm = ChatOpenAI(
            model=model_name, 
            temperature=0, 
            model_kwargs={"response_format": {"type": "json_object"}}
        )
        
        self.embeddings = OpenAIEmbeddings(model=EMBEDDING_MODEL)

