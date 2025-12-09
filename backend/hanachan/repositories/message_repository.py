from models.message import ChatMessage
from database.database import db

class MessageRepository:
    def save(self, message: ChatMessage) -> ChatMessage:
        db.session.add(message)
        db.session.commit()
        return message

    def get_by_conversation_id(self, conversation_id: int):
        return ChatMessage.query.filter_by(conversation_id=conversation_id).order_by(ChatMessage.created_at).all()
