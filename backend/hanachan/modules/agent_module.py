from typing import TypedDict, Annotated, List
from langgraph.graph import StateGraph, END
from langchain_core.messages import BaseMessage, HumanMessage
from operator import itemgetter
import os

from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_ollama import ChatOllama

from modules.context.combined_context import (
    UserProfile, ConversationHistory, SystemContext, RetrievedKnowledge, ToolContext,
    ConversationGoalTracker, ContextManager, UserQueryModel, QueryPartModel
)
from modules.data_models import Prompt, QueryType
from modules.config import config

# --- LLM Router ---
class LLMProvider:
    """A router to get an instance of a specified LLM."""
    @staticmethod
    def get_llm(provider: str = None, model_name: str = None):
        provider = provider or config.DEFAULT_LLM_PROVIDER
        model_name = model_name or config.MODELS[provider]['default']

        if provider == "openai":
            # Ensure OPENAI_API_KEY is set in your environment variables
            return ChatOpenAI(model=model_name, temperature=0.1)
        elif provider == "ollama":
            return ChatOllama(model=model_name, temperature=0.1)
        raise ValueError(f"Unsupported LLM provider: {provider}")

# --- Initialize the Context Manager and Dependencies ---
user_profile = UserProfile()
conversation_history = ConversationHistory()
system_context = SystemContext()
retrieved_knowledge = RetrievedKnowledge()
tool_context = ToolContext()
conversation_goal_tracker = ConversationGoalTracker()

CONTEXT_MANAGER = ContextManager(
    user_profile, conversation_history, system_context,
    retrieved_knowledge, tool_context, conversation_goal_tracker
)

# 1. Define the Shared State (Updated)
class AgentState(TypedDict):
    """
    Represents the state of our graph, primarily holding the structured Prompt.
    """
    prompt_context: Prompt # Your comprehensive Prompt dataclass
    # We still keep a history list to track messages generated *during* the graph run.
    chat_history: Annotated[List[BaseMessage], itemgetter("chat_history")] 
    next_node: str # Used by the Planner to guide flow
    llm_provider: str # The LLM provider to use (e.g., "ollama", "openai")
    llm_model_name: str # The specific model name for the provider
    
    
def context_loader(state: AgentState) -> dict:
    """
    (New Node) Calls the ContextManager to build the initial structured prompt.
    This replaces the need to manually pass all data.
    """
    print("--- 0. CONTEXT LOADER NODE ---")
    
    # Placeholder identifiers for a session and user
    USER_ID = config.TEST_USER_ID
    SESSION_ID = config.TEST_SESSION_ID
    
    # We need to simulate the input coming from the API request model
    # Example: User asks about the Japanese particles 'wa' and 'ga'
    user_query_model = UserQueryModel(
        parts=[QueryPartModel(type=QueryType.TEXT, content="Explain the difference between 'wa' and 'ga'.")]
    )

    prompt_data = CONTEXT_MANAGER.build_prompt_data(
        user_id=USER_ID, 
        session_id=SESSION_ID, 
        user_query_model=user_query_model
    )
    
    # Note: We can force the Retriever to run first if knowledge hasn't been searched yet, 
    # but since your ContextManager already handles the initial search, we can go straight to the Planner.
    return {"prompt_context": prompt_data}



def planner_node(state: AgentState) -> dict:
    """(Planner) Determines the next action (Tutor or Synthesizer)."""
    print("--- 1. PLANNER NODE ---")
    
    # Access the context
    knowledge = state['prompt_context'].retrieved_knowledge
    available_tools = state['prompt_context'].available_tools
    
    # LLM logic here to determine the next step 
    # (e.g., check if tool-calling is needed or if context is sufficient)
    
    # Heuristic Logic based on available context and goals:
    if knowledge and knowledge[0].content:
        # Knowledge was found by the initial search in the Context Manager (e.g., about 'wa/ga'). 
        # Skip the Retriever node and go straight to Tutor for reasoning.
        next_step = "tutor"
    elif any(tool.name == "explain_grammar" for tool in available_tools):
        # If no knowledge was found but a relevant tool exists, go to Tutor to use the tool.
        next_step = "tutor"
    else:
        # If context is sparse and no specific tool is required, just synthesize based on instructions.
        next_step = "synthesizer"

    print(f"Planner decision: {next_step}")
    return {"next_node": next_step}


