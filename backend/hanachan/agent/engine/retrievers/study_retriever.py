import logging
import asyncio
from typing import Optional
from schemas.context import StudyState

logger = logging.getLogger(__name__)

class StudyRetriever:
    def __init__(self, memory_manager):
        self.memory_manager = memory_manager
        self.study_service = memory_manager.study

    async def get_study_state(self, user_id: str, token: str) -> Optional[StudyState]:
        """
        Retrieves active study plan, progress health, and struggle points.
        """
        try:
            loop = asyncio.get_event_loop()
            
            # Since StudyMemory.retrieve_study_data returns a formatted string for the prompt currently,
            # we need to either parse it or call the underlying service directly.
            # For "The Aperture", we want structured data.
            
            # Let's see if we can get structured data from the study service client
            client = self.study_service.client
            
            # Parallel sub-tasks for study state
            tasks = [
                loop.run_in_executor(None, client.get_active_plan_summary, user_id, token),
                loop.run_in_executor(None, client.get_performance_trends, user_id, token)
            ]
            
            summary, trends = await asyncio.gather(*tasks)
            
            if not summary:
                return None
                
            return StudyState(
                active_plan=f"{summary.get('target_level')} Mastery",
                current_milestone=summary.get('current_milestone'),
                health=summary.get('health_status', 'on_track'),
                struggles=trends.get("identified_struggles", []) if trends else [],
                recent_performance=trends.get("recent_metrics", {}) if trends else {}
            )
        except Exception as e:
            logger.error(f"Error in StudyRetriever: {e}")
            return None
