import os
import socket
from langchain_core.documents import Document
import logging

logger = logging.getLogger(__name__)

class EpisodicMemory:
    def __init__(self, collection_name="episodic_memory"):
        # Lazy imports to prevent startup hang
        from langchain_qdrant import QdrantVectorStore
        from qdrant_client import QdrantClient
        from services.llm_factory import ModelFactory
        
        self.collection_name = collection_name
        self.embedding_dimension = int(os.environ.get("EMBEDDING_DIMENSION", 1536))
        
        # Use Factory for embeddings (handles OpenAI vs Ollama)
        self.embeddings = ModelFactory.create_embeddings()
        
        qdrant_host = os.environ.get("QDRANT_HOST", "localhost")
        qdrant_port = int(os.environ.get("QDRANT_PORT", 6333))
        
        # Resolve hostname to IP to avoid discovery issues in some Docker/IPv6 environments
        try:
            target_ip = socket.gethostbyname(qdrant_host)
            logger.info(f"Connecting to Qdrant at {qdrant_host} ({target_ip}):{qdrant_port}")
        except Exception as e:
            logger.warning(f"DNS resolution failed for {qdrant_host}, falling back to hostname: {e}")
            target_ip = qdrant_host

        self.client = QdrantClient(
            host=target_ip,
            port=qdrant_port,
            prefer_grpc=False # HTTP/1.1 is more stable for this setup
        )
        
        # Initialize collection
        self._init_collection()
        
        self.vector_store = QdrantVectorStore(
            client=self.client,
            collection_name=self.collection_name,
            embedding=self.embeddings
        )

    def _init_collection(self):
        try:
            from qdrant_client.http.models import Distance, VectorParams
            # Check if collection exists
            collections = self.client.get_collections().collections
            exists = any(c.name == self.collection_name for c in collections)
            
            if not exists:
                logger.info(f"Creating Qdrant collection: {self.collection_name} with dim={self.embedding_dimension}")
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(size=self.embedding_dimension, distance=Distance.COSINE)
                )
            else:
                logger.debug(f"Qdrant collection {self.collection_name} already exists.")
        except Exception as e:
            logger.error(f"Error initializing Qdrant collection: {e}")

    def add_memory(self, summary: str, user_id: str, metadata: dict = None):
        if not user_id:
            logger.error("Attempted to add memory without user_id!")
            return
            
        if not metadata:
            metadata = {}
        
        # Enforce user_id in metadata
        metadata["user_id"] = str(user_id)
        
        doc = Document(page_content=summary, metadata=metadata)
        try:
            self.vector_store.add_documents([doc])
        except Exception as e:
            logger.error(f"Failed to add document to Qdrant: {e}")

    def retrieve(self, query: str, user_id: str, k: int = 3, metadata_filter: dict = None) -> str:
        if not user_id:
            logger.warning("Attempted to retrieve memory without user_id - returning empty result for safety.")
            return ""
            
        try:
            from qdrant_client.http import models
            
            # Start with User ID filter (Always required)
            must_conditions = [
                models.FieldCondition(
                    key="metadata.user_id",
                    match=models.MatchValue(value=str(user_id))
                )
            ]
            
            # Add dynamic metadata filters
            if metadata_filter:
                for key, value in metadata_filter.items():
                    # Support list of values (MatchAny) or single value (MatchValue)
                    if isinstance(value, list):
                        must_conditions.append(
                            models.FieldCondition(
                                key=f"metadata.{key}",
                                match=models.MatchAny(any=value)
                            )
                        )
                    else:
                        must_conditions.append(
                            models.FieldCondition(
                                key=f"metadata.{key}",
                                match=models.MatchValue(value=value)
                            )
                        )
            
            filter_condition = models.Filter(must=must_conditions)
            
            docs = self.vector_store.similarity_search(
                query, 
                k=k,
                filter=filter_condition
            )
            
            if not docs:
                return ""
                
            return "\n\n".join([f"--- Excerpt from {doc.metadata.get('source', 'Unknown')} ---\n{doc.page_content}" for doc in docs])
        except Exception as e:
            logger.error(f"Error retrieving episodic memory: {e}")
            return ""
