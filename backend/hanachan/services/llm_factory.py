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
                api_key=api_key,
                max_retries=0  # Fail fast for fallback
            )
            
        elif provider == "ollama":
            from langchain_ollama import ChatOllama
            base_url = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
            model_name = os.environ.get("CHAT_MODEL", "qwen3:1.7b") # Fallback default
            
            logger.info(f"ModelFactory: Instantiating Ollama ({model_name}) at {base_url}")
            return ChatOllama(
                model=model_name,
                temperature=temperature,
                base_url=base_url,
                num_predict=-1  # No limit on tokens
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
                max_retries=0  # Fail fast for fallback
            )

        else:
            raise ValueError(f"Unsupported LLM provider: {provider}")

    @staticmethod
    def create_chat_model(temperature: float = 0.7, tools: list = None) -> BaseChatModel:
        """
        Creates a chat model with automatic fallback chain support and optional tool binding.
        
        Environment Variables:
        - LLM_PROVIDER: Primary provider (ollama, groq, openai)
        - LLM_FALLBACK_PROVIDER: Comma-separated fallback providers (e.g., "groq,openai")
        """
        primary_provider = os.environ.get("LLM_PROVIDER", "ollama").lower()
        fallback_config = os.environ.get("LLM_FALLBACK_PROVIDER", "none").lower()
        
        # Parse fallback chain
        fallback_providers = []
        if fallback_config and fallback_config != "none":
            fallback_providers = [p.strip() for p in fallback_config.split(",") if p.strip() and p.strip() != primary_provider]
        
        logger.info(f"🔧 ModelFactory: Primary={primary_provider}, Fallbacks={fallback_providers or 'none'}")
        
        # 1. Create Primary
        try:
            primary_llm = ModelFactory._create_provider_model(primary_provider, temperature)
        except Exception as e:
            logger.error(f"Failed to create primary LLM ({primary_provider}): {e}")
            # Failover immediately for creation errors
            for fb in fallback_providers:
                try:
                    logger.warning(f"⚠️ Failing over to {fb} (creation fallback)")
                    return ModelFactory._create_provider_model(fb, temperature)
                except Exception as fb_e:
                    logger.warning(f"Fallback {fb} also failed: {fb_e}")
            raise e

        # 2. Build Fallback Chain
        fallback_llms = []
        for fb_provider in fallback_providers:
            try:
                fb_llm = ModelFactory._create_provider_model(fb_provider, temperature)
                fallback_llms.append(fb_llm)
                logger.info(f"🛡️ ModelFactory: Added fallback provider '{fb_provider}'")
            except Exception as e:
                logger.warning(f"Failed to create fallback LLM ({fb_provider}): {e}")

        # Prepare exceptions to handle for runtime fallback
        # Include httpx errors for Ollama OOM, rate limits, etc.
        try:
            import httpx
            import openai
            exceptions_to_handle = (
                openai.RateLimitError,
                openai.APIConnectionError,
                openai.InternalServerError,
                openai.APIError,
                httpx.HTTPStatusError,  # Catches Ollama 500 (OOM), 429 (rate limit)
                httpx.ConnectError,     # Connection refused
                Exception  # Catch all as last resort
            )
        except ImportError:
            exceptions_to_handle = (Exception,)

        # 3. Bind Tools (if any)
        if tools:
            try:
                # Bind to primary
                primary_bound = primary_llm.bind_tools(tools)
                
                if fallback_llms:
                    fallback_runnables = []
                    for fb_llm in fallback_llms:
                        if hasattr(fb_llm, "bind_tools"):
                            try:
                                fallback_runnables.append(fb_llm.bind_tools(tools))
                            except Exception as tool_e:
                                logger.warning(f"Fallback does not support tools: {tool_e}")
                                fallback_runnables.append(fb_llm)  # Use without tools
                        else:
                            fallback_runnables.append(fb_llm)
                    
                    return primary_bound.with_fallbacks(fallback_runnables, exceptions_to_handle=exceptions_to_handle)
                
                return primary_bound
                
            except Exception as e:
                logger.error(f"Tool binding failed on primary: {e}")
                raise e
        
        # 4. No Tools - Fallback Chain
        if fallback_llms:
            return primary_llm.with_fallbacks(fallback_llms, exceptions_to_handle=exceptions_to_handle)
            
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
