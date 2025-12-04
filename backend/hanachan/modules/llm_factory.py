# llm_factory.py

import os
import yaml
from typing import Dict, Any, Literal
from pydantic import BaseModel
from langchain_core.language_models import BaseChatModel


try:
    from langchain_openai import ChatOpenAI
except ImportError:
    ChatOpenAI = None

from langchain_ollama import ChatOllama 


class MCPServerConfigModel(BaseModel):
    host: str
    port: int

class LLMConfigModel(BaseModel):
    """Schema for a single LLM entry in the YAML file."""
    provider: Literal["openai", "ollama", "anthropic"]
    model_name: str
    temperature: float
    base_url: str = None
    host: str = None 
    num_ctx: int = None # Added for vision models

class ConfigModel(BaseModel):
    """Schema for the entire YAML configuration."""
    system_prompt: str
    mcp_server_config: MCPServerConfigModel
    llm_config: Dict[str, LLMConfigModel]
    tool_config: Dict[str, Any]

# --- Configuration Loader (No Change) ---

def load_config_from_yaml(file_path: str = "config.yaml") -> ConfigModel:
    """
    Loads configuration from a YAML file and validates it using Pydantic.
    """
    try:
        with open(file_path, 'r') as f:
            raw_config = yaml.safe_load(f)
        return ConfigModel(**raw_config)
    except FileNotFoundError:
        raise FileNotFoundError(f"Configuration file not found at: {file_path}. Please create a 'config.yaml' file.")
    except Exception as e:
        raise ValueError(f"Error loading or validating configuration: {e}")


# --- Factory Function (Corrected Ollama Initialization) ---

def create_llm_instance(llm_config: LLMConfigModel) -> BaseChatModel:
    """
    Dynamically creates an LLM instance based on a Pydantic configuration object.
    """
    if llm_config.provider == "openai":
        if ChatOpenAI is None:
            raise ImportError("langchain_openai is not installed. Please install it to use OpenAI models.")
        return ChatOpenAI(
            model=llm_config.model_name,
            temperature=llm_config.temperature
        )
    
    elif llm_config.provider == "ollama":
        # Uses the direct langchain_ollama import
        params = {"model": llm_config.model_name, "temperature": llm_config.temperature}
        if llm_config.base_url:
             params["base_url"] = llm_config.base_url
        elif llm_config.host:
             # Fallback to host if base_url not present
             params["base_url"] = llm_config.host 
        
        if llm_config.num_ctx:
            params["num_ctx"] = llm_config.num_ctx
        
        return ChatOllama(**params)
    
    else:
        raise ValueError(f"Unsupported LLM provider: {llm_config.provider}")