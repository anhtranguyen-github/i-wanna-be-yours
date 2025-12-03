import os
import yaml
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class ConfigLoader:
    """Loads and provides access to configuration from config.yaml and agents_config.yaml."""
    def __init__(self, config_path: str = "config.yaml", agents_config_path: str = "agents/config.yaml"):
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        self.config_path = self._resolve_path(config_path)
        self.agents_config_path = self._resolve_path(agents_config_path)
        
        self.config = self._load_yaml(self.config_path)
        self.agents_config = self._load_yaml(self.agents_config_path)

    def _resolve_path(self, path: str) -> str:
        if not os.path.isabs(path):
            return os.path.join(self.base_dir, path)
        return path

    def _load_yaml(self, path: str) -> Dict[str, Any]:
        if not os.path.exists(path):
            logger.warning(f"Config file not found at {path}")
            return {}
        try:
            with open(path, "r", encoding="utf-8") as f:
                config = yaml.safe_load(f)
                return config or {}
        except Exception as e:
            logger.error(f"Error loading config file {path}: {e}")
            raise

    def get_model_config(self, model_name: str = "default") -> Dict[str, Any]:
        models = self.config.get("models", {})
        if model_name not in models:
            raise KeyError(f"Model configuration '{model_name}' not found in config")
        return models[model_name]

    def get_tool_config(self) -> Dict[str, Any]:
        return self.config.get("tools", {})

    def get_agent_config(self, agent_name: str = "default_agent") -> Dict[str, Any]:
        agents = self.agents_config.get("agents", {})
        if agent_name not in agents:
             raise KeyError(f"Agent configuration '{agent_name}' not found in agents config")
        return agents[agent_name]

    def get_prompt(self, prompt_name: str) -> str:
        prompts = self.agents_config.get("prompts", {})
        if prompt_name not in prompts:
            # Fallback to main config if not in agents config (backward compatibility)
            prompts = self.config.get("prompts", {})
            
        if prompt_name not in prompts:
            raise KeyError(f"Prompt '{prompt_name}' not found in config")
        return prompts[prompt_name]
    
    def get_database_config(self) -> Dict[str, Any]:
        return self.config.get("database", {})
