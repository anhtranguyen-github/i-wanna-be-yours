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

    def _resolve_conversation(self, identifier) -> Conversation:
        # If it's an integer or digit-string, try ID first
        if isinstance(identifier, int) or (isinstance(identifier, str) and identifier.isdigit()):
            conv = self.conv_repo.get_by_id(int(identifier))
            if conv: return conv
            
        # Try as session_id
        return self.conv_repo.get_by_session_id(str(identifier))

    def add_message(self, conversation_id, role: str, content: str, attachment_ids: list = None) -> dict:
        # Resolve conversation first
        conv = self._resolve_conversation(conversation_id)
        if not conv:
            raise ValueError(f"Conversation {conversation_id} not found")
        
        real_id = conv.id

        new_msg = ChatMessage(
            conversation_id=real_id,
            role=role,
            content=content
        )
        
        if attachment_ids:
            new_msg.attachments = attachment_ids

        saved_msg = self.msg_repo.save(new_msg)
        
        # Touch conversation
        from datetime import datetime
        conv.updated_at = datetime.utcnow()
        self.conv_repo.save(conv)

        return saved_msg.to_dict()

    def get_conversation_details(self, conversation_id) -> dict:
        conv = self._resolve_conversation(conversation_id)
        if not conv:
            return None
            
        messages = self.msg_repo.get_by_conversation_id(conv.id)
        conv_dict = conv.to_dict()
        conv_dict['history'] = [m.to_dict() for m in messages]
        return conv_dict
    
    def list_user_conversations(self, user_id: str) -> list:
        conversations = self.conv_repo.get_all_by_user(user_id)
        return [c.to_dict() for c in conversations]
