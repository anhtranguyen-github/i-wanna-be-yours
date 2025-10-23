# --- AFTER ---
from langchain_ollama  import ChatOllama
from langchain_ollama  import OllamaEmbeddings
# ... (rest of your LangGraph setup)

class FlexibleModels:
    def __init__(self, mode: str = "HYBRID"):
        # LLM Models
        self.llm = ChatOllama(model="qwen3:0.6b", temperature=0.1)
        
        # JSON Model (for structured output, must use the 'format="json"' parameter)
        self.json_llm = ChatOllama(
            model="qwen3:0.6b", 
            temperature=0, 
            format="json"
        )
        
        # Embedding Model (for Vector Store)
        self.embeddings = OllamaEmbeddings(model="bge-m3")

