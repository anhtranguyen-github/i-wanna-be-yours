import logging
from database.database import db
from models.trace import AgentTrace

logger = logging.getLogger("hanachan.trace")

def log_agent_trace(session_id: str, user_id: str, event_type: str, data: dict):
    """
    Background task to write a trace event to the database.
    """
    try:
        from app import create_app
        app = create_app()
        with app.app_context():
            trace = AgentTrace(
                session_id=session_id,
                user_id=user_id,
                event_type=event_type,
                data=data
            )
            db.session.add(trace)
            db.session.commit()
            logger.debug(f"✅ Trace logged: {event_type} for session {session_id}")
    except Exception as e:
        logger.error(f"❌ Failed to log trace: {e}")
