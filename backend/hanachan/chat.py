import os
import yaml
import asyncio
import logging
from typing import Dict, Any, Optional, AsyncGenerator, List
from flask import Flask, request, Response, stream_with_context, jsonify, g
import pymongo
from datetime import datetime
import uuid
from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage, BaseMessage, AIMessage
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_core.runnables import RunnableConfig
from modules.llm_factory import create_llm_instance, LLMConfigModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ConfigLoader:
    """Loads and provides access to configuration from config.yaml."""
    def __init__(self, config_path: str = "config.yaml"):
        # Resolve absolute path relative to this file if not absolute
        if not os.path.isabs(config_path):
            base_dir = os.path.dirname(os.path.abspath(__file__))
            config_path = os.path.join(base_dir, config_path)
            
        self.config_path = config_path
        self.config = self._load_config()

    def _load_config(self) -> Dict[str, Any]:
        if not os.path.exists(self.config_path):
            raise FileNotFoundError(f"Config file not found at {self.config_path}")
        try:
            with open(self.config_path, "r", encoding="utf-8") as f:
                config = yaml.safe_load(f)
                if not config:
                    raise ValueError("Config file is empty")
                return config
        except Exception as e:
            logger.error(f"Error loading config file: {e}")
            raise

    def get_model_config(self, model_name: str = "default") -> Dict[str, Any]:
        models = self.config.get("models", {})
        if model_name not in models:
            raise KeyError(f"Model configuration '{model_name}' not found in config")
        return models[model_name]

    def get_tool_config(self) -> Dict[str, Any]:
        return self.config.get("tools", {})

    def get_agent_config(self, agent_name: str = "default_agent") -> Dict[str, Any]:
        agents = self.config.get("agents", {})
        if agent_name not in agents:
             raise KeyError(f"Agent configuration '{agent_name}' not found in config")
        return agents[agent_name]

    def get_prompt(self, prompt_name: str) -> str:
        prompts = self.config.get("prompts", {})
        if prompt_name not in prompts:
            raise KeyError(f"Prompt '{prompt_name}' not found in config")
        return prompts[prompt_name]

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

    async def create_agent(self, agent_name: str = "default_agent"):
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
        tools = await self.get_tools()
        
        # Filter tools if agent_config specifies a subset (optional implementation)
        # agent_tools = agent_config.get("tools", [])
        # if agent_tools: ...

        # Bind tools to LLM
        if tools:
            llm_with_tools = llm.bind_tools(tools)
        else:
            llm_with_tools = llm

        # 3. Get System Prompt
        system_prompt_key = agent_config.get("system_prompt")
        system_prompt = self.config_loader.get_prompt(system_prompt_key) if system_prompt_key else ""

        return llm_with_tools, tools, system_prompt

