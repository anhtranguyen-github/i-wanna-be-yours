import logging
import asyncio
from typing import List
from schemas.context import ArtifactReference
from services.artifact_service import ArtifactService

logger = logging.getLogger(__name__)

class ArtifactRetriever:
    async def get_recent_artifacts(self, user_id: str, limit: int = 5) -> List[ArtifactReference]:
        """
        Retrieves recent artifacts created by the user.
        """
        try:
            loop = asyncio.get_event_loop()
            
            # Using find_by_user instead of get_user_artifacts which usually returns full data
            # We want metadata mostly.
            artifacts = await loop.run_in_executor(
                None,
                ArtifactService.get_user_artifacts,
                user_id,
                None, # session_id (all)
                limit
            )
            
            if not artifacts:
                return []
                
            results = []
            for art in artifacts:
                results.append(ArtifactReference(
                    artifact_id=str(art.get("_id")),
                    type=art.get("type"),
                    title=art.get("title"),
                    description=art.get("description"),
                    created_at=str(art.get("createdAt"))
                ))
            return results
        except Exception as e:
            logger.error(f"Error in ArtifactRetriever: {e}")
            return []
