
from database.database import db
from datetime import datetime
import uuid
import enum

class JobType(str, enum.Enum):
    EPISODE_SUMMARY = "EPISODE_SUMMARY"
    SEMANTIC_EXTRACTION = "SEMANTIC_EXTRACTION"
    RESOURCE_INGESTION = "RESOURCE_INGESTION"

class JobStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class MemoryJob(db.Model):
    __tablename__ = 'memory_jobs'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    job_type = db.Column(db.Enum(JobType), nullable=False)
    payload = db.Column(db.JSON, nullable=True)
    
    status = db.Column(db.Enum(JobStatus), default=JobStatus.PENDING)
    
    retry_count = db.Column(db.Integer, default=0)
    error_log = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "job_type": self.job_type.value,
            "status": self.status.value,
            "retry_count": self.retry_count,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }
