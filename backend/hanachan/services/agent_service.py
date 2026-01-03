from datetime import datetime
import logging
import json
from typing import List, Dict, Any
from schemas.chat import AgentRequest, AgentResponse, ResponseItemDTO, ArtifactContent, ChatMessageDTO
from services.conversation_service import ConversationService
from services.artifact_service import ArtifactService
from models.message import ChatMessage
from models.artifact import MessageArtifact
from models.action import ProposedTask, Suggestion
from models.content.flashcard import FlashcardSet, Flashcard
from models.content.mindmap import Mindmap, MindmapNode
from models.content.audio import AudioContent
from models.content.vocabulary import VocabularySet, VocabularyItem
from models.content.quiz import QuizSet, QuizQuestion, QuizOption
from database.database import db
import traceback

from services.resource_processor import ResourceProcessor

logger = logging.getLogger(__name__)

class AgentService:
    def __init__(self):
        self.conv_service = ConversationService()

    def _get_or_create_conversation(self, request_data: AgentRequest) -> Any:
        """Helper to manage conversation and user message persistence"""
        from models.conversation import Conversation
        conv = Conversation.query.filter_by(session_id=request_data.session_id).first()
        if not conv:
            conv_service = ConversationService()
            words = request_data.prompt.split()
            initial_title = " ".join(words[:5]) if words else "New Conversation"
            if len(initial_title) > 40:
                initial_title = initial_title[:37] + "..."
                
            conv_dict = conv_service.create_conversation(request_data.user_id, initial_title)
            conv = Conversation.query.get(conv_dict['id'])
            conv.session_id = request_data.session_id
            db.session.commit()
        
        # Resolve Resource Titles for STM Mapping
        resource_ids = request_data.context_config.resource_ids if request_data.context_config else []
        attachments = []
        if resource_ids:
            processor = ResourceProcessor()
            for rid in resource_ids:
                meta = processor.get_resource_metadata(rid, token=request_data.token)
                title = meta.get("title", "Unknown Resource") if meta else "Resource"
                attachments.append({"id": rid, "title": title})

        # Save User Message
        user_msg = ChatMessage(
            conversation_id=conv.id,
            role="user",
            content=request_data.prompt,
            attachments=attachments, # Now storing list of dicts: {id, title}
            context_configuration=request_data.context_config.dict() if request_data.context_config else None
        )
        db.session.add(user_msg)
        conv.updated_at = datetime.utcnow()
        db.session.commit()
        return conv, user_msg

    def invoke_agent(self, request_data: AgentRequest) -> AgentResponse:
        # Fallback tracking
        conv_id = "temp-conv-id"
        user_msg_id = None
        asst_msg_id = None
        
        # 1. Try to persist to DB (Conversation & User Message)
        try:
            conv, user_msg = self._get_or_create_conversation(request_data)
            conv_id = str(conv.id)
            user_msg_id = user_msg.id
            
        except Exception as e:
            print(f"DB Error processing request (Falling back to Mock without persistence): {e}")
            traceback.print_exc()
            # We continue without DB persistence
            
        # 2. Fetch Chat History (STM)
        chat_history = []
        try:
            from models.conversation import Conversation
            conv = Conversation.query.get(int(conv_id))
            if conv:
                # Get last 10 messages (excluding the current user message just saved)
                msgs = conv.messages[-11:-1]
                for m in msgs:
                    chat_history.append({"role": m.role, "content": m.content})
        except:
            pass

        # 3. Invoke Real Agent (Sovereign System)
        from agent.core_agent import HanachanAgent
        agent = HanachanAgent()
        
        resource_ids = request_data.context_config.resource_ids if request_data.context_config else []

        # [SYSTEM] Call Agent - Returns UnifiedOutput
        package = agent.invoke(
            prompt=request_data.prompt,
            session_id=request_data.session_id,
            user_id=request_data.user_id,
            resource_ids=resource_ids,
            chat_history=chat_history,
            token=request_data.token
        )
        

        # 3. Bridge UnifiedOutput to AgentResponse DTO
        from schemas.chat import ResponseItemDTO, ArtifactContent, AgentResponse
        
        response_items = []
        
        # Add Text Message
        response_items.append(ResponseItemDTO(
            responseId=f"msg-{user_msg_id or 'temp'}",
            type="text",
            content=package.message.content
        ))
        
        # Add Artifacts
        for art in package.artifacts:
            response_items.append(ResponseItemDTO(
                responseId=art.id,
                type=art.type,
                content={"title": art.title, **art.data},
                metadata=art.metadata
            ))

        # Add Tasks
        proposed_tasks_dto = []
        for t in package.tasks:
            proposed_tasks_dto.append({
                "id": t.id,
                "title": t.title,
                "description": t.description
            })

        return AgentResponse(
            sessionId=request_data.session_id,
            userId=request_data.user_id,
            conversationId=conv_id,
            status="completed",
            responses=response_items,
            proposedTasks=proposed_tasks_dto,
            suggestions=package.suggestions
        )


    def stream_agent(self, request_data: AgentRequest):
        """Streaming version with full persistence"""
        from agent.core_agent import HanachanAgent
        from models.conversation import Conversation
        
        # 1. Initialize Persistence
        conv_id = None
        user_msg_id = None
        conv = None
        
        try:
            conv, user_msg = self._get_or_create_conversation(request_data)
            conv_id = str(conv.id)
            user_msg_id = user_msg.id
        except Exception as e:
            print(f"Streaming Persistence Error (Pre-stream): {e}")

        # 2. Yield Metadata (Frontend needs conversationId early - Use Session UUID)
        if conv and conv.session_id:
            yield f"__METADATA__:{json.dumps({'conversationId': conv.session_id})}\n"

        # 3. Stream from Agent
        logger.info(f"🚀 Starting stream from agent for session {request_data.session_id}")
        agent = HanachanAgent()
        full_content = ""
        chunk_count = 0
        resource_ids = request_data.context_config.resource_ids if request_data.context_config else []
        
        # Fetch Chat History (Short-Term Memory) with Token Budget
        chat_history = []
        MAX_HISTORY_TOKENS = 2000
        summary = None
        
        if conv:
            summary = conv.summary
            
        if conv_id:
            try:
                from utils.token_counter import estimate_tokens
                
                # Fetch messages after the last summarization point
                query = ChatMessage.query.filter_by(conversation_id=int(conv_id))
                if conv and conv.last_summarized_msg_id:
                    query = query.filter(ChatMessage.id > conv.last_summarized_msg_id)
                
                recent_msgs = query.order_by(ChatMessage.created_at.desc())\
                    .limit(50)\
                    .all()
                
                if user_msg_id:
                     recent_msgs = [m for m in recent_msgs if m.id != user_msg_id]

                current_tokens = 0
                temp_history = []
                
                # Iterate backwards (newest first)
                for msg in recent_msgs:
                    content = msg.content or ""
                    tokens = estimate_tokens(content)
                    
                    if current_tokens + tokens > MAX_HISTORY_TOKENS:
                        break
                    
                    current_tokens += tokens
                    temp_history.append({"role": msg.role, "content": content})
                
                # Restore chronological order
                for msg in reversed(temp_history):
                    chat_history.append(msg)
                    
            except Exception as e:
                print(f"Error fetching chat history: {e}")

        for chunk in agent.invoke(
            prompt=request_data.prompt,
            session_id=request_data.session_id,
            user_id=request_data.user_id,
            resource_ids=resource_ids,
            chat_history=chat_history,
            summary=summary,
            stream=True,
            token=request_data.token
        ):
            if chunk:
                chunk_count += 1
                full_content += chunk
                yield chunk
        
        logger.info(f"✅ Finished stream. Sent {chunk_count} chunks, total length: {len(full_content)}")

        # 4. Finalize Persistence
        if conv_id and user_msg_id:
            try:
                # We need to ensure we are in a request context often for db.session
                # but since this runs in the generator (stream_with_context), it should be fine.
                asst_msg = ChatMessage(
                    conversation_id=int(conv_id),
                    role="assistant",
                    content=full_content
                )
                db.session.add(asst_msg)
                db.session.commit()
                print(f"Streaming Persistence Complete for Conv {conv_id}")
                
                # Enqueue Summarization Task
                try:
                    from services.queue_factory import get_queue
                    from tasks.summarization import summarize_conversation_task
                    
                    q = get_queue()
                    # We only trigger if the message count is likely to be over the buffer
                    # to avoid spamming jobs on every single short exchange
                    q.enqueue(summarize_conversation_task, conversation_id=int(conv_id))
                    logger.info(f"Enqueued summarization task for conversation {conv_id}")
                except Exception as q_e:
                    logger.warning(f"Failed to enqueue summarization task: {q_e}")

            except Exception as e:
                print(f"Streaming Persistence Error (Post-stream): {e}")
                db.session.rollback()
