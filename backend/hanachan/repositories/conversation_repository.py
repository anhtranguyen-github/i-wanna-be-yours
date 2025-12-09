from models.conversation import Conversation
from database.database import db

class ConversationRepository:
    def save(self, conversation: Conversation) -> Conversation:
        db.session.add(conversation)
        db.session.commit()
        return conversation

    def get_by_id(self, conversation_id: int) -> Conversation:
        return Conversation.query.get(conversation_id)

    def get_by_session_id(self, session_id: str) -> Conversation:
        return Conversation.query.filter_by(session_id=session_id).first()

    def get_all_by_user(self, user_id: str):
        return Conversation.query.filter_by(user_id=user_id).all()

    def delete(self, conversation_id: int):
        conversation = self.get_by_id(conversation_id)
        if conversation:
            db.session.delete(conversation)
            db.session.commit()
            return True
        return False
