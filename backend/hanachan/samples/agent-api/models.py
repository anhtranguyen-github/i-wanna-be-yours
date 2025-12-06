import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Enum, JSON
from sqlalchemy.dialects.postgresql import UUID
from backend.database import Base
import enum

class MCPServerType(enum.Enum):
    stdio = "stdio"
    http = "http"

class Thread(Base):
    __tablename__ = "Thread"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class MCPServer(Base):
    __tablename__ = "MCPServer"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True, nullable=False)
    type = Column(Enum(MCPServerType), nullable=False)
    enabled = Column(Boolean, default=True)
    # For stdio servers
    command = Column(String, nullable=True)
    args = Column(JSON, nullable=True)
    env = Column(JSON, nullable=True)
    # For http servers
    url = Column(String, nullable=True)
    headers = Column(JSON, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
