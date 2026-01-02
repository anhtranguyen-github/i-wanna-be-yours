import os
import logging
from typing import Any, List, Optional
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import BaseMessage, AIMessage
from langchain_core.outputs import ChatResult, ChatGeneration

logger = logging.getLogger(__name__)

class ModelFactory:
    @staticmethod
    def _create_provider_model(provider: str, temperature: float) -> BaseChatModel:
        if provider == "openai":
            from langchain_openai import ChatOpenAI
            api_key = os.environ.get("OPENAI_API_KEY")
            model_name = os.environ.get("OPENAI_MODEL_NAME", "gpt-3.5-turbo")
            if not api_key:
                logger.error("LLM_PROVIDER is openai but OPENAI_API_KEY is missing!")
                raise ValueError("OPENAI_API_KEY is required for OpenAI provider")
            
            logger.info(f"ModelFactory: Instantiating OpenAI ({model_name})")
            return ChatOpenAI(
                model=model_name,
                temperature=temperature,
                api_key=api_key
            )
            
        elif provider == "ollama":
            from langchain_ollama import ChatOllama
            base_url = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
            model_name = os.environ.get("CHAT_MODEL", "qwen3:1.7b") # Fallback default
            
            logger.info(f"ModelFactory: Instantiating Ollama ({model_name}) at {base_url}")
            return ChatOllama(
                model=model_name,
                temperature=temperature,
                base_url=base_url
            )
            
        elif provider == "groq":
            # Using OpenAI client compatibility for Groq
            from langchain_openai import ChatOpenAI
            api_key = os.environ.get("GROQ_API_KEY")
            model_name = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
            
            if not api_key:
                logger.error("LLM_PROVIDER is groq but GROQ_API_KEY is missing!")
                raise ValueError("GROQ_API_KEY is required for Groq provider")
                
            logger.info(f"ModelFactory: Instantiating Groq ({model_name})")
            return ChatOpenAI(
                model=model_name,
                temperature=temperature,
                api_key=api_key,
                base_url="https://api.groq.com/openai/v1",
                openai_api_base="https://api.groq.com/openai/v1", # Legacy compat
                max_retries=2 # Reduce retries to fail faster to fallback
            )

        else:
            raise ValueError(f"Unsupported LLM provider: {provider}")

    @staticmethod
    def create_chat_model(temperature: float = 0.7, tools: list = None) -> BaseChatModel:
        """
        Creates a chat model with automatic fallback support and optional tool binding.
        """
        primary_provider = os.environ.get("LLM_PROVIDER", "openai").lower()
        fallback_provider = os.environ.get("LLM_FALLBACK_PROVIDER", "none").lower()
        
        # 1. Create Primary
        try:
            primary_llm = ModelFactory._create_provider_model(primary_provider, temperature)
        except Exception as e:
            logger.error(f"Failed to create primary LLM ({primary_provider}): {e}")
            # Failover immediately for creation errors
            if fallback_provider != "none":
                return ModelFactory._create_provider_model(fallback_provider, temperature)
            raise e

        # 2. Check Fallback
        fallback_llm = None
        if fallback_provider and fallback_provider != "none" and fallback_provider != primary_provider:
             try:
                fallback_llm = ModelFactory._create_provider_model(fallback_provider, temperature)
             except Exception as e:
                logger.warning(f"Failed to create fallback LLM ({fallback_provider}): {e}")

        # Prepare exceptions to handle
        exceptions_to_handle = None
        if "openai" in primary_provider or "groq" in primary_provider:
            try:
                import openai
                exceptions_to_handle = (openai.RateLimitError, openai.APIConnectionError, openai.InternalServerError)
            except ImportError:
                pass

        # 3. Bind Tools (if any)
        if tools:
            try:
                # Bind to primary
                primary_bound = primary_llm.bind_tools(tools)
                
                if fallback_llm:
                    fallback_runnable = fallback_llm
                    # Bind to fallback (Mock doesn't support binding usually, Ollama might feature-flag)
                    if hasattr(fallback_llm, "bind_tools"):
                        try:
                            fallback_bound = fallback_llm.bind_tools(tools)
                            logger.info(f"🛡️ ModelFactory: Fallback '{fallback_provider}' configured with tools.")
                            fallback_runnable = fallback_bound
                        except Exception as tool_e:
                            logger.warning(f"Fallback '{fallback_provider}' does not support tools: {tool_e}")
                            # fallback_runnable stays as fallback_llm
                    else:
                         logger.info(f"🛡️ ModelFactory: Fallback '{fallback_provider}' used without tools (Text-only fallback).")
                    
                    return primary_bound.with_fallbacks([fallback_runnable], exceptions_to_handle=exceptions_to_handle)
                
                return primary_bound
                
            except Exception as e:
                logger.error(f"Tool binding failed on primary: {e}")
                raise e
        
        # 4. No Tools - Simple Fallback
        if fallback_llm:
            logger.info(f"🛡️ ModelFactory: Attached fallback provider '{fallback_provider}' to '{primary_provider}'")
            return primary_llm.with_fallbacks([fallback_llm], exceptions_to_handle=exceptions_to_handle)
            
        return primary_llm

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
            
        elif provider == "ollama" or provider == "groq":
            if provider == "groq":
                logger.info("ModelFactory: Groq provider selected. Using Local Ollama for Embeddings (Groq has no embeddings API).")
            
            from langchain_ollama import OllamaEmbeddings
            base_url = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
            model_name = os.environ.get("EMBEDDING_MODEL", "nomic-embed-text")
            return OllamaEmbeddings(model=model_name, base_url=base_url)
            
        else:
            raise ValueError(f"Unsupported embedding provider: {provider}")
