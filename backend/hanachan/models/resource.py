from database.database import db
from datetime import datetime

class Resource(db.Model):
    __tablename__ = 'resources'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(120), nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    type = db.Column(db.String(50), nullable=False) # document, audio, etc.
    file_path = db.Column(db.String(512), nullable=False)
    file_size = db.Column(db.Integer, nullable=True)
    mime_type = db.Column(db.String(100), nullable=True)
    ingestion_status = db.Column(db.String(50), default='pending') # pending, processing, completed, failed
    tags = db.Column(db.JSON, nullable=True)
    metadata_ = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "title": self.title,
            "type": self.type,
            "filePath": self.file_path,
            "fileSize": self.file_size,
            "mimeType": self.mime_type,
            "ingestionStatus": self.ingestion_status,
            "tags": self.tags or [],
            "metadata": self.metadata_ or {},
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None
        }
