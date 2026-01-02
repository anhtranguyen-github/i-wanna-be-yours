import os
import logging
from typing import List, Optional, Dict, Any
from qdrant_client import QdrantClient
from langchain_qdrant import QdrantVectorStore
from langchain_core.documents import Document
from .llm_factory import ModelFactory

logger = logging.getLogger(__name__)

class VectorStoreService:
    """Manages neural storage in Qdrant (Synchronous Wrapper for Client Stability)."""

    def __init__(self, collection_name: str = "resource_vectors"):
        self.collection_name = collection_name
        self.embeddings = ModelFactory.create_embeddings()
        
        qdrant_host = os.environ.get("QDRANT_HOST", "localhost")
        qdrant_port = int(os.environ.get("QDRANT_PORT", 6333))
        
        # Sync Client for better compatibility with current LangChain-Qdrant wrapper
        self.client = QdrantClient(host=qdrant_host, port=qdrant_port)
        self.vector_store_instance = QdrantVectorStore(
            client=self.client,
            collection_name=self.collection_name,
            embedding=self.embeddings
        )

    async def _init_collection(self):
        # Sync version of collection check
        try:
            from qdrant_client.http.models import Distance, VectorParams
            collections = self.client.get_collections()
            exists = any(c.name == self.collection_name for c in collections.collections)
            
            if not exists:
                dim = len(self.embeddings.embed_query("test"))
                logger.info(f"Creating Qdrant collection: {self.collection_name} with dim={dim}")
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(size=dim, distance=Distance.COSINE)
                )
        except Exception as e:
            logger.error(f"Error initializing Qdrant collection: {e}")

    async def add_chunks(self, chunks: List[str], metadata: Dict[str, Any], user_id: str):
        """Add multiple text chunks with metadata (Async)."""
        documents = []
        for i, chunk in enumerate(chunks):
            chunk_metadata = metadata.copy()
            chunk_metadata["user_id"] = user_id
            chunk_metadata["chunk_index"] = i
            chunk_metadata["total_chunks"] = len(chunks)
            documents.append(Document(page_content=chunk, metadata=chunk_metadata))
            
        try:
            # Check lazy init (sync) if needed, but normally done in __init__
            await self._init_collection()
            
            # Using async interface of QdrantVectorStore even if client is Sync
            # (LangChain wrapper handles thread offloading)
            await self.vector_store_instance.aadd_documents(documents)
            
            logger.info(f"Successfully added {len(documents)} chunks to Qdrant.")
        except Exception as e:
            logger.error(f"Failed to add documents to Qdrant: {e}")
            raise e

    async def search(self, query: str, user_id: str, resource_ids: Optional[List[str]] = None, k: int = 5) -> List[Document]:
        """Perform a scoped similarity search (Async)."""
        from qdrant_client.http import models
        
        must_conditions = [
            models.FieldCondition(
                key="metadata.user_id",
                match=models.MatchValue(value=str(user_id))
            )
        ]
        
        if resource_ids:
            must_conditions.append(
                models.FieldCondition(
                    key="metadata.resource_id",
                    match=models.MatchAny(any=[str(rid) for rid in resource_ids])
                )
            )
            
        filter_condition = models.Filter(must=must_conditions)
        
        try:
            return await self.vector_store_instance.asimilarity_search(query, k=k, filter=filter_condition)
        except Exception as e:
            logger.error(f"Qdrant search failed: {e}")
            return []

    async def delete_by_resource(self, resource_id: str, user_id: str):
        """Delete all vectors associated with a resource and user."""
        from qdrant_client.http import models
        try:
            # Sync client call
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=models.FilterSelector(
                    filter=models.Filter(
                        must=[
                            models.FieldCondition(key="metadata.user_id", match=models.MatchValue(value=str(user_id))),
                            models.FieldCondition(key="metadata.resource_id", match=models.MatchValue(value=str(resource_id)))
                        ]
                    )
                )
            )
            logger.info(f"Deleted vectors for resource {resource_id}")
        except Exception as e:
            logger.error(f"Failed to delete vectors: {e}")
