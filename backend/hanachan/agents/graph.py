import os
import getpass
from typing import Annotated, TypedDict, List, Optional, Literal
from operator import add
from pydantic import BaseModel, Field # Import from pydantic directly

# LangChain/LLM Components (Flexible Providers - using OpenAI as the base)
# from langchain_core.pydantic_v1 import BaseModel, Field # LangGraph uses pydantic_v1 schema - This import is no longer needed
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.documents import Document
from langchain_core.runnables import RunnableConfig
from langchain_core.output_parsers import JsonOutputParser
from langchain.tools import tool

# External Provider Integrations
# NOTE: Ensure you have 'langchain-openai' installed and OPENAI_API_KEY set

from langchain_community.vectorstores import FAISS # Mock Vector Store
from langgraph.graph import StateGraph, END

from agents.ollama_models import FlexibleModels


docs = [
    Document(page_content="The sun is a star. Stars produce their own light through fusion."),
    Document(page_content="The moon is a natural satellite of Earth and does not produce light; it reflects the sun's light."),
    Document(page_content="Jupiter is the largest planet in our solar system, known for its Great Red Spot."),
    Document(page_content="Advanced RAG systems use query rewriting to improve initial search terms.")
]
# Initialize a base model container to setup the vectorstore once
models = FlexibleModels() 
vectorstore = FAISS.from_documents(docs, models.embeddings)
# The retriever will be dynamically adjusted, but we need a base object
retriever = vectorstore.as_retriever()


MAX_ATTEMPTS = 3



# --- GRAPH STATE AND SCHEMAS ---

class AgentState(TypedDict):
    """The shared state passed between all nodes."""
    question: str # Original user query
    rewritten_query: str # The query used for the current retrieval attempt
    documents: Annotated[List[Document], add] # List of documents, combined cumulatively
    retrieval_attempts: int # Counter to prevent infinite loops
    mode: str # FAST, PRECISE, HYBRID
    final_answer: str # The final generated response

class ContextAnalysisOutput(BaseModel):
    """Schema for the Context Analysis Node's structured output."""
    decision: Literal["RETRIEVE", "REWRITE", "FALLBACK"] = Field(
        description="The next step: 'REWRITE' to improve query, 'RETRIEVE' to execute search, or 'FALLBACK' if unanswerable."
    )
    new_query: Optional[str] = Field(
        description="The optimized search query if decision is 'REWRITE'. Must be the same as the current query if the decision is 'RETRIEVE'."
    )

class RetrievalDecision(BaseModel):
    """Schema for the Retrieve Node's structured quality check output."""
    decision: Literal["REWRITE", "GENERATE"] = Field(
        description="'REWRITE' if documents are insufficient/irrelevant, or 'GENERATE' if the context is good."
    )

# --- RETRIEVAL TOOL (Database Interaction) ---

@tool
def get_documents_faiss(query: str, k: int) -> List[Document]:
    """
    Retrieves documents from the FAISS vector store. This is the database tool.
    """
    # Note: In a real application, this function would handle initialization 
    # and connection management, but here it uses the global 'retriever'.
    retriever = vectorstore.as_retriever(search_kwargs={"k": k})
    retrieved_docs = retriever.invoke(query)
    return retrieved_docs



# --- 2.1. CONTEXT ANALYSIS NODE (Router + Rewrite Logic) ---

def context_analysis_node(state: AgentState) -> AgentState:
    """
    Analyzes the query, decides on rewrite/retrieve/fallback, and performs rewrite.
    """
    print("---CONTEXT ANALYSIS NODE---")
    
    # Initialize models for this node's execution based on mode
    models = FlexibleModels(state["mode"])

    # Use the current query or the original question if it's the first pass
    current_query = state.get("rewritten_query") or state["question"]
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", 
         "You analyze the query to optimize retrieval. If the query is ambiguous, conversational, or has led to poor results, "
         "output 'REWRITE' with an improved, concise search query. Otherwise, if the query is clear and ready for search, "
         "output 'RETRIEVE' and repeat the current query in 'new_query'. Output 'FALLBACK' if unanswerable. "
         f"Current Mode: {state['mode']}."),
        ("human", f"Current Query to Analyze: {current_query}")
    ])
    
    router_chain = prompt | models.json_llm.with_structured_output(ContextAnalysisOutput)
    
    analysis_output = router_chain.invoke({})
    
    decision = analysis_output.decision
    new_query = analysis_output.new_query
    
    print(f"Decision: {decision}")
    
    # Transition Logic
    if decision == "FALLBACK":
        return {"final_answer": "I cannot answer this question with the available information."}
    
    # For both REWRITE and RETRIEVE, we proceed to retrieval. We must update the query state.
    if new_query:
        print(f"Query for Retrieval: {new_query}")
        return {"rewritten_query": new_query}
    else:
         # Should not happen if schema is followed, but handles case where LLM missed new_query
        return {"rewritten_query": current_query}


