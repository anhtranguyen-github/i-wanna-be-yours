from datetime import datetime
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

class AgentService:
    def __init__(self):
        self.conv_service = ConversationService()

    def invoke_agent(self, request_data: AgentRequest) -> AgentResponse:
        # Fallback tracking
        conv_id = "temp-conv-id"
        user_msg_id = None
        asst_msg_id = None
        
        # 1. Try to persist to DB (Conversation & User Message)
        try:
            from models.conversation import Conversation
            conv = Conversation.query.filter_by(session_id=request_data.session_id).first()
            if not conv:
                conv_service = ConversationService()
                words = request_data.prompt.split()
                initial_title = " ".join(words[:5]) if words else "New Conversation"
                if len(initial_title) > 40:
                    initial_title = initial_title[:37] + "..."
                    
                conv_dict = conv_service.create_conversation(request_data.user_id, initial_title)
                # Re-query to get object
                conv = Conversation.query.get(conv_dict['id'])
                conv.session_id = request_data.session_id
                db.session.commit()
            
            conv_id = str(conv.id)

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
                
                # Fill content_dto based on type (Mock Data -> DTO)
                if a_type == "flashcard":
                    cards_list = a_data.get("cards", [])
                    content_dto.flashcards = {"title": a_title, "cards": cards_list}
                elif a_type == "mindmap":
                    root = a_data.get("root", {})
                    nodes = a_data.get("nodes", [])
                    # Transform to DTO structure roughly
                    children = []
                    for n in nodes:
                         children.append({'label': n['label'], 'children': []})
                    content_dto.mindmap = {
                        "title": a_title, 
                        "nodes": [{"label": root.get("label", "Root"), "children": children}]
                    }
                elif a_type == "task":
                    t = a_data.get("task", {})
                    content_dto.task = {"title": t.get("title"), "description": t.get("description")}
                elif a_type == "vocabulary":
                    items = a_data.get("items", [])
                    content_dto.vocabulary = {"title": a_title, "items": items}
                elif a_type == "quiz":
                    content_dto.quiz = a_data # Pass through
                
                # DB Persistence if available
                db_art_id = "temp-art"
                if asst_msg_id:
                    # Sync to Mongo
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
                
                resp_item = ResponseItemDTO(
                    responseId=db_art_id,
                    type=a_type,
                    content=content_dto,
                    sidebar=art.get("sidebar"),
                    metadata=art.get("metadata")
                )
                response_items.append(resp_item)
                
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
