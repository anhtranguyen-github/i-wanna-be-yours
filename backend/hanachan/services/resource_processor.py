import requests
import logging
import os

# NRS_API should point to the new service (Port 5300)
# Defaulting to 5300 for the microservice refactor
NRS_API = os.environ.get("NRS_API_URL", "http://localhost:5300/v1/resources")

class ResourceProcessor:
    """
    Microservice Client for Neural Resource Service (NRS).
    This class has been refactored to delegate all heavy lifting to the NRS microservice.
    """
    
    def get_resource_metadata(self, resource_id: str, token: str = None) -> dict:
        """Fetch metadata including ingestion status from NRS."""
        try:
            headers = {"Authorization": f"Bearer {token}"} if token else {}
            
            # Note: We now use the standard NRS endpoint which returns the full Mongo doc
            resp = requests.get(f"{NRS_API}/{resource_id}/meta", headers=headers)
            if resp.ok:
                return resp.json()
            else:
                logging.error(f"NRS metadata fetch failed for {resource_id}: {resp.status_code}")
        except Exception as e:
            logging.error(f"Error fetching metadata from NRS for {resource_id}: {e}")
        return None

    def trigger_ingestion(self, resource_id: str, token: str = None, strategy: str = "recursive"):
        """Enqueue an ingestion task in NRS."""
        try:
            headers = {"Authorization": f"Bearer {token}"} if token else {}
            payload = {"strategy": strategy}
            
            resp = requests.post(f"{NRS_API}/{resource_id}/ingest", json=payload, headers=headers)
            if resp.ok:
                return resp.json()
            else:
                logging.error(f"NRS ingestion trigger failed for {resource_id}: {resp.status_code}")
        except Exception as e:
            logging.error(f"Failed to trigger NRS ingestion for {resource_id}: {e}")
        return None

    def get_resource_content(self, resource_id: str, token: str = None) -> dict:
        """
        [DEPRECATED] Internal Agent logic should now use MemoryManager.retrieve_resource_context.
        Maintaining for backwards compatibility if needed.
        """
        logging.warning("ResourceProcessor.get_resource_content is deprecated. Use NRS Search API via MemoryManager instead.")
        return None
