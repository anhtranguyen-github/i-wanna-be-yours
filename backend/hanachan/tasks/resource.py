
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
        "role": "ingestion_worker", # Specific system role, not admin
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
                    # Logic Split: SQL vs Mongo
                    if resource_id.isdigit():
                        # SQL Resource (Local)
                        # We must be in app context (we are)
                        # Re-fetch to ensure attached to session? Or query fresh.
                         res = Resource.query.get(int(resource_id))
                         if res:
                             # Now we have the ingestion_status field
                             res.ingestion_status = status
                             db.session.commit()
                             logger.info(f"✅ [WORKER] SQL Resource {resource_id} status updated to: {status}")
                         else:
                             logger.warning(f"⚠️ [WORKER] SQL Resource {resource_id} not found for status update")
                    else:
                        # Mongo Resource (API)
                        base = os.getenv('RESOURCES_API_URL', 'http://localhost:5100').rstrip('/')
                        res = requests.put(
                            f"{base}/v1/resources/{resource_id}",
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

            # 1.5 Generate Summary & Embeddings
            # Use Factory for LLM access
            try:
                from services.llm_factory import ModelFactory
                from langchain_core.prompts import ChatPromptTemplate
                
                llm = ModelFactory.create_chat_model(temperature=0)
                
                # Generate Summary
                summary_prompt = ChatPromptTemplate.from_messages([
                    ("system", "Summarize the following text in 3-5 concise sentences. Focus on the main topics and key takeaways."),
                    ("human", "{text}")
                ])
                # Truncate content for summary generation to avoid context limits
                summary_input = content[:4000] 
                messages = summary_prompt.format_messages(text=summary_input)
                generated_summary = llm.invoke(messages).content
                
                # Save Summary to DB
                if resource_id.isdigit():
                     res = Resource.query.get(int(resource_id))
                     if res:
                         res.summary = generated_summary
                         db.session.commit()
                         logger.info(f"📝 [WORKER] Generated summary for Resource {resource_id}")
            except Exception as e:
                logger.warning(f"⚠️ [WORKER] Summary generation failed: {e}")

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