def retriever_node(state: AgentState) -> dict:
    """(Retriever) Performs a follow-up search if required by the Planner."""
    print("--- 2. RETRIEVER NODE (Follow-up) ---")
    
    # Example: If the initial context was empty, perform a generic search.
    current_query = state['prompt_context'].user_query.parts[0].content
    
    # Call the search method again, perhaps with a modified query
    new_knowledge = CONTEXT_MANAGER.retrieved_knowledge.search(f"detailed {current_query}")
    
    # Update the prompt context with the new knowledge
    state['prompt_context'].retrieved_knowledge.extend(new_knowledge)
    
    return {"prompt_context": state['prompt_context']}


def tutor_node(state: AgentState) -> dict:
    """(Tutor) Reasons about the context, uses tools, and prepares for synthesis."""
    print("--- 3. TUTOR NODE ---")
    
    # In a real scenario, this node would contain an LLM call to:
    # 1. Analyze the retrieved_knowledge and available_tools from prompt_context.
    # 2. Decide whether to call a tool (e.g., explain_grammar).
    # 3. If a tool is called, format the ToolMessage and add it to chat_history.
    # 4. If no tool is needed, it might add its reasoning as an AIMessage.
    
    # For this example, we'll just pass the state through.
    # The synthesizer will have access to the same prompt_context.
    print("Tutor node passes context to synthesizer.")
    return {} # No change to the state, just passing through



def synthesizer_node(state: AgentState) -> dict:
    """(Synthesizer) Generates the final, high-quality response."""
    print("--- 4. SYNTHESIZER NODE ---")
    
    context = state['prompt_context']
    
    # --- LLM Selection ---
    # The provider and model are now read from the graph's state,
    # making the choice dynamic at runtime.
    # For OpenAI, ensure OPENAI_API_KEY is set in your environment:
    # os.environ["OPENAI_API_KEY"] = "your-key-here"
    llm_provider = state.get("llm_provider", config.DEFAULT_LLM_PROVIDER)
    llm_model_name = state.get("llm_model_name", config.DEFAULT_LLM_MODEL)
    llm = LLMProvider.get_llm(provider=llm_provider, model_name=llm_model_name)
    print(f"Synthesizer is using: {llm_provider} ({llm.model})")

    # Create a structured prompt for the LLM
    prompt_template = ChatPromptTemplate.from_messages(
        [
            ("system", "{system_prompt}\n\n--- USER PROFILE ---\n{user_profile}\n\n--- KNOWLEDGE & TOOLS ---\n{knowledge}"),
            ("human", "{user_query}"),
        ]
    )
    
    # Chain the prompt with the selected LLM
    chain = prompt_template | llm
    
    # Invoke the chain with the context from the state
    final_response = chain.invoke({
        "system_prompt": context.system_prompt['system_prompt'],
        "user_profile": str(context.user_profile),
        "knowledge": str(context.retrieved_knowledge),
        "user_query": context.user_query.parts[0].content
    })
    
    # Return the final output message
    return {"chat_history": [final_response]}




# Create the graph
workflow = StateGraph(AgentState)

# Add Nodes
workflow.add_node("context_loader", context_loader) # New entry node
workflow.add_node("planner", planner_node)
workflow.add_node("retriever", retriever_node)
workflow.add_node("tutor", tutor_node)
workflow.add_node("synthesizer", synthesizer_node)

# Set the Entry Point
workflow.set_entry_point("context_loader")

# Sequential Start
workflow.add_edge("context_loader", "planner")

# Conditional Edges from Planner
def route_planner(state):
    return state.get("next_node")

workflow.add_conditional_edges(
    "planner",
    route_planner,
    {
        "retriever": "retriever",  # Go for a second search
        "tutor": "tutor",          # Go for reasoning/tool use
        "synthesizer": "synthesizer",# Go straight to output
    },
)

# Sequential Edges
workflow.add_edge("retriever", "tutor") # Retrieval results go to Tutor
workflow.add_edge("tutor", "synthesizer") # Tutor's output goes to Synthesizer

# End Condition
workflow.add_edge("synthesizer", END)

# Compile the graph
app = workflow.compile()

# --- RUN THE GRAPH ---
print("\n--- RUNNING THE SOPHISTICATED AGENT ---")
# The initial state now includes the LLM choice, which can be changed at runtime.
initial_state = {
    "chat_history": [],
    "llm_provider": config.DEFAULT_LLM_PROVIDER,
    "llm_model_name": config.DEFAULT_LLM_MODEL
}
final_state = app.invoke(initial_state)

print("\n\n✅ FINAL AGENT OUTPUT:")
if final_state['chat_history']:
    print(final_state['chat_history'][-1].content)