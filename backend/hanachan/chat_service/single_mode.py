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
                self.llm = self.llm.bind_tools(self.tools)
                logger.info(f"Bound {len(self.tools)} tools to SingleModeAgent.")
            else:
                logger.warning("SingleModeAgent model does not support tool binding.")

    async def stream_answer(self, user_input: str, history: List[BaseMessage], image_data: str = None) -> AsyncGenerator[str, None]:
        # Construct messages
        messages = []
        
        # System Prompt
        messages.append(SystemMessage(content="You are a helpful AI assistant capable of seeing images and using tools."))
        
        # History
        messages.extend(history)
        
        # Current User Message
        content = []
        content.append({"type": "text", "text": user_input})
        if image_data:
            content.append({"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image_data}"}})
        
        messages.append(HumanMessage(content=content))

        # Execution Loop (Simple ReAct-like)
        # We will loop to handle tool calls.
        
        max_iterations = 5
        current_messages = messages
        
        for _ in range(max_iterations):
            # Invoke Model
            try:
                # We need to stream the response
                response_content = ""
                tool_calls = []
                
                # We use astream to get chunks
                async for chunk in self.llm.astream(current_messages):
                    if chunk.content:
                        yield chunk.content
                        response_content += chunk.content
                    
                    if chunk.tool_calls:
                        # Accumulate tool calls (LangChain usually gives them in the final chunk or accumulates them)
                        # But with astream, we might get partials. 
                        # For simplicity in this manual loop with streaming, let's rely on the final message construction
                        # or use .invoke() for the tool decision step if we want to be robust, 
                        # but the user wants streaming.
                        # A common pattern is to stream the text, then check for tool calls in the aggregated message.
                        pass
                        
                # After streaming, we need the full message object to check for tool calls properly
                # Re-invoking or reconstructing is tricky. 
                # Let's do a full invoke to get the tool calls reliably if we didn't capture them well,
                # OR better: use the accumulated response to check.
                # LangChain's astream yields chunks that can be added.
                
                # Let's try to get the full response object from the stream accumulation
                # Actually, for a robust tool loop + streaming, using LangGraph's prebuilt agent is best,
                # but the user said "instead of use the graph".
                # So we will implement a simple "Run -> Check Tool -> Run Tool -> Repeat" loop.
                # To support streaming AND tools, we usually stream the first response.
                # If it has tool calls, we execute them and then stream the *next* response.
                
                # Let's do: Invoke (not stream) to check for tools first? No, that delays text.
                # We will stream the response. If the final object has tool calls, we execute.
                
                complete_response = await self.llm.ainvoke(current_messages)
                
                if not complete_response.tool_calls:
                    break # No tools, we are done (we already streamed the content hopefully? 
                          # Wait, if we use ainvoke, we didn't stream. 
                          # If we use astream, we yield text.
                          # Let's use astream, and reconstruct the message.
                
                # Re-doing logic for streaming + tools in a manual loop:
                # 1. Stream the response to the user.
                # 2. Capture the full message.
                # 3. If tool calls, execute and append to history, then loop.
                
                # Note: If we just ainvoke, we lose streaming.
                # If we astream, we need to yield text chunks.
                
                # Let's use astream events or just astream.
                
                # Optimization: The first response might just be text.
                # If it's a tool call, the model might not output text.
                
                # Let's stick to: Stream the output.
                # But we need to know if we should continue.
                
                # For this implementation, to ensure we don't break "streaming", 
                # we will stream the chunks.
                
                # Refined Loop:
                ai_message = await self.llm.ainvoke(current_messages)
                
                # If we have content, we should have yielded it. 
                # Since we called ainvoke (blocking) here to get tool_calls easily, 
                # we sacrifice "real-time" streaming of the *tool decision* step, 
                # but we can yield the content now.
                # (Ideally we would use astream and aggregate, but ainvoke is safer for tool parsing).
                
                if ai_message.content:
                     yield str(ai_message.content)

                current_messages.append(ai_message)

                if not ai_message.tool_calls:
                    break
                
                # Execute Tools
                for tool_call in ai_message.tool_calls:
                    tool_name = tool_call["name"]
                    tool_args = tool_call["args"]
                    tool_id = tool_call["id"]
                    
                    yield f"\n<thinking>Calling tool: {tool_name}</thinking>\n"
                    
                    selected_tool = next((t for t in self.tools if t.name == tool_name), None)
                    if selected_tool:
                        try:
                            tool_output = await selected_tool.ainvoke(tool_args)
                        except Exception as e:
                            tool_output = f"Error: {e}"
                    else:
                        tool_output = f"Error: Tool {tool_name} not found."
                        
                    current_messages.append(ToolMessage(content=str(tool_output), tool_call_id=tool_id))
                    
            except Exception as e:
                yield f"\nError in agent loop: {e}"
                break
