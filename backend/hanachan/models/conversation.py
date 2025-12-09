from database.database import db
from datetime import datetime

class Conversation(db.Model):
    __tablename__ = 'conversations'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(120), unique=True, nullable=False) # Public ID
    user_id = db.Column(db.String(120), nullable=False)
    title = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    messages = db.relationship('ChatMessage', backref='conversation', cascade="all, delete-orphan", order_by='ChatMessage.created_at')

    def to_dict(self):
        return {
            'id': self.id,
            'sessionId': self.session_id,
            'userId': self.user_id,
            'title': self.title,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
            'lastMessage': self.messages[-1].to_dict() if self.messages else None
        }
