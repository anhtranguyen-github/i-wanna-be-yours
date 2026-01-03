import logging
import os
from repositories.resource_repository import ResourceRepository
from services.queue_factory import get_queue
# Note: we import the task function directly if we want to enqueue it
# But to avoid circular imports, we often use the string path 'tasks.ingestion.process_resource'

class ResourceProcessor:
    """
    Handles resource processing coordination.
    Now integrated with the local Resource SQL model.
    """
    def __init__(self):
        self.repo = ResourceRepository()

    def get_resource_metadata(self, resource_id: str, token: str = None) -> dict:
        """Fetch metadata from local DB or external NRS."""
        if resource_id.isdigit():
            resource = self.repo.get_by_id(int(resource_id))
            return resource.to_dict() if resource else None
        
        # Legacy fallback if needed
        # (Assuming we still have some Mongo resources for a transition period)
        return None

    def trigger_ingestion(self, resource_id: str, token: str = None, strategy: str = "recursive"):
        """Enqueue an ingestion task."""
        if not resource_id.isdigit():
            logging.error(f"Cannot trigger ingestion for non-SQL resource: {resource_id}")
            return None

        # Check if resource exists
        resource = self.repo.get_by_id(int(resource_id))
        if not resource:
            logging.error(f"Resource {resource_id} not found in DB")
            return None

        # Update status to processing
        self.repo.update_status(int(resource_id), 'processing')

        # Enqueue task
        queue = get_queue()
        # We'll point to a new task specifically for local resources
        job = queue.enqueue(
            'tasks.background_orchestration.process_resource_ingestion', 
            resource_id=int(resource_id),
            job_timeout='10m'
        )
        
        if job:
            logging.info(f"Enqueued ingestion job {job.id} for resource {resource_id}")
            return job.id
        return None
