
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
    2. Chunk content (RecursiveCharacterTextSplitter)
    3. Embed Chunks in Vector DB (as 'resource_vectors')
    4. Enforce User Isolation
    """
    logger.info(f"⚡ [WORKER] Starting ingestion for resource: {resource_id}")
    
    processor = ResourceProcessor()
    
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
            user_id = res_data.get('userId') # Critical for privacy
            
            if not user_id:
                logger.error(f"❌ [WORKER] No userId found for resource {resource_id}. Aborting ingestion.")
                return False

            # 2. Chunking
            try:
                from langchain_text_splitters import RecursiveCharacterTextSplitter
            except ImportError:
                from langchain.text_splitter import RecursiveCharacterTextSplitter

            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=800,
                chunk_overlap=100,
                separators=["\n\n", "\n", ".", "!", "?", ",", " ", ""]
            )
            chunks = text_splitter.split_text(content)
            
            if not chunks:
                logger.warning(f"⚠️ [WORKER] Resource {resource_id} yielded no text chunks.")
                return True

            # 3. Vector Storage
            # Use EpisodicMemory wrapper but targeting 'resource_vectors' collection
            vector_store = EpisodicMemory(collection_name="resource_vectors")
            
            logger.info(f"📄 [WORKER] Ingesting {len(chunks)} chunks for resource {resource_id} (User: {user_id})")
            
            for i, chunk in enumerate(chunks):
                meta = {
                    "resource_id": resource_id,
                    "title": title,
                    "type": "resource_chunk",
                    "chunk_index": i,
                    "total_chunks": len(chunks),
                    "source": title
                }
                # add_memory now handles user_id scoping
                vector_store.add_memory(
                    summary=chunk, # The content of the chunk
                    user_id=user_id,
                    metadata=meta
                )
            
            logger.info(f"✅ [WORKER] Resource {resource_id} fully ingested.")
            return True
        except Exception as e:
            logger.error(f"❌ [WORKER] Ingestion error: {e}")
            return False
