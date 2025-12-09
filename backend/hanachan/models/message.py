from database.database import db
from datetime import datetime

# Association table for Many-to-Many
message_attachments = db.Table('message_attachments',
    db.Column('message_id', db.Integer, db.ForeignKey('chat_messages.id'), primary_key=True),
    db.Column('resource_id', db.Integer, db.ForeignKey('resources.id'), primary_key=True)
)

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
    attachments = db.relationship('Resource', secondary=message_attachments, backref=db.backref('messages', lazy='dynamic'))
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
            'attachments': [r.to_dict() for r in self.attachments],
            'artifacts': [a.to_dict() for a in self.artifacts],
            'tasks': [t.to_dict() for t in self.tasks],
            'suggestions': [s.to_dict() for s in self.suggestions]
        }
