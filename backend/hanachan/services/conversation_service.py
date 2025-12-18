from repositories.conversation_repository import ConversationRepository
from repositories.message_repository import MessageRepository
from models.conversation import Conversation
from models.message import ChatMessage
import uuid

class ConversationService:
    def __init__(self, conv_repo: ConversationRepository = None, msg_repo: MessageRepository = None):
        self.conv_repo = conv_repo or ConversationRepository()
        self.msg_repo = msg_repo or MessageRepository()

    def create_conversation(self, user_id: str, title: str = None) -> dict:
        session_id = f"sess-{uuid.uuid4()}"
        new_conv = Conversation(
            session_id=session_id,
            user_id=user_id,
            title=title
        )
        saved_conv = self.conv_repo.save(new_conv)
        return saved_conv.to_dict()

    def add_message(self, conversation_id: int, role: str, content: str, attachment_ids: list = None) -> dict:
        new_msg = ChatMessage(
            conversation_id=conversation_id,
            role=role,
            content=content
        )
        
        if attachment_ids:
            # Avoid circular import by importing locally or better yet, inject ResourceService.
            # But for simple linking, we can use the repository or just model query if attached to session.
            # Ideally we use a ResourceRepository here.
            from models.resource import Resource
            # Simple query for now
            resources = Resource.query.filter(Resource.id.in_(attachment_ids)).all()
            new_msg.attachments.extend(resources)

        saved_msg = self.msg_repo.save(new_msg)
        
        # Touch conversation to update timestamp for sorting
        from datetime import datetime
        conv = self.conv_repo.get_by_id(conversation_id)
        if conv:
            conv.updated_at = datetime.utcnow()
            self.conv_repo.save(conv)

        return saved_msg.to_dict()

    def get_conversation_details(self, conversation_id: int) -> dict:
        conv = self.conv_repo.get_by_id(conversation_id)
        if not conv:
            return None
            
        messages = self.msg_repo.get_by_conversation_id(conversation_id)
        conv_dict = conv.to_dict()
        conv_dict['history'] = [m.to_dict() for m in messages]
        return conv_dict
    
    def list_user_conversations(self, user_id: str) -> list:
        conversations = self.conv_repo.get_all_by_user(user_id)
        return [c.to_dict() for c in conversations]
