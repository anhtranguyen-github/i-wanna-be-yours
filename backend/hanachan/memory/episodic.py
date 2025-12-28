import os
from langchain_core.documents import Document
import logging

logger = logging.getLogger(__name__)

class EpisodicMemory:
    def __init__(self, collection_name="episodic_memory"):
        # Lazy imports to prevent startup hang
        from langchain_ollama import OllamaEmbeddings
        from langchain_qdrant import QdrantVectorStore
        from qdrant_client import QdrantClient
        
        self.collection_name = collection_name
        self.embedding_model = os.environ.get("EMBEDDING_MODEL", "nomic-embed-text")
        self.embedding_dimension = int(os.environ.get("EMBEDDING_DIMENSION", 768))
        self.ollama_base_url = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
        
        self.embeddings = OllamaEmbeddings(
            model=self.embedding_model,
            base_url=self.ollama_base_url
        )
        
        self.client = QdrantClient(
            host=os.environ.get("QDRANT_HOST", "localhost"),
            port=int(os.environ.get("QDRANT_PORT", 6333))
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
            collections = [c.name for c in self.client.get_collections().collections]
            if self.collection_name not in collections:
                logger.info(f"Creating Qdrant collection: {self.collection_name} with dim={self.embedding_dimension}")
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(size=self.embedding_dimension, distance=Distance.COSINE)
                )
        except Exception as e:
            logger.error(f"Error initializing Qdrant collection: {e}")

    def add_memory(self, summary: str, metadata: dict = None):
        if not metadata:
            metadata = {}
        doc = Document(page_content=summary, metadata=metadata)
        try:
            self.vector_store.add_documents([doc])
        except Exception as e:
            logger.error(f"Failed to add document to Qdrant: {e}")

    def retrieve(self, query: str, k: int = 3) -> str:
        try:
            docs = self.vector_store.similarity_search(query, k=k)
            return "\n".join([f"- {doc.page_content}" for doc in docs])
        except Exception as e:
            logger.error(f"Error retrieving episodic memory: {e}")
            return ""
