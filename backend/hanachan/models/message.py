from database.database import db
from datetime import datetime



class ChatMessage(db.Model):
    __tablename__ = 'chat_messages'
    
    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey('conversations.id'), nullable=False)
    role = db.Column(db.String(50), nullable=False) # user, assistant, system
    content = db.Column(db.Text, nullable=False)
    # Store request-specific configuration (Model, Temp, etc)
    context_configuration = db.Column(db.JSON, nullable=True) 
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    # Multi-service attachments (List of Mongo IDs)
    attachments = db.Column(db.JSON, default=list)
    artifacts = db.relationship('MessageArtifact', backref='message', cascade="all, delete-orphan")
    tasks = db.relationship('ProposedTask', backref='message', cascade="all, delete-orphan")
    suggestions = db.relationship('Suggestion', backref='message', cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'role': self.role,
            'content': self.content,
            'contextConfiguration': self.context_configuration,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'attachments': self.attachments or [],
            'artifacts': [a.to_dict() for a in self.artifacts],
            'tasks': [t.to_dict() for t in self.tasks],
            'suggestions': [s.to_dict() for s in self.suggestions]
        }
