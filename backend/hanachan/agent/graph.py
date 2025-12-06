from .builder import AgentBuilder
import os

def get_llm(model_name: str):
    # Support basic model switching
    if model_name.startswith("ollama/"):
        from langchain_ollama import ChatOllama
        # Strip "ollama/" prefix
        actual_model = model_name.replace("ollama/", "")
        base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        return ChatOllama(model=actual_model, temperature=0, num_ctx=512, base_url=base_url)
    # Add other providers as needed (OpenAI, Google, etc mapping to existing config)
    else:
        # Default fallback or Mock
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(model=model_name, temperature=0)

def get_agent_graph(tools=None, checkpointer=None, model_name="gpt-4o"):
    if tools is None:
        tools = []
    
    llm = get_llm(model_name)
    
    system_prompt = "You are a helpful AI assistant."
    
    builder = AgentBuilder(
        tools=tools,
        llm=llm,
        prompt=system_prompt,
        checkpointer=checkpointer
    )
    
    return builder.build()