class ChatService:
    """Core service handling chat logic and tool execution."""
    def __init__(self, config_path: str = "config.yaml"):
        self.config_loader = ConfigLoader(config_path)
        self.agent_factory = AgentFactory(self.config_loader)
        
        # Database setup
        db_config = self.config_loader.config.get("database")
        if not db_config:
            raise KeyError("Database configuration missing")
            
        self.db_client = pymongo.MongoClient(
            host=db_config.get("host"),
            port=db_config.get("port")
        )
        self.db_name = db_config.get("name")
        if not self.db_name:
            raise KeyError("Database name missing in config")
            
        self.db = self.db_client[self.db_name]
        logger.info(f"Connected to MongoDB: {self.db_name}")

    def get_user_conversations(self, user_id: str) -> List[Dict[str, Any]]:
        """Fetches all conversations for a specific user."""
        if not user_id:
            return []
        
        cursor = self.db.chat_history.find(
            {"user_id": user_id},
            {"messages": 0} # Exclude messages to keep it light
        ).sort("updated_at", -1)
        
        conversations = []
        for doc in cursor:
            doc["_id"] = str(doc["_id"]) # Convert ObjectId to string if needed, though conversation_id is usually UUID
            conversations.append(doc)
        return conversations

    def delete_conversation(self, conversation_id: str, user_id: str) -> bool:
        """Deletes a conversation if it belongs to the user."""
        result = self.db.chat_history.delete_one({"conversation_id": conversation_id, "user_id": user_id})
        return result.deleted_count > 0

    def get_conversation_history(self, conversation_id: str, user_id: str = None) -> List[BaseMessage]:
        """Fetches conversation history from MongoDB."""
        if not conversation_id:
            return []
            
        query = {"conversation_id": conversation_id}
        if user_id:
            query["user_id"] = user_id
            
        history = self.db.chat_history.find_one(query)
        if not history:
            return []
            
        messages = []
        for msg in history.get("messages", []):
            if msg["speaker"] == "USER":
                messages.append(HumanMessage(content=msg["text"]))
            elif msg["speaker"] == "AGENT":
                messages.append(AIMessage(content=msg["text"]))
        return messages

    def get_history_json(self, conversation_id: str, user_id: str = None) -> List[Dict[str, Any]]:
        """Fetches conversation history from MongoDB in JSON-serializable format."""
        if not conversation_id:
            return []
            
        query = {"conversation_id": conversation_id}
        if user_id:
            query["user_id"] = user_id

        history = self.db.chat_history.find_one(query)
        if not history:
            return []
            
        return history.get("messages", [])

    def save_message(self, conversation_id: str, user_id: str, speaker: str, text: str, title: str = None):
        """Saves a message to MongoDB."""
        if not conversation_id:
            return

        message_entry = {
            "speaker": speaker,
            "text": text,
            "timestamp": datetime.now().isoformat()
        }
        
        update_fields = {
            "$push": {"messages": message_entry},
            "$set": {"updated_at": datetime.now()},
            "$setOnInsert": {
                "conversation_id": conversation_id,
                "user_id": user_id,
                "created_at": datetime.now(),
                "title": title or "New Conversation"
            }
        }
        
        # If title is provided explicitly (e.g. on creation), update it
        if title:
             update_fields["$set"]["title"] = title

        self.db.chat_history.update_one(
            {"conversation_id": conversation_id},
            update_fields,
            upsert=True
        )

    # --- Resource Management ---
    def create_resource(self, user_id: str, type: str, content: str, title: str) -> Dict[str, Any]:
        resource_id = str(uuid.uuid4())
        resource = {
            "resource_id": resource_id,
            "user_id": user_id,
            "type": type,
            "content": content,
            "title": title,
            "created_at": datetime.now().isoformat()
        }
        self.db.resources.insert_one(resource)
        resource.pop("_id")
        return resource

    def get_user_resources(self, user_id: str) -> List[Dict[str, Any]]:
        cursor = self.db.resources.find({"user_id": user_id}).sort("created_at", -1)
        resources = []
        for doc in cursor:
            doc.pop("_id")
            resources.append(doc)
        return resources

    def delete_resource(self, resource_id: str, user_id: str) -> bool:
        result = self.db.resources.delete_one({"resource_id": resource_id, "user_id": user_id})
        return result.deleted_count > 0

    async def execute_tool_call(self, tool_call, tools):
        """Executes a single tool call."""
        if isinstance(tool_call, dict):
            tc_name = tool_call.get('name')
            tc_args = tool_call.get('args', {})
            tc_id = tool_call.get('id')
        else:
            tc_name = getattr(tool_call, 'name', None)
            tc_args = getattr(tool_call, 'args', {}) or {}
            tc_id = getattr(tool_call, 'id', None)

        for tool in tools:
            t_name = getattr(tool, 'name', None)
            if t_name == tc_name:
                try:
                    # Try async invoke first if available, else sync
                    if hasattr(tool, 'ainvoke'):
                        result = await tool.ainvoke(tc_args)
                    else:
                        result = tool.invoke(tc_args)
                except Exception as e:
                     logger.error(f"Tool execution error: {e}")
                     result = f"Error executing tool {tc_name}: {str(e)}"
                
                content = result if isinstance(result, str) else str(result)
                return ToolMessage(content=content, tool_call_id=tc_id)

        return ToolMessage(
            content=f"Error: Tool '{tc_name}' not found.",
            tool_call_id=tc_id,
        )

    async def stream_answer(self, user_input: str, conversation_id: str = None, user_id: str = None, show_thinking: bool = False) -> AsyncGenerator[str, None]:
        llm_with_tools, tools, system_prompt = await self.agent_factory.create_agent()
        
        messages = []
        if system_prompt:
            messages.append(SystemMessage(content=system_prompt))
        
        # Load history
        if conversation_id:
            history_messages = self.get_conversation_history(conversation_id)
            messages.extend(history_messages)
        
        # Check for /think command in user input to toggle mode
        if "/think" in user_input:
            show_thinking = True
            user_input = user_input.replace("/think", "").strip()

        # Append /think to user input if enabled
        # We do NOT modify system_prompt as it might be used for multi-turn chat
        if show_thinking:
            user_input = f"/think {user_input}"
            
            # Add explicit instruction about tags to the messages if needed, 
            # or rely on the model understanding /think. 
            # The user's prompt implies /think is enough to "bring it back".
            # But adding a system instruction for the tags format is helpful for the UI parsing.
            messages.append(SystemMessage(content="You MUST think step by step inside <think> tags before answering. Example: <think>I need to...</think> Answer."))

        # Log for debugging
        logger.info(f"Thinking Mode: {show_thinking}")
        logger.info(f"System Prompt: {system_prompt}")
        logger.info(f"User Input: {user_input}")

        messages.append(HumanMessage(content=user_input))

        while True:
            # Save user message first (only once)
            if conversation_id and len(messages) == len(history_messages) + 2 + (1 if show_thinking else 0): # System + History + (Think) + User
                 self.save_message(conversation_id, user_id, "USER", user_input)

            stream = llm_with_tools.astream(messages)
            final_ai_message = None
            
            async for chunk in stream:
                if final_ai_message is None:
                    final_ai_message = chunk
                else:
                    final_ai_message += chunk
                
                # Always stream thinking tags if they exist in the content (e.g. from reasoning models)
                if chunk.content:
                    # Check for <think> tags which might come from reasoning models
                    if "<think>" in chunk.content or "</think>" in chunk.content:
                         yield chunk.content
                    elif show_thinking:
                         yield chunk.content
                    else:
                         # Even if not showing thinking, if the model generates it, yield it.
                         yield chunk.content

                if show_thinking:
                    # Check for tool call chunks (LangChain specific)
                    if hasattr(chunk, 'tool_call_chunks') and chunk.tool_call_chunks:
                        for tc_chunk in chunk.tool_call_chunks:
                            if tc_chunk.get('name'):
                                yield f"<thinking>Calling tool '{tc_chunk['name']}'...\n</thinking>"
            
            if not final_ai_message:
                break
            
            messages.append(final_ai_message)
            
            if not final_ai_message.tool_calls:
                break
            
            tool_messages = []
            for tool_call in final_ai_message.tool_calls:
                tool_output_message = await self.execute_tool_call(tool_call, tools)
                if show_thinking:
                    yield f"<thinking>\nTool Output: {tool_output_message.content}\n</thinking>"
                tool_messages.append(tool_output_message)
            
            messages.extend(tool_messages)
        
        if not show_thinking:
            yield "\n"
            
        # Save AI response
        if conversation_id and final_ai_message:
             self.save_message(conversation_id, user_id, "AGENT", final_ai_message.content)

    async def full_answer(self, user_input: str, conversation_id: str = None, user_id: str = None, show_thinking: bool = False) -> str:
        chunks = []
        async for piece in self.stream_answer(user_input, conversation_id, user_id, show_thinking):
            chunks.append(piece)
        return "".join(chunks)

