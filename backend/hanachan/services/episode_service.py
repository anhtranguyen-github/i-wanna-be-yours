
from database.database import db
from models.episode import Episode, EpisodeStatus
from models.message import ChatMessage
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class EpisodeService:
    @staticmethod
    def get_or_create_open_episode(session_id: str) -> Episode:
        """
        Get the current open episode for a session, or create one.
        """
        episode = Episode.query.filter_by(session_id=session_id, status=EpisodeStatus.OPEN).first()
        if not episode:
            episode = Episode(session_id=session_id, status=EpisodeStatus.OPEN)
            db.session.add(episode)
            db.session.commit()
            logger.info(f"EpisodeService: Created new episode {episode.id} for session {session_id}")
        return episode

    @staticmethod
    def add_message_to_episode(session_id: str, message_id: int):
        """
        Update the message range for the current open episode.
        """
        episode = EpisodeService.get_or_create_open_episode(session_id)
        
        if episode.start_message_id is None:
            episode.start_message_id = message_id
        
        episode.end_message_id = message_id
        db.session.commit()

    @staticmethod
    def should_close_episode(episode: Episode) -> bool:
        """
        Logic to decide if an episode should be closed:
        - More than 10 messages
        - Inactive for more than 1 hour (if we check later)
        """
        if not episode.start_message_id or not episode.end_message_id:
            return False
            
        message_count = episode.end_message_id - episode.start_message_id + 1
        if message_count >= 10:
            return True
        return False

    @staticmethod
    def close_episode(episode_id: str, summary: str = None):
        """
        Close an episode and mark it for finalization.
        """
        episode = Episode.query.get(episode_id)
        if episode and episode.status == EpisodeStatus.OPEN:
            episode.status = EpisodeStatus.CLOSED
            episode.closed_at = datetime.utcnow()
            if summary:
                episode.summary = summary
            db.session.commit()
            logger.info(f"EpisodeService: Closed episode {episode_id}")
