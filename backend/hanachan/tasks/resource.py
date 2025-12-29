
import logging
import requests
from services.resource_processor import ResourceProcessor
from memory.episodic import EpisodicMemory
from database.database import db
from models.resource import Resource
import os
import jwt
import time

# Configure logging at module level to ensure visibility in RQ worker
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(name)s : %(message)s')
logger = logging.getLogger(__name__)

JWT_SECRET = os.getenv("JWT_SECRET", "your-development-secret-key")

def generate_system_token():
    payload = {
        "id": "system-worker",
        "userId": "system-worker",
        "role": "admin", # Admin role usually bypasses checks or is allowed
        "exp": int(time.time()) + 300
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

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
    token = generate_system_token()
    
    # We need to make sure it doesn't use localhost if running in Docker
    from app import create_app
    app = create_app()
    
    with app.app_context():
        try:
            # Helper to update status
            def update_status(status):
                try:
                    res = requests.put(
                        f"{os.getenv('RESOURCES_API_URL', 'http://localhost:5100')}/v1/resources/{resource_id}",
                        json={"ingestionStatus": status},
                        headers={"Authorization": f"Bearer {token}"}
                    )
                    if not res.ok:
                        logger.warning(f"⚠️ [WORKER] Failed to update status to {status}: {res.status_code}")
                except Exception as ex:
                    logger.error(f"⚠️ [WORKER] Error updating status: {ex}")

            update_status("processing")

            # 1. Extraction
            res_data = processor.get_resource_content(resource_id, token=token)
            if not res_data or not res_data.get('content'):
                update_status("failed")
                logger.error(f"❌ [WORKER] Failed to get content for resource {resource_id}")
                return False
            
            content = res_data['content']
            title = res_data['title']
            user_id = res_data.get('userId') # Critical for privacy
            
            logger.info(f"📄 [WORKER] Extracted {len(content)} chars from {title}")

            if not user_id:
                update_status("failed")
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
                update_status("completed") # Valid but empty
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
            
            update_status("completed")
            logger.info(f"✅ [WORKER] Resource {resource_id} fully ingested.")
            return True
        except Exception as e:
            logger.error(f"❌ [WORKER] Ingestion error: {e}")
            update_status("failed")
            return False
