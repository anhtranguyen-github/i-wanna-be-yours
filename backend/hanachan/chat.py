import os
import yaml
import asyncio
import logging
from typing import Dict, Any, Optional, AsyncGenerator, List
from flask import Flask, request, Response, stream_with_context, jsonify
from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage, BaseMessage
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_core.runnables import RunnableConfig

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ConfigLoader:
    """Loads and provides access to configuration from config.yaml."""
    def __init__(self, config_path: str = "config.yaml"):
        # Resolve absolute path if needed, or assume relative to CWD
        self.config_path = config_path
        self.config = self._load_config()

    def _load_config(self) -> Dict[str, Any]:
        if not os.path.exists(self.config_path):
            logger.warning(f"Config file not found at {self.config_path}. Using defaults.")
            return {}
        try:
            with open(self.config_path, "r", encoding="utf-8") as f:
                return yaml.safe_load(f) or {}
        except Exception as e:
            logger.error(f"Error loading config file: {e}")
            return {}

    def get_model_config(self, model_name: str = "default") -> Dict[str, Any]:
        return self.config.get("models", {}).get(model_name, {})

    def get_tool_config(self) -> Dict[str, Any]:
        return self.config.get("tools", {})

    def get_agent_config(self, agent_name: str = "default_agent") -> Dict[str, Any]:
        return self.config.get("agents", {}).get(agent_name, {})

    def get_prompt(self, prompt_name: str) -> str:
        return self.config.get("prompts", {}).get(prompt_name, "")

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
        if not agent_config:
            # Fallback or error
            logger.warning(f"Agent configuration '{agent_name}' not found. Using defaults.")
            agent_config = {}

        # 1. Setup Model
        model_key = agent_config.get("model", "default")
        model_conf = self.config_loader.get_model_config(model_key)
        
        llm = ChatOllama(
            model=model_conf.get("model_name", "qwen3:1.7b"),
            temperature=model_conf.get("temperature", 0.0),
            base_url=model_conf.get("base_url", "http://localhost:11434")
        )

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

    async def stream_answer(self, user_input: str, show_thinking: bool = False) -> AsyncGenerator[str, None]:
        llm_with_tools, tools, system_prompt = await self.agent_factory.create_agent()
        
        messages = []
        if system_prompt:
            messages.append(SystemMessage(content=system_prompt))
        messages.append(HumanMessage(content=user_input))

        while True:
            stream = llm_with_tools.astream(messages)
            final_ai_message = None
            
            async for chunk in stream:
                if final_ai_message is None:
                    final_ai_message = chunk
                else:
                    final_ai_message += chunk
                
                if show_thinking:
                    # Check for tool call chunks (LangChain specific)
                    if hasattr(chunk, 'tool_call_chunks') and chunk.tool_call_chunks:
                        for tc_chunk in chunk.tool_call_chunks:
                            if tc_chunk.get('name'):
                                yield f"\n[Thinking: Calling tool '{tc_chunk['name']}'...]\n"
                    
                    if chunk.content:
                        yield chunk.content
                elif chunk.content:
                    yield chunk.content
            
            if not final_ai_message:
                break
            
            messages.append(final_ai_message)
            
            if not final_ai_message.tool_calls:
                break
            
            tool_messages = []
            for tool_call in final_ai_message.tool_calls:
                tool_output_message = await self.execute_tool_call(tool_call, tools)
                tool_messages.append(tool_output_message)
            
            messages.extend(tool_messages)
        
        if not show_thinking:
            yield "\n"

    async def full_answer(self, user_input: str, show_thinking: bool = False) -> str:
        chunks = []
        async for piece in self.stream_answer(user_input, show_thinking):
            chunks.append(piece)
        return "".join(chunks)

# Global service instance
chat_service = ChatService()

def register_routes(app: Flask):
    @app.route('/chat/stream', methods=['POST'])
    def mcp_stream():
        data = request.get_json() or {}
        query = data.get('query') or data.get('text') or ''
        show_thinking = bool(data.get('thinking') or (request.args.get('thinking') in ['1','true','yes']))
        
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

            agen = chat_service.stream_answer(query, show_thinking)
            
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
    def mcp_complete():
        data = request.get_json() or {}
        query = data.get('query') or data.get('text') or ''
        show_thinking = bool(data.get('thinking') or (request.args.get('thinking') in ['1','true','yes']))
        
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

        text = loop.run_until_complete(chat_service.full_answer(query, show_thinking))
        return jsonify({'response': text})

async def main():
    print("\n=== Configuration Driven Chat Agent ===")
    
    # Initialize
    llm, tools, prompt = await chat_service.agent_factory.create_agent()
    print(f"✅ Loaded {len(tools)} tools")
    print(f"📝 System Prompt: {prompt[:50]}...")
    print("\nAsk me about Japanese grammar!")
    print('Controls: Type "exit" to quit, or "!thinking" to toggle internal thoughts.')
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
        async for chunk in chat_service.stream_answer(user_input, show_thinking):
            print(chunk, end="", flush=True)
        print()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n👋 Goodbye!")