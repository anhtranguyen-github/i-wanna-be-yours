
import logging
import requests
from services.resource_processor import ResourceProcessor
from memory.episodic import EpisodicMemory
from database.database import db
from models.resource import Resource
import os

logger = logging.getLogger(__name__)

def ingest_resource(resource_id: str):
    """
    Background task to process a resource:
    1. Download & Extract Text
    2. (Optional) Summarize
    3. Embed in Vector DB (Qdrant)
    4. Sync metadata to Hanachan's SQL DB if needed
    """
    logger.info(f"⚡ [WORKER] Starting ingestion for resource: {resource_id}")
    
    processor = ResourceProcessor()
    # ResourceProcessor.get_resource_content handles downloading and extraction
    # We need to make sure it doesn't use localhost if running in Docker
    from app import create_app
    app = create_app()
    
    with app.app_context():
        try:
            # 1. Extraction
            res_data = processor.get_resource_content(resource_id)
            if not res_data or not res_data.get('content'):
                logger.error(f"❌ [WORKER] Failed to get content for resource {resource_id}")
                return False
            
            content = res_data['content']
            title = res_data['title']
            
            # 2. Vector Storage
            episodic = EpisodicMemory(collection_name="resource_vectors")
            # We use EpisodicMemory's Qdrant wrapper but for resources
            # In a more advanced system, we'd chunk it. For now, simple add.
            episodic.add_memory(
                content, 
                metadata={
                    "resource_id": resource_id, 
                    "title": title,
                    "type": "resource"
                }
            )
            
            # 3. SQL Sync (Keep a local record in Hanachan's DB for faster listing/reference)
            existing = Resource.query.filter_by(id=int(resource_id) if resource_id.isdigit() else 0).first()
            if not existing:
                # If it's a mongo ID, we might need to handle it differently.
                # But Hanachan models.Resource uses Integer PK.
                # Let's assume for now we don't strictly need SQL sync if we just use Vector DB.
                pass
            
            logger.info(f"✅ [WORKER] Resource {resource_id} ('{title}') ingested into Vector DB.")
            return True
        except Exception as e:
            logger.error(f"❌ [WORKER] Ingestion error: {e}")
            return False
