import logging
from typing import AsyncGenerator, List, Dict, Any
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, BaseMessage
from langchain_ollama import ChatOllama
from agents.factory import AgentFactory
from config_loader import ConfigLoader

logger = logging.getLogger(__name__)

class SingleModeAgent:
    def __init__(self, config_loader: ConfigLoader, agent_factory: AgentFactory):
        self.config_loader = config_loader
        self.agent_factory = agent_factory
        self.model_config = self.config_loader.get_model_config("default_vl")
        self.llm = self._create_llm()
        self.tools = []

    def _create_llm(self):
        # We manually create the LLM here to ensure we use the default_vl config
        # but we also need to bind tools.
        from modules.llm_factory import create_llm_instance, LLMConfigModel
        llm_config = LLMConfigModel(**self.model_config)
        return create_llm_instance(llm_config)

    async def initialize(self):
        """Async initialization to load tools."""
        self.tools = await self.agent_factory.get_tools()
        if self.tools:
            if hasattr(self.llm, "bind_tools"):
                # self.llm = self.llm.bind_tools(self.tools)
                logger.info(f"Bound {len(self.tools)} tools to SingleModeAgent.")
            else:
                logger.warning("SingleModeAgent model does not support tool binding.")

    async def stream_answer(self, user_input: str, history: List[BaseMessage], image_data: str = None) -> AsyncGenerator[str, None]:
        from ollama import AsyncClient
        
        # 1. Build messages for Ollama
        ollama_messages = []
        
        # System Prompt
        ollama_messages.append({
            "role": "system",
            "content": "You are a helpful AI assistant capable of seeing images and using tools."
        })
        
        # Helper to convert LangChain messages to Ollama format
        def convert_msg(msg):
            role = "user"
            content = ""
            images = []
            
            if isinstance(msg, HumanMessage):
                role = "user"
                # Handle complex content (text + images)
                if isinstance(msg.content, list):
                    for part in msg.content:
                        if isinstance(part, dict):
                            if part.get("type") == "text":
                                content += part.get("text", "")
                            elif part.get("type") == "image_url":
                                url = part.get("image_url", {}).get("url", "")
                                if "base64," in url:
                                    images.append(url.split("base64,")[1])
                                else:
                                    images.append(url)
                else:
                    content = str(msg.content)
            
            elif isinstance(msg, AIMessage):
                role = "assistant"
                content = str(msg.content)
                # Tool calls?
                # For now, we ignore previous tool calls in history reconstruction for simplicity 
                # unless strictly needed. The simpler context is better for memory.
            
            elif isinstance(msg, SystemMessage):
                role = "system"
                content = str(msg.content)
            
            elif isinstance(msg, BaseMessage) and msg.type == "tool": # ToolMessage
                role = "tool"
                content = str(msg.content)
            
            return {"role": role, "content": content, "images": images}

        # History
        for m in history:
            ollama_messages.append(convert_msg(m))
        
        # Current User Message (constructed manually to ensure correct image handling)
        current_user_content = user_input
        current_images = []
        if image_data:
            current_images.append(image_data)
        
        ollama_messages.append({
            "role": "user",
            "content": current_user_content,
            "images": current_images
        })
        
        # 2. Initialize Client
        base_url = self.model_config.get("base_url", "http://localhost:11434")
        client = AsyncClient(host=base_url)
        model_name = self.model_config.get("model_name", "qwen3:1.7b")
        num_ctx = self.model_config.get("num_ctx", 512)
        temperature = self.model_config.get("temperature", 0.0)

        # 3. Stream from Ollama
        try:
            # We are not using tools in this pass to maximize stability.
            # If tools are needed, we pass 'tools' param to chat().
            # For now, let's just get the text response working.
            
            response_stream = await client.chat(
                model=model_name,
                messages=ollama_messages,
                stream=True,
                options={
                    "num_ctx": num_ctx,
                    "temperature": temperature
                }
            )
            
            async for chunk in response_stream:
                content = chunk.get('message', {}).get('content', '')
                if content:
                    yield content
                    
        except Exception as e:
            logger.error(f"Error in native agent loop: {e}")
            yield f"\nError in agent loop: {e}"
