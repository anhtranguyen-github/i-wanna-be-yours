from database.database import db
from datetime import datetime

class Resource(db.Model):
    __tablename__ = 'resources'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(120), nullable=True) # Optional for global resources, but used for ingestion flow
    title = db.Column(db.String(255), nullable=False)
    type = db.Column(db.String(50), nullable=False) # e.g., 'document', 'url', 'image'
    content = db.Column(db.Text, nullable=True) # Text content or URL
    summary = db.Column(db.Text, nullable=True)
    ingestion_status = db.Column(db.String(50), default='pending') # New field for status tracking
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'title': self.title,
            'type': self.type,
            'content': self.content,
            'summary': self.summary,
            'ingestionStatus': self.ingestion_status,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }
