import asyncio
import logging
from typing import AsyncGenerator, List, Dict, Any
from langchain_core.messages import ToolMessage, SystemMessage, HumanMessage
from config_loader import ConfigLoader
from agents.factory import AgentFactory
from graph.graph import MasGraph
from .repository import ChatRepository

from .single_mode import SingleModeAgent

logger = logging.getLogger(__name__)

class ChatService:
    """Core service handling chat logic, tool execution, and MAS coordination."""
    def __init__(self, config_path: str = "config.yaml"):
        self.config_loader = ConfigLoader(config_path)
        self.agent_factory = AgentFactory(self.config_loader)
        self.repository = ChatRepository(self.config_loader.get_database_config())
        
        # Check for Single Mode
        app_config = self.config_loader.config.get("app") or {}
        self.use_single_mode = app_config.get("use_single_mode", False)
        
        if self.use_single_mode:
            logger.info("🚀 Initializing in SINGLE AGENT MODE")
            self.single_agent = SingleModeAgent(self.config_loader, self.agent_factory)
            # We need to await initialization of tools, but __init__ is sync.
            # We'll do it lazily or use a loop. 
            # Best practice: create a factory method or init in the first call.
            self.single_agent_initialized = False
        else:
            logger.info("🌐 Initializing in MAS GRAPH MODE")
            self.mas_graph = MasGraph(self.agent_factory)

    # --- Passthrough to Repository ---
    def get_user_conversations(self, user_id: str) -> List[Dict[str, Any]]:
        return self.repository.get_user_conversations(user_id)

    def delete_conversation(self, conversation_id: str, user_id: str) -> bool:
        return self.repository.delete_conversation(conversation_id, user_id)

    def get_history_json(self, conversation_id: str, user_id: str = None) -> List[Dict[str, Any]]:
        return self.repository.get_history_json(conversation_id, user_id)

    def get_user_resources(self, user_id: str) -> List[Dict[str, Any]]:
        return self.repository.get_user_resources(user_id)

    def create_resource(self, user_id: str, type: str, content: str, title: str) -> Dict[str, Any]:
        return self.repository.create_resource(user_id, type, content, title)

    def delete_resource(self, resource_id: str, user_id: str) -> bool:
        return self.repository.delete_resource(resource_id, user_id)

    # --- Chat Logic ---
    async def stream_answer(self, user_input: str, conversation_id: str = None, user_id: str = None, image_data: str = None, show_thinking: bool = False) -> AsyncGenerator[str, None]:
        history_messages = self.repository.get_conversation_history(conversation_id) if conversation_id else []
        
        if self.use_single_mode:
            # Initialize if needed
            if not self.single_agent_initialized:
                await self.single_agent.initialize()
                self.single_agent_initialized = True
            
            # Stream from Single Agent
            full_response = ""
            async for chunk in self.single_agent.stream_answer(user_input, history_messages, image_data):
                yield chunk
                full_response += chunk
            
            # Save to DB
            if conversation_id:
                self.repository.save_message(conversation_id, user_id, "USER", user_input)
                self.repository.save_message(conversation_id, user_id, "AGENT", full_response)
                
        else:
            # Use MAS Graph for streaming
            state = {
                "messages": history_messages,
                "user_input": user_input,
                "image_data": image_data, # Pass image data to graph
                "kaiwa_response": "",
                "specialist_response": "",
                "next_step": "",
                "conversation_id": conversation_id or "unknown"
            }
            
            async for output in self.mas_graph.app.astream(state):
                for key, value in output.items():
                    if show_thinking:
                        yield f"<thinking>Finished step: {key}</thinking>\n"
                    
                    if key == "aggregator":
                        new_msgs = value.get("messages", [])
                        if new_msgs:
                            last_msg = new_msgs[-1]
                            yield last_msg.content
                            
                            if conversation_id:
                                self.repository.save_message(conversation_id, user_id, "USER", user_input)
                                self.repository.save_message(conversation_id, user_id, "AGENT", last_msg.content)

    async def full_answer(self, user_input: str, conversation_id: str = None, user_id: str = None, image_data: str = None, show_thinking: bool = False) -> str:
        chunks = []
        async for piece in self.stream_answer(user_input, conversation_id, user_id, image_data, show_thinking):
            chunks.append(piece)
        return "".join(chunks)

# Global instance
chat_service = ChatService()
