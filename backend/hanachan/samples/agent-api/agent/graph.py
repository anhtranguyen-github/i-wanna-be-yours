from .builder import AgentBuilder
from langgraph.checkpoint.memory import MemorySaver

def get_llm(model_name: str):
    if model_name.startswith("ollama/"):
        from langchain_ollama import ChatOllama
        # Strip "ollama/" prefix
        actual_model = model_name.replace("ollama/", "")
        return ChatOllama(model=actual_model, temperature=0, num_ctx=2048)
    elif model_name.startswith("gemini"):
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(model=model_name, temperature=0)
    else:
        from langchain_openai import ChatOpenAI
        # Default to OpenAI for "gpt-*" or unknown
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
