import logging
import asyncio
from services.resource_processor import ResourceProcessor
from services.summarizer_service import SummarizerService
from services.chunker_service import ChunkerService
from services.vector_store_service import VectorStoreService

logger = logging.getLogger(__name__)

async def _ingest_resource_async(resource_id: str, strategy: str = "recursive"):
    """Core async logic for ingestion."""
    logger.info(f"⚡ [NRS-ASYNC] Starting ingestion for: {resource_id} ({strategy})")
    
    processor = ResourceProcessor()
    summarizer = SummarizerService()
    chunker = ChunkerService()
    vector_store = VectorStoreService()

    try:
        await processor.update_resource(resource_id, {"ingestionStatus": "processing", "lastError": None})

        data = await processor.get_resource_content(resource_id)
        if not data or (not data["content"] and not data["mediaBase64"]):
            raise ValueError("Empty or invalid resource content.")

        content = data["content"]
        user_id = data["userId"]
        title = data["title"]

        # Parallelize Summarization and Chunking if possible
        # (Though summarization usually needs the whole text, same for chunking)
        # We can run them concurrently
        summary_task = summarizer.summarize_content(title, content)
        chunk_task = chunker.chunk_content(content, strategy=strategy)
        
        summary, chunks = await asyncio.gather(summary_task, chunk_task)

        if chunks:
            await vector_store.delete_by_resource(resource_id, user_id)
            metadata = {"resource_id": resource_id, "title": title, "strategy": strategy}
            await vector_store.add_chunks(chunks, metadata, user_id)

        await processor.update_resource(resource_id, {
            "ingestionStatus": "completed",
            "summary": summary,
            "chunkCount": len(chunks),
            "chunkingStrategy": strategy
        })
        logger.info(f"✅ [NRS-ASYNC] Ingestion complete: {resource_id}")

    except Exception as e:
        logger.error(f"❌ [NRS-ASYNC] Ingestion failed: {resource_id}: {e}")
        await processor.update_resource(resource_id, {
            "ingestionStatus": "failed",
            "lastError": str(e)
        })

def ingest_resource_task(resource_id: str, strategy: str = "recursive"):
    """RQ Worker Entry Point (Bridge to Async)."""
    asyncio.run(_ingest_resource_async(resource_id, strategy))
