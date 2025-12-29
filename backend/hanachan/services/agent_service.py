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
        
        # Save User Message
        user_msg = ChatMessage(
            conversation_id=conv.id,
            role="user",
            content=request_data.prompt,
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
            
        # 2. Generate Logic (Mock Agent)
        from agent.mock_agent import MockAgent
        agent = MockAgent()
        
        resource_ids = request_data.context_config.resource_ids if request_data.context_config else []

        debug_response = agent.generate_debug_response(
            prompt=request_data.prompt,
            session_id=request_data.session_id,
            user_id=request_data.user_id,
            context_config=request_data.context_config.dict() if request_data.context_config else {},
            message_id=user_msg_id if user_msg_id else 0,
            resource_ids=resource_ids
        )
        
        # Extract fields
        content_text = debug_response.get("content", "")
        tasks_data = debug_response.get("tasks", [])
        suggestions_data = debug_response.get("suggestions", [])
        artifacts_data = debug_response.get("artifacts", [])

        # 3. Try to save Assistant Message & Artifacts to DB
        response_items = []
        
        try:
            # If we have a valid conversation, save response
            if user_msg_id: 
                from models.conversation import Conversation
                conv = Conversation.query.get(int(conv_id))
                asst_msg = ChatMessage(
                    conversation_id=conv.id,
                    role="assistant",
                    content=content_text
                )
                db.session.add(asst_msg)
                conv.updated_at = datetime.utcnow()
                db.session.commit()
                asst_msg_id = asst_msg.id
                
                resp_id = str(asst_msg.id)
            else:
                resp_id = "temp-resp"

            # Create Response Item
            response_items.append(ResponseItemDTO(
                responseId=resp_id,
                type="text",
                content=content_text
            ))

            # Process Artifacts
            for art in artifacts_data:
                a_type = art.get("type")
                a_title = art.get("title")
                a_data = art.get("data")
                
                # Default DTOs
                content_dto = ArtifactContent(title=a_title)
                
                # DB Persistence pointers
                db_art_id = "temp-art"
                sql_artifact = None
                
                # 1. Mongo Persistence (Canonical)
                if asst_msg_id:
                    try: 
                        mongo_artifact = ArtifactService.create_artifact(
                            user_id=request_data.user_id,
                            artifact_type=a_type,
                            title=a_title,
                            data=a_data,
                            metadata=art.get("sidebar", {}),
                            conversation_id=conv_id,
                            message_id=str(asst_msg_id),
                            save_to_library=False
                        )
                        db_art_id = mongo_artifact["_id"]
                    except Exception as e:
                        print(f"Mongo Artifact Save Error: {e}")

                # 2. SQL Persistence (for History/Bubble display)
                if asst_msg_id:
                    try:
                        sql_artifact = MessageArtifact(
                            message_id=asst_msg_id,
                            artifact_external_id=db_art_id,
                            type=a_type,
                            title=a_title,
                            metadata_=art.get("sidebar", {})
                        )
                        
                        # Type-specific SQL sub-models (Extract from mock/agent data)
                        if a_type in ["flashcard", "flashcard_deck"]:
                            # Mock data is often already in a format we can use
                            from models.content.flashcard import FlashcardSet, Flashcard
                            f_set = FlashcardSet(title=a_title)
                            db.session.add(f_set)
                            db.session.flush() # Get ID
                            
                            cards = a_data.get("cards", [])
                            for c in cards:
                                card = Flashcard(
                                    set_id=f_set.id,
                                    front=c.get("front"),
                                    back=c.get("back"),
                                    reading=c.get("reading"),
                                    example=c.get("example")
                                )
                                db.session.add(card)
                            
                            sql_artifact.flashcard_set_id = f_set.id
                            content_dto.flashcards = {"title": a_title, "cards": cards}
                            
                        elif a_type in ["quiz", "exam"]:
                            from models.content.quiz import QuizSet, QuizQuestion, QuizOption
                            q_set = QuizSet(title=a_title, description=a_data.get("description"))
                            db.session.add(q_set)
                            db.session.flush()
                            
                            questions = a_data.get("questions", [])
                            for q in questions:
                                question = QuizQuestion(
                                    quiz_set_id=q_set.id,
                                    question_text=q.get("content"),
                                    explanation=q.get("explanation"),
                                    question_type=q.get("type", "multiple_choice")
                                )
                                db.session.add(question)
                                db.session.flush()
                                
                                options = q.get("options", [])
                                for opt in options:
                                    o = QuizOption(
                                        question_id=question.id,
                                        option_text=opt.get("text"),
                                        is_correct=(opt.get("id") == q.get("correctAnswer"))
                                    )
                                    db.session.add(o)
                            
                            sql_artifact.quiz_set_id = q_set.id
                            content_dto.quiz = a_data
                            
                        elif a_type == "vocabulary":
                            from models.content.vocabulary import VocabularySet, VocabularyItem
                            v_set = VocabularySet(title=a_title)
                            db.session.add(v_set)
                            db.session.flush()
                            
                            items = a_data.get("items", [])
                            for i in items:
                                item = VocabularyItem(
                                    set_id=v_set.id,
                                    word=i.get("word"),
                                    reading=i.get("reading"),
                                    definition=i.get("definition"),
                                    example=i.get("example")
                                )
                                db.session.add(item)
                            
                            sql_artifact.vocabulary_set_id = v_set.id
                            content_dto.vocabulary = {"title": a_title, "items": items}

                        elif a_type == "mindmap":
                            from models.content.mindmap import Mindmap, MindmapNode
                            mm = Mindmap(title=a_title)
                            db.session.add(mm)
                            db.session.flush()

                            def save_nodes(nodes_list, parent_id=None):
                                for node_data in nodes_list:
                                    node = MindmapNode(
                                        mindmap_id=mm.id,
                                        parent_node_id=parent_id,
                                        label=node_data.get("label", "Node")
                                    )
                                    db.session.add(node)
                                    db.session.flush()
                                    if "children" in node_data:
                                        save_nodes(node_data["children"], node.id)

                            # Mock data might have different structure, handle both DTO and raw
                            root_data = a_data.get("root")
                            if root_data:
                                # Create root node first
                                root_node = MindmapNode(
                                    mindmap_id=mm.id,
                                    label=root_data.get("label", "Root")
                                )
                                db.session.add(root_node)
                                db.session.flush()
                                
                                # Find nodes that have this root as parent in raw structure
                                # OR handle nested structure
                                nodes = a_data.get("nodes", [])
                                # Simple flat list to tree if needed, but for mock let's assume simple children or flat
                                for n in nodes:
                                    if n.get("parent") == "root":
                                         db.session.add(MindmapNode(mindmap_id=mm.id, parent_node_id=root_node.id, label=n.get("label")))
                            
                            sql_artifact.mindmap_id = mm.id
                            # dto mapping
                            content_dto.mindmap = a_data

                        elif a_type == "task":
                            t_data = a_data.get("task", {})
                            from models.action import ProposedTask
                            new_task = ProposedTask(
                                message_id=asst_msg_id,
                                title=t_data.get("title", a_title),
                                prompt=t_data.get("description", "")
                            )
                            db.session.add(new_task)
                            db.session.flush()
                            sql_artifact.task_id = new_task.id
                            content_dto.task = {"title": new_task.title, "description": new_task.prompt}

                        db.session.add(sql_artifact)
                        db.session.commit()
                        
                    except Exception as sql_e:
                        print(f"SQL Artifact Persist Error: {sql_e}")
                        traceback.print_exc()
                        db.session.rollback()

                resp_item = ResponseItemDTO(
                    responseId=db_art_id,
                    type=a_type,
                    content=content_dto,
                    sidebar=art.get("sidebar"),
                    metadata=art.get("metadata")
                )
                response_items.append(resp_item)
            
            # Process Suggestions
            for sugg in suggestions_data:
                try:
                    from models.action import Suggestion
                    new_sugg = Suggestion(
                        message_id=asst_msg_id,
                        title=sugg.get("text"),
                        prompt=sugg.get("text")
                    )
                    db.session.add(new_sugg)
                    db.session.commit()
                except Exception as s_e:
                    print(f"Suggestion Persist Error: {s_e}")
                    db.session.rollback()
                
        except Exception as e:
            print(f"Error saving assistant response to DB (continuing): {e}")
            traceback.print_exc()
            # Fallback response items if saving failed completely but generation worked
            if not response_items:
                 response_items.append(ResponseItemDTO(
                    responseId="fallback",
                    type="text",
                    content=content_text
                ))

        # Return strict AgentResponse
        return AgentResponse(
            sessionId=request_data.session_id,
            userId=request_data.user_id,
            conversationId=conv_id,
            status="completed",
            responses=response_items, 
            proposedTasks=tasks_data,
            suggestions=suggestions_data
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
        
        if conv_id:
            try:
                from utils.token_counter import estimate_tokens
                
                # Fetch larger batch (e.g., 50) to allow for filtering
                recent_msgs = ChatMessage.query.filter_by(conversation_id=int(conv_id))\
                    .order_by(ChatMessage.created_at.desc())\
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
            except Exception as e:
                print(f"Streaming Persistence Error (Post-stream): {e}")
                db.session.rollback()
