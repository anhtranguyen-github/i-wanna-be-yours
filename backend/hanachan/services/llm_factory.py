import os
import logging
from langchain_core.language_models import BaseChatModel

logger = logging.getLogger(__name__)

class ModelFactory:
    @staticmethod
    def create_chat_model(temperature: float = 0.7) -> BaseChatModel:
        """
        Creates a chat model based on the LLM_PROVIDER environment variable.
        Defaults to 'ollama' if not specified.
        """
        provider = os.environ.get("LLM_PROVIDER", "openai").lower()
        
        if provider == "openai":
            # Lazy import to prevent hang on startup if not using OpenAI
            from langchain_openai import ChatOpenAI
            
            api_key = os.environ.get("OPENAI_API_KEY")
            model_name = os.environ.get("OPENAI_MODEL_NAME", "gpt-3.5-turbo")
            if not api_key:
                logger.error("LLM_PROVIDER is openai but OPENAI_API_KEY is missing!")
                raise ValueError("OPENAI_API_KEY is required for OpenAI provider")
                
            logger.info(f"ModelFactory: Using OpenAI ({model_name})")
            return ChatOpenAI(
                model=model_name,
                temperature=temperature,
                api_key=api_key
            )
            
        elif provider == "ollama":
            # Lazy import
            from langchain_ollama import ChatOllama
            
            base_url = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
            model_name = os.environ.get("CHAT_MODEL", "qwen3:1.7b")
            
            logger.info(f"ModelFactory: Using Ollama ({model_name}) at {base_url}")
            return ChatOllama(
                model=model_name,
                temperature=temperature,
                base_url=base_url
            )
            
        else:
            logger.error(f"Unknown LLM_PROVIDER: {provider}")
            raise ValueError(f"Unsupported LLM provider: {provider}")

    @staticmethod
    def create_embeddings():
        """
        Creates an embedding model based on LLM_PROVIDER.
        """
        provider = os.environ.get("LLM_PROVIDER", "openai").lower()
        
        if provider == "openai":
            from langchain_openai import OpenAIEmbeddings
            api_key = os.environ.get("OPENAI_API_KEY")
            return OpenAIEmbeddings(api_key=api_key)
            
        elif provider == "ollama":
            from langchain_ollama import OllamaEmbeddings
            base_url = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
            model_name = os.environ.get("EMBEDDING_MODEL", "nomic-embed-text")
            return OllamaEmbeddings(model=model_name, base_url=base_url)
            
        else:
            raise ValueError(f"Unsupported embedding provider: {provider}")
