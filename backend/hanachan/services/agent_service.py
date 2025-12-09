from datetime import datetime
from typing import List, Dict, Any
from schemas.chat import AgentRequest, AgentResponse, ResponseItemDTO, ArtifactContent, ChatMessageDTO
from services.conversation_service import ConversationService
from models.message import ChatMessage
from models.artifact import MessageArtifact
from models.action import ProposedTask, Suggestion
from models.content.flashcard import FlashcardSet
from models.content.mindmap import Mindmap
from models.content.audio import AudioContent
from database.database import db

class AgentService:
    def __init__(self):
        self.conv_service = ConversationService()

    def invoke_agent(self, request_data: AgentRequest) -> AgentResponse:
        # 1. Validation Logic checks (Pydantic handled this at route)
        
        # 2. Persist User Request
        # Map AgentRequest (Pydantic) -> ChatMessage (DB)
        # We need to find the conversation_id. 
        # For MVP, assume we look up by sessionId or create.
        from models.conversation import Conversation
        conv = Conversation.query.filter_by(session_id=request_data.session_id).first()
        if not conv:
            # Create new if missing
            conv_service = ConversationService()
            conv_dict = conv_service.create_conversation(request_data.user_id, "New Session")
            conv = Conversation.query.get(conv_dict['id'])
            # Update session_id to match request if needed, or query assumption
            conv.session_id = request_data.session_id
            db.session.commit()

        # Save User Message with Configuration
        user_msg = ChatMessage(
            conversation_id=conv.id,
            role="user",
            content=request_data.prompt,
            context_configuration=request_data.context_config.dict() if request_data.context_config else None
        )
        if request_data.context_config and request_data.context_config.resource_ids:
            # Link attachments
            from models.resource import Resource
            resources = Resource.query.filter(Resource.id.in_(request_data.context_config.resource_ids)).all()
            user_msg.attachments.extend(resources)
            
        db.session.add(user_msg)
        db.session.commit()

        # 3. Generate Logic (Mocking the complex response structure)
        # Verify persistence and get attachments
        saved_user_msg = ChatMessage.query.get(user_msg.id)
        
        # Use MockAgent from agent folder
        from agent.mock_agent import MockAgent
        agent = MockAgent()
        
        debug_response = agent.generate_debug_response(
            prompt=request_data.prompt,
            session_id=request_data.session_id,
            user_id=request_data.user_id,
            context_config=request_data.context_config.dict() if request_data.context_config else {},
            message_id=user_msg.id,
            attachments=saved_user_msg.attachments
        )
        
        # Extract fields
        content_text = debug_response.get("content", "")
        tasks_data = debug_response.get("tasks", [])
        suggestions_data = debug_response.get("suggestions", [])

        # create assistant message container
        asst_msg = ChatMessage(
            conversation_id=conv.id,
            role="assistant",
            content=content_text
        )
        db.session.add(asst_msg)
        db.session.commit()

        # Mock Artifact (Flashcard)
        # In real logic, this comes from LLM
        # We map DB Artifact -> Pydantic ResponseItemDTO
        
        # Return strict AgentResponse
        return AgentResponse(
            sessionId=request_data.session_id,
            userId=request_data.user_id,
            status="completed",
            responses=[
                ResponseItemDTO(
                    responseId=str(asst_msg.id),
                    type="text",
                    content=content_text
                )
            ], 
            proposedTasks=tasks_data,
            suggestions=suggestions_data
        )