# --- 2.2. RETRIEVE NODE (Tool Call + Conditional Edge) ---

def retrieve_node(state: AgentState) -> dict:
    """
    Executes retrieval via the tool and assesses document quality.
    """
    print("---RETRIEVE NODE---")
    
    models = FlexibleModels(state["mode"])
    query = state["rewritten_query"]
    new_attempts = state["retrieval_attempts"] + 1
    
    # Define retrieval parameters based on mode
    k_val = 2 if state["mode"] == "PRECISE" else 1
    
    # --- TOOL EXECUTION (The Database Interaction) ---
    print(f"Tool Call: Searching with: '{query}' (k={k_val}, Attempt: {new_attempts})")
    docs = get_documents_faiss.invoke({"query": query, "k": k_val})
    doc_contents = "\n\n---\n\n".join([d.page_content for d in docs])
    
    # --- Quality Assessment ---
    
    # 1. Hard stop check (prevent infinite loop)
    if new_attempts >= MAX_ATTEMPTS:
        print(f"Max attempts ({MAX_ATTEMPTS}) reached. Forcing Generation with available docs.")
        return {"documents": docs, "retrieval_attempts": new_attempts}

    # 2. LLM-based decision
    quality_prompt = ChatPromptTemplate.from_messages([
        ("system", 
         "You are a document quality grader. Your only task is to decide if the retrieved documents are relevant and sufficient "
         "to answer the original question. Output 'GENERATE' if context is good, or 'REWRITE' if context is poor. "
         f"Mode: {state['mode']}."),
        ("human", 
         f"Original Question: {state['question']}\n\n"
         f"Retrieved Documents:\n{doc_contents}")
    ])

    grader_chain = quality_prompt | models.json_llm.with_structured_output(RetrievalDecision)
    decision = grader_chain.invoke({}).decision
    
    print(f"Retrieval Decision: {decision}")
    
    # 3. State update and transition signal
    if decision == "REWRITE":
        # Only update attempt count. Graph transitions back to Context Analysis.
        return {"retrieval_attempts": new_attempts} 
    else: # GENERATE
        # Update attempts AND add documents. Graph transitions to Generate.
        return {"documents": docs, "retrieval_attempts": new_attempts}


# --- 2.3. GENERATE NODE (Final Answer) ---

def generate_node(state: AgentState) -> dict:
    """
    Synthesizes the final answer using the retrieved context.
    """
    print("---GENERATE NODE---")

    models = FlexibleModels(state["mode"])
    context = "\n\n---\n\n".join([d.page_content for d in state["documents"]])

    # Final RAG Prompt
    prompt = ChatPromptTemplate.from_messages([
        ("system", 
         "You are a helpful assistant. Use ONLY the following context to answer the user's question. "
         "If the context does not contain the answer, state that you cannot answer based on the provided information. "
         f"Mode: {state['mode']}\n\nCONTEXT:\n{context}"),
        ("human", f"QUESTION: {state['question']}")
    ])
    
    final_answer = (prompt | models.llm).invoke({}).content
    
    return {"final_answer": final_answer}



# --- 3.1. CONDITIONAL EDGE FUNCTION ---

def route_from_retrieve(state: AgentState) -> str:
    """
    Conditional edge function for the Retrieve Node's output.
    The Retrieve Node only returns documents when the decision is 'GENERATE'.
    If the 'documents' list is updated, we go to GENERATE.
    Otherwise, we loop back for 'CONTEXT_ANALYSIS' (rewrite).
    """
    if state["retrieval_attempts"] >= MAX_ATTEMPTS or state["documents"]:
        # We must generate if attempts are maxed or if documents were added (meaning 'GENERATE' decision)
        return "GENERATE"
    
    # If only the attempt counter was updated, the decision was 'REWRITE'
    return "CONTEXT_ANALYSIS"


# --- 3.2. BUILD THE GRAPH ---

workflow = StateGraph(AgentState)

# 1. Add Nodes
workflow.add_node("context_analysis", context_analysis_node)
workflow.add_node("retrieve", retrieve_node)
workflow.add_node("generate", generate_node)

# 2. Set Entry Point
workflow.set_entry_point("context_analysis")

# 3. Add Edges (Fixed Transitions)
# CA always leads to Retrieve (after optionally performing a rewrite)
workflow.add_edge("context_analysis", "retrieve")
# Generate is the end of the line
workflow.add_edge("generate", END)

# 4. Add Conditional Edges (The Iterative Loop)
# Retrieve Node is the decision point
workflow.add_conditional_edges(
    "retrieve",
    route_from_retrieve,
    {
        "CONTEXT_ANALYSIS": "context_analysis", # Loop back for re-evaluation/rewrite
        "GENERATE": "generate",                 # Context is sufficient
    },
)

# Compile the Graph
app = workflow.compile()


