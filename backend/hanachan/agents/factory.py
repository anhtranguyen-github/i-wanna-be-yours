import os
import logging
from typing import List, Any, Optional, Tuple
from langchain_mcp_adapters.client import MultiServerMCPClient
from modules.llm_factory import create_llm_instance, LLMConfigModel
from config_loader import ConfigLoader

logger = logging.getLogger(__name__)

class AgentFactory:
    """Creates agents (LLM + Tools) based on configuration."""
    def __init__(self, config_loader: ConfigLoader):
        self.config_loader = config_loader
        self.mcp_client: Optional[MultiServerMCPClient] = None
        self._tools_cache: List[Any] = []

    async def _init_mcp_client(self):
        if self.mcp_client:
            return
        
        tool_config = self.config_loader.get_tool_config()
        mcp_servers = tool_config.get("mcp_servers", {})
        
        if mcp_servers:
            # Expand environment variables in config
            expanded_servers = {}
            for server_name, server_config in mcp_servers.items():
                expanded_config = server_config.copy()
                if "env" in expanded_config:
                    expanded_env = {}
                    for key, value in expanded_config["env"].items():
                        expanded_env[key] = os.path.expanduser(value) if isinstance(value, str) else value
                    expanded_config["env"] = expanded_env
                expanded_servers[server_name] = expanded_config
            
            try:
                self.mcp_client = MultiServerMCPClient(expanded_servers)
                logger.info(f"Initialized MCP client with servers: {list(expanded_servers.keys())}")
            except Exception as e:
                logger.error(f"Failed to initialize MCP client: {e}")

    async def get_tools(self) -> List[Any]:
        if self._tools_cache:
            return self._tools_cache
            
        await self._init_mcp_client()
        tools = []
        if self.mcp_client:
            try:
                # MultiServerMCPClient.get_tools() is async
                mcp_tools = await self.mcp_client.get_tools()
                tools.extend(mcp_tools)
            except Exception as e:
                logger.error(f"Error fetching tools from MCP: {e}")
        
        self._tools_cache = tools
        return tools

    async def create_agent(self, agent_name: str = "default_agent") -> Tuple[Any, List[Any], str]:
        """
        Creates an agent instance.
        Returns: (llm_with_tools, tools, system_prompt)
        """
        agent_config = self.config_loader.get_agent_config(agent_name)
        
        # 1. Setup Model
        model_key = agent_config.get("model")
        if not model_key:
            raise KeyError(f"Agent '{agent_name}' missing 'model' reference")
            
        model_conf = self.config_loader.get_model_config(model_key)
        
        # Create LLM using the factory
        try:
            llm_config = LLMConfigModel(**model_conf)
            llm = create_llm_instance(llm_config)
        except Exception as e:
            logger.error(f"Failed to create LLM instance: {e}")
            raise ValueError(f"Invalid model configuration for '{model_key}': {e}")

        # 2. Setup Tools
        all_tools = await self.get_tools()
        
        # Filter tools if agent_config specifies a subset
        # If "tools" key is present, only include tools listed there.
        # If "tools" is [], no tools will be bound.
        # If "tools" is missing, all tools are bound (default behavior).
        if "tools" in agent_config:
            allowed_tool_names = agent_config["tools"]
            tools = [t for t in all_tools if t.name in allowed_tool_names]
        else:
            tools = all_tools

        # Bind tools to LLM
        if tools:
            # Check if the LLM supports tool binding (Ollama usually does, but good to be safe)
            if hasattr(llm, "bind_tools"):
                llm_with_tools = llm.bind_tools(tools)
            else:
                logger.warning(f"Model for agent '{agent_name}' does not support bind_tools. Ignoring tools.")
                llm_with_tools = llm
        else:
            llm_with_tools = llm

        # 3. Get System Prompt
        system_prompt_key = agent_config.get("system_prompt")
        system_prompt = self.config_loader.get_prompt(system_prompt_key) if system_prompt_key else ""

        return llm_with_tools, tools, system_prompt
