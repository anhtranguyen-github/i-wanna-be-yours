
from database.database import db
from datetime import datetime
import uuid
from sqlalchemy.dialects.postgresql import UUID
import enum

class EpisodeStatus(str, enum.Enum):
    OPEN = "OPEN"
    PROCESSING = "PROCESSING"
    CLOSED = "CLOSED"
    FAILED = "FAILED"

class Episode(db.Model):
    __tablename__ = 'episodes'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = db.Column(db.String(120), nullable=False) # Maps to Conversation.session_id
    
    status = db.Column(db.Enum(EpisodeStatus), default=EpisodeStatus.OPEN)
    
    start_message_id = db.Column(db.Integer, nullable=True) # ID of first message in episode
    end_message_id = db.Column(db.Integer, nullable=True)   # ID of last message in episode
    
    summary = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    closed_at = db.Column(db.DateTime, nullable=True)
    
    def to_dict(self):
        return {
            "id": self.id,
            "session_id": self.session_id,
            "status": self.status.value,
            "summary": self.summary,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "closed_at": self.closed_at.isoformat() if self.closed_at else None
        }
