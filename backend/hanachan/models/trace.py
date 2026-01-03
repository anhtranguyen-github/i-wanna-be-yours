from database.database import db
from datetime import datetime

class AgentTrace(db.Model):
    """
    Stores internal 'Thought Traces' of the agent for HUD visualization.
    This is separate from user-facing messages.
    """
    __tablename__ = 'agent_traces'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(100), index=True)
    user_id = db.Column(db.String(100), index=True)
    
    # Event types: intent_detection, aperture_start, aperture_end, specialist_routing, tool_call, output_governed
    event_type = db.Column(db.String(50))
    
    # JSON payload for the event
    data = db.Column(db.JSON)
    
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "session_id": self.session_id,
            "event_type": self.event_type,
            "data": self.data,
            "timestamp": self.timestamp.isoformat()
        }
