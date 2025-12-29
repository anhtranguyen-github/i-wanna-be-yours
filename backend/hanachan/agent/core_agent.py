import os
import logging
from typing import List, Any, Generator, Dict
from services.resource_processor import ResourceProcessor
from langchain_core.messages import SystemMessage, HumanMessage
from memory.manager import MemoryManager, get_memory_manager
from services.llm_factory import ModelFactory
from agent.tools.study_tools import (
    generate_suggested_goals, 
    audit_study_progress, 
    prepare_milestone_exam,
    perform_detailed_audit,
    update_goal_progress,
    query_learning_records,
    recalibrate_study_priorities
)

logger = logging.getLogger(__name__)

class HanachanAgent:
    def __init__(self):
        self.processor = ResourceProcessor()
        self.memory_manager = get_memory_manager()
        self.skills_dir = os.path.join(os.path.dirname(__file__), "skills")
        
        # Initialize LangChain Chat Model via Factory
        self.llm = ModelFactory.create_chat_model(temperature=0.7)
        
        # Define and bind tools
        self.tools = [
            generate_suggested_goals, 
            audit_study_progress, 
            prepare_milestone_exam,
            perform_detailed_audit,
            update_goal_progress,
            query_learning_records,
            recalibrate_study_priorities
        ]
        try:
            self.llm_with_tools = self.llm.bind_tools(self.tools)
        except Exception as e:
            logger.warning(f"Tool binding not supported for this model: {e}")
            self.llm_with_tools = self.llm

    def _get_system_prompt(self) -> str:
        try:
            skill_path = os.path.join(self.skills_dir, "chat_persona.md")
            with open(skill_path, 'r', encoding='utf-8') as f:
                return f.read()
        except:
            return "You are Hanachan, an AI language tutor for Hanabira.org. Help users with Japanese/Korean learning."

    def invoke(self, 
               prompt: str, 
               session_id: str,
               user_id: str, 
               resource_ids: List[str] = None,
               chat_history: List[Dict[str, str]] = None,
               stream: bool = False,
               token: str = None) -> Any:
        
        resource_ids = resource_ids or []
        chat_history = chat_history or []
        
        # 0. Check Resource Statuses (Metadata Awareness)
        status_text = ""
        if resource_ids:
            status_notes = []
            for rid in resource_ids:
                meta = self.processor.get_resource_metadata(rid, token=token)
                if meta:
                    status = meta.get('ingestionStatus', 'completed')
                    if status != 'completed':
                        status_notes.append(f"- '{meta.get('title')}' is currently: {status}")
            
            if status_notes:
                status_text = "### CRITICAL SERVICE STATUS (INGESTION IN PROGRESS):\n"
                status_text += "The following resources the user is asking about are NOT fully ready. You MUST acknowledge this status to the user:\n"
                status_text += "\n".join(status_notes) + "\n\n"

        system_text = status_text + self._get_system_prompt()

        # 1. Gather Resource Context (RAG)
        if resource_ids:
            try:
                # Retrieve relevant chunks from the selected resources
                resource_context = self.memory_manager.retrieve_resource_context(prompt, user_id, resource_ids)
                if resource_context:
                    logger.info("📄 [Agent] Injecting resource context into Prompt.")
                    system_text += f"\n\n## RELEVANT RESOURCE EXCERPTS:\n{resource_context}"
                else:
                    logger.warning("⚠️ [Agent] No resource context found for request with resource_ids.")
            except Exception as e:
                logger.error(f"Resource Retrieval Error: {e}")
            
        # 2. Gather Memory Context
        try:
            # Pass user_id for scoped retrieval
            memory_context = self.memory_manager.retrieve_context(prompt, user_id=user_id, token=token)
            if memory_context:
                system_text += f"\n\n{memory_context}"
        except Exception as e:
            logger.error(f"Memory retrieval failed: {e}")

        # 3. Construct Messages
        from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
        
        messages = [SystemMessage(content=system_text)]
        
        # Inject Chat History
        for msg in chat_history:
            role = msg.get('role')
            content = msg.get('content')
            if role == 'user':
                messages.append(HumanMessage(content=content))
            elif role == 'assistant':
                messages.append(AIMessage(content=content))
        
        # Current Message
        if status_text:
            messages.append(SystemMessage(content=f"IMPORTANT STATUS REMINDER:\n{status_text}"))
            
        messages.append(HumanMessage(content=prompt))

        try:
            if stream:
                return self._stream_generator(messages, prompt, session_id, user_id, token=token)
            else:
                return self._run_agent_loop(messages, session_id, user_id, prompt, token=token)
        except Exception as e:
            logger.error(f"Agent Error: {e}")
            return f"My neural core is currently recalibrating. (Error: {str(e)})"

    def _run_agent_loop(self, messages: List[Any], session_id: str, user_id: str, prompt: str, token: str = None, max_iterations: int = 5) -> str:
        """Handles a multi-turn execution loop with tool support."""
        for i in range(max_iterations):
            # 1. Call LLM
            response = self.llm_with_tools.invoke(messages)
            
            # 2. Check for tool calls
            if hasattr(response, 'tool_calls') and response.tool_calls:
                from langchain_core.messages import ToolMessage
                
                # Append AI message with tool calls
                messages.append(response)
                
                # Execute tools
                tool_map = {t.name: t for t in self.tools}
                for tc in response.tool_calls:
                    t_name = tc['name']
                    t_args = tc['args']
                    tool = tool_map.get(t_name)
                    
                    if tool:
                        logger.info(f"🛠️ [Agent] Executing tool: {t_name}")
                        if 'user_id' in tool.args:
                            t_args['user_id'] = user_id
                        if 'token' in tool.args:
                            t_args['token'] = token
                        
                        try:
                            result = tool.invoke(t_args)
                            messages.append(ToolMessage(content=str(result), tool_call_id=tc['id']))
                        except Exception as e:
                            logger.error(f"Tool execution failed ({t_name}): {e}")
                            messages.append(ToolMessage(content=f"Error: {str(e)}", tool_call_id=tc['id']))
                
                # Continue loop to let LLM process tool results
                continue
            else:
                # No tool calls, this is the final answer
                content = response.content
                self.memory_manager.save_interaction(session_id, user_id, prompt, content)
                return content
        
        # If we hit max iterations
        error_msg = "Agent loop exceeded maximum iterations."
        logger.warning(error_msg)
        return f"I'm sorry, I'm having trouble finishing that task. ({error_msg})"

    def _stream_generator(self, messages: List[Any], user_prompt: str, session_id: str, user_id: str, token: str = None) -> Generator[str, None, None]:
        full_response = ""
        try:
            # Note: Tool calling in streaming is complex. 
            # For now, we use non-streaming tools if a tool call is detected.
            # 1. Detect tool calls pre-stream
            initial_response = self.llm_with_tools.invoke(messages)
            
            if hasattr(initial_response, 'tool_calls') and initial_response.tool_calls:
                logger.info("🛠️ [Stream] Tool call detected. Diverting to tool execution.")
                from langchain_core.messages import ToolMessage
                messages.append(initial_response)
                
                tool_map = {t.name: t for t in self.tools}
                for tc in initial_response.tool_calls:
                    tool = tool_map.get(tc['name'])
                    if tool:
                        t_args = tc['args']
                        if 'user_id' in tool.args: t_args['user_id'] = user_id
                        if 'token' in tool.args: t_args['token'] = token
                        result = tool.invoke(t_args)
                        messages.append(ToolMessage(content=str(result), tool_call_id=tc['id']))
                
                # Stream the final conclusion
                for chunk in self.llm.stream(messages):
                    content = chunk.content
                    full_response += content
                    yield content
            else:
                # Direct stream
                for chunk in self.llm.stream(messages):
                    content = chunk.content
                    full_response += content
                    yield content
            
            # Save interaction after streaming completes
            self.memory_manager.save_interaction(session_id, user_id, user_prompt, full_response)
            
        except Exception as e:
            logger.error(f"Streaming error: {e}")
            yield "I encountered a neural synchronization error."