# Global service instance
chat_service = ChatService()

from modules.auth_middleware import require_auth

def register_routes(app: Flask):
    @app.route('/chat/stream', methods=['POST'])
    @require_auth
    def mcp_stream():
        data = request.get_json() or {}
        query = data.get('query') or data.get('text') or ''
        show_thinking = bool(data.get('thinking') or (request.args.get('thinking') in ['1','true','yes']))
        conversation_id = data.get('conversation_id')
        # user_id is now available in g.user from the token
        user_id = g.user.get('userId') if hasattr(g, 'user') else data.get('user_id')
        
        if not query:
            return jsonify({'error': "Missing 'query'"}), 400

        def generate():
            try:
                loop = asyncio.get_event_loop()
                if loop.is_closed():
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)

            agen = chat_service.stream_answer(query, conversation_id, user_id, show_thinking)
            
            while True:
                try:
                    chunk = loop.run_until_complete(agen.__anext__())
                    yield chunk
                except StopAsyncIteration:
                    break
                except Exception as e:
                    logger.error(f"Error in stream: {e}")
                    yield f"Error: {str(e)}"
                    break

        return Response(stream_with_context(generate()), mimetype='text/plain')

    @app.route('/chat/complete', methods=['POST'])
    @require_auth
    def mcp_complete():
        data = request.get_json() or {}
        query = data.get('query') or data.get('text') or ''
        show_thinking = bool(data.get('thinking') or (request.args.get('thinking') in ['1','true','yes']))
        conversation_id = data.get('conversation_id')
        user_id = g.user.get('userId') if hasattr(g, 'user') else data.get('user_id')
        
        if not query:
            return jsonify({'error': "Missing 'query'"}), 400

        try:
            loop = asyncio.get_event_loop()
            if loop.is_closed():
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        text = loop.run_until_complete(chat_service.full_answer(query, conversation_id, user_id, show_thinking))
        return jsonify({'response': text})

    @app.route('/chat/history', methods=['GET'])
    @require_auth
    def get_history():
        conversation_id = request.args.get('conversation_id')
        user_id = g.user.get('userId')
        if not conversation_id:
            return jsonify({'error': "Missing 'conversation_id'"}), 400
            
        history = chat_service.get_history_json(conversation_id, user_id)
        return jsonify({'history': history})

    @app.route('/chat/conversations', methods=['GET'])
    @require_auth
    def get_conversations():
        user_id = g.user.get('userId')
        conversations = chat_service.get_user_conversations(user_id)
        return jsonify({'conversations': conversations})

    @app.route('/chat/conversations/<conversation_id>', methods=['DELETE'])
    @require_auth
    def delete_conversation(conversation_id):
        user_id = g.user.get('userId')
        success = chat_service.delete_conversation(conversation_id, user_id)
        if success:
            return jsonify({'message': 'Conversation deleted'})
        return jsonify({'error': 'Conversation not found or not authorized'}), 404

    # --- Resource Routes ---

    @app.route('/resources', methods=['GET'])
    @require_auth
    def get_resources():
        user_id = g.user.get('userId')
        resources = chat_service.get_user_resources(user_id)
        return jsonify({'resources': resources})

    @app.route('/resources', methods=['POST'])
    @require_auth
    def create_resource():
        user_id = g.user.get('userId')
        data = request.get_json() or {}
        
        if not all(k in data for k in ('type', 'content', 'title')):
            return jsonify({'error': 'Missing required fields'}), 400
            
        resource = chat_service.create_resource(
            user_id, 
            data['type'], 
            data['content'], 
            data['title']
        )
        return jsonify({'resource': resource})

    @app.route('/resources/<resource_id>', methods=['DELETE'])
    @require_auth
    def delete_resource(resource_id):
        user_id = g.user.get('userId')
        success = chat_service.delete_resource(resource_id, user_id)
        if success:
            return jsonify({'message': 'Resource deleted'})
        return jsonify({'error': 'Resource not found or not authorized'}), 404

async def main():
    print("\n=== Configuration Driven Chat Agent ===")
    
    # Initialize
    llm, tools, prompt = await chat_service.agent_factory.create_agent()
    print(f"✅ Loaded {len(tools)} tools")
    print(f"📝 System Prompt: {prompt[:50]}...")
    print("\nAsk me about Japanese grammar!")
    print("=" * 60 + "\n")
    
    show_thinking = False
    
    while True:
        user_input = input("You: ").strip()
        if user_input.lower() in ['exit', 'quit', 'q']:
            print("👋 Goodbye!")
            break
        
        if user_input.lower() == '!thinking':
            show_thinking = not show_thinking
            print(f"🧠 Internal thinking is now **{'ON' if show_thinking else 'OFF'}**.")
            continue
            
        if not user_input:
            continue
            
        print(f"\n🤖 Assistant: ", end="", flush=True)
        
        # Use stream_answer to show progress
        async for chunk in chat_service.stream_answer(user_input, show_thinking=show_thinking):
            print(chunk, end="", flush=True)
        print()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n👋 Goodbye!")