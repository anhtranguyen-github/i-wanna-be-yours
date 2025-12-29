import os
import logging
from typing import List, Any, Generator, Dict
from services.resource_processor import ResourceProcessor
from langchain_core.messages import SystemMessage, HumanMessage
from memory.manager import MemoryManager, get_memory_manager
from services.llm_factory import ModelFactory

logger = logging.getLogger(__name__)

class HanachanAgent:
    def __init__(self):
        self.processor = ResourceProcessor()
        self.memory_manager = get_memory_manager()
        self.skills_dir = os.path.join(os.path.dirname(__file__), "skills")
        
        # Initialize LangChain Chat Model via Factory
        self.llm = ModelFactory.create_chat_model(temperature=0.7)

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
            memory_context = self.memory_manager.retrieve_context(prompt, user_id=user_id)
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
                return self._stream_generator(messages, prompt, session_id, user_id)
            else:
                response = self.llm.invoke(messages)
                content = response.content
                # Save interaction to memory with user_id
                self.memory_manager.save_interaction(session_id, user_id, prompt, content)
                return content
        except Exception as e:
            logger.error(f"Agent Error: {e}")
            return f"My neural core is currently recalibrating. (Error: {str(e)})"

    def _stream_generator(self, messages: List[Any], user_prompt: str, session_id: str, user_id: str) -> Generator[str, None, None]:
        full_response = ""
        try:
            logger.info(f"⚡ [Stream] Starting stream for user {user_id} (Session: {session_id})")
            chunk_count = 0
            for chunk in self.llm.stream(messages):
                content = chunk.content
                logger.info(f"⚡ [Stream] Chunk received: {len(content)} chars")
                full_response += content
                chunk_count += 1
                yield content
            
            logger.info(f"⚡ [Stream] Completed. Total chunks: {chunk_count}")
            
            # Save interaction after streaming completes
            self.memory_manager.save_interaction(session_id, user_id, user_prompt, full_response)
            
        except Exception as e:
            logger.error(f"Streaming error: {e}")
            yield "I encountered a neural synchronization error."
