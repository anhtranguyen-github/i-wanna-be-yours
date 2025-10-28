import os
import getpass
from typing import Annotated, TypedDict, List, Optional, Literal, Dict, Any
from operator import add
from pydantic import BaseModel, Field 
from uuid import UUID

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.documents import Document
from langchain_core.runnables import RunnableConfig
from langchain_core.callbacks import BaseCallbackHandler
from langchain_core.output_parsers import JsonOutputParser
from langchain.tools import tool


from langchain_community.vectorstores import FAISS
from langchain_tavily import TavilySearch


from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver


from agents.ollama_models import FlexibleModels


docs_set_1_tax_deadlines = [
    Document(page_content="The 2024 Corporate Tax Regulation Amendment stipulates that all enterprises with annual revenue exceeding $100 million must file their compliance reports by March 15th."), # Target 1 (Large Corp.)
    Document(page_content="Q1 Financial Reporting Guidelines for Startups clarify that small businesses (under $5 million revenue) are granted an extension, with a final deadline of April 30th."), # Target 2 (Startup)
    Document(page_content="The standard administrative filing deadline for non-financial reports is June 1st for all entities."), # Distractor (Generic Date)
    Document(page_content="New HR compliance mandates take effect on January 1st, requiring all staff training to be completed by February 28th."), # Distractor (Non-Financial)
    Document(page_content="Tax Code Section 4.5: Revenue Definitions details the exact calculation method for 'annual revenue' but contains no dates.") # Distractor (Relevant Keywords, but Missing Answer)
]

# --- Set 2: Conceptual Bridging and Contextual Rewriting ---
# Test Focus: Inferential query requires rewrite using technical terms like 'superposition decay' or 'ambient temperature.'
docs_set_2_quantum_physics = [
    Document(page_content="The process of superposition decay is a primary limiting factor in the practical application of Qubit architectures operating at room temperature."), # Target 1 (Primary Limiting Factor)
    Document(page_content="While superconducting materials offer stability, achieving quantum coherence at ambient temperatures remains the 'holy grail' of the field."), # Target 2 (Conceptual Challenge)
    Document(page_content="Superconductor Cooling Systems: Requires specialized systems to maintain temperatures near absolute zero for current commercial quantum systems."), # Distractor (Opposite of Room-Temp)
    Document(page_content="Microchip Manufacturing Challenges: The challenge of miniaturization is constrained by the physical limits of current silicon doping techniques."), # Distractor (Related Tech/Wrong Area)
    Document(page_content="Laser Cooling Techniques in Particle Physics: Uses focused lasers to slow down atomic motion, creating ultra-cold environments for particle manipulation.") # Distractor (Tangential Tech/Wrong Focus)
]

# --- Set 3: Initial Low-Relevance & Retrieval Retry ---
# Test Focus: Initial misleading query ('natural pigment') should fail, forcing a rewrite to 'synthetic indigo' to find the answer.
docs_set_3_pigment_origin = [
    Document(page_content="Historical Use of Blue Pigments in Art: Ultramarine, a natural pigment, was historically used for depicting the Virgin Mary's robes due to its expense and vibrancy."), # Initial Distractor (Matches 'natural blue pigment')
    Document(page_content="The Production of Synthetic Indigo Dye: The primary application of synthetic indigo is in textiles. Its chemical structure was first successfully synthesized by Adolf von Baeyer in 1883."), # Target (The correct answer)
    Document(page_content="Ancient Egyptian Textile Dyes: The earliest known textile dye was madder, which produces a rich red color."), # Distractor (Mentions 'textiles' and 'dye' but wrong color/answer)
    Document(page_content="Discovery of Prussian Blue: A synthetic pigment, accidentally created in the early 18th century, primarily used for oil paints."), # Distractor (Synthetic/Blue, but wrong application)
    Document(page_content="The Indigo Plant and Cultivation: Discusses the agricultural process of extracting the natural dye from the plant leaves."), # Distractor (Natural Indigo, but missing the 'who first created' synthetic answer)
]


# Initialize a base model container to setup the vectorstore once
models = FlexibleModels() 
vectorstore = FAISS.from_documents(docs_set_1_tax_deadlines + docs_set_2_quantum_physics + docs_set_3_pigment_origin, models.embeddings)
# The retriever will be dynamically adjusted, but we need a base object
retriever = vectorstore.as_retriever()


# --- CUSTOM TRACER ---

class CustomTracer(BaseCallbackHandler):
    """A custom tracer that prints node inputs and outputs for debugging."""
    node_name: str = "Unknown"

    def on_chain_start(
        self,
        serialized: Dict[str, Any],
        inputs: Dict[str, Any],
        *,
        run_id: UUID,
        parent_run_id: Optional[UUID] = None,
        tags: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> Any:
        """Run when a node (as a chain) starts."""
        # Add a check to ensure 'serialized' is not None
        if serialized:
            self.node_name = serialized.get("name", "Unknown Node")
            # We only want to trace our main graph nodes, not every single runnable
            if self.node_name in ["context_analysis", "retrieve", "grader", "generate"]:
                print(f"\n--- [TRACE] START: {self.node_name} ---")

    def on_chain_end(
        self,
        outputs: Dict[str, Any],
        **kwargs: Any,
    ) -> Any:
        """Run when a node (as a chain) ends, and print its output."""
        if self.node_name in ["context_analysis", "retrieve", "grader", "generate"]:
            print("  [TRACE] OUTPUT:")
            for key, value in outputs.items():
                print(f"    - {key}: {value}")
            print(f"--- [TRACE] END: {self.node_name} ---")

MAX_ATTEMPTS = 3



# --- GRAPH STATE AND SCHEMAS ---

class AgentState(TypedDict):
    """The shared state passed between all nodes."""
    question: str # Original user query
    rewritten_query: str # The query used for the current retrieval attempt
    documents: Annotated[List[Document], add] # List of documents, combined cumulatively
    retrieval_attempts: int # Counter to prevent infinite loops
    mode: str # FAST, PRECISE, HYBRID
    retrieval_decision: Optional[str] # The decision from the grader node
    use_grader: bool # Whether to use the quality grader node
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
    # Add a field for the grader's reasoning to improve traceability
    reasoning: str = Field(
        description="A brief explanation for the decision."
    )


# --- RETRIEVAL TOOL (Database Interaction) ---

@tool
def get_documents_faiss(query: str, k: int) -> List[Document]:
    """
    Retrieves relevant documents from the internal knowledge base (FAISS vector store).
    Use this for questions about specific company policies, historical data, or well-established facts.
    """
    # Note: In a real application, this function would handle initialization 
    # and connection management, but here it uses the global 'retriever'.
    retriever = vectorstore.as_retriever(search_kwargs={"k": k})
    retrieved_docs = retriever.invoke(query)
    return retrieved_docs

# Instantiate the Tavily search tool directly.
# It's already a tool, so we don't need to wrap it with @tool.
search_web_tavily = TavilySearch(max_results=3)
search_web_tavily.name = "search_web_tavily"
search_web_tavily.description = "Performs a web search using the Tavily API for up-to-date information, current events, or general knowledge."


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
    
    models = FlexibleModels(state["mode"]) # Initialize models for this node's execution
    query = state["rewritten_query"]
    new_attempts = state["retrieval_attempts"] + 1
    
    # Define retrieval parameters based on mode
    k_val = 5 if state["mode"] == "PRECISE" else 3
    
    # --- TOOL EXECUTION (DB + Web) ---
    print(f"Tool Call: Searching DB with: '{query}' (k={k_val}, Attempt: {new_attempts})")
    db_docs = get_documents_faiss.invoke({"query": query, "k": k_val})
    
    print(f"Tool Call: Searching Web with: '{query}'")
    web_results = search_web_tavily.invoke({"query": query})

    # The actual search results are in the 'results' key of the returned dictionary.
    web_docs = [Document(page_content=res["content"], metadata={"source": res["url"]}) for res in web_results["results"]]
    
    # Combine and update state
    all_docs = db_docs + web_docs
    return {"documents": all_docs, "retrieval_attempts": new_attempts}


# --- 2.2.5. GRADER NODE (New) ---

def grader_node(state: AgentState) -> dict:
    """
    Assesses the quality of the retrieved documents. This is a separate, conditional step.
    """
    print("---GRADER NODE---")
    
    # If grader is disabled, or we've hit max attempts, force GENERATE
    if not state["use_grader"] or state["retrieval_attempts"] >= MAX_ATTEMPTS:
        if state["retrieval_attempts"] >= MAX_ATTEMPTS:
            print(f"Max attempts ({MAX_ATTEMPTS}) reached. Forcing Generation.")
        print("Retrieval Decision: GENERATE (Grader Skipped/Max Attempts)")
        return {"retrieval_decision": "GENERATE"}

    models = FlexibleModels(state["mode"])
    doc_contents = "\n\n---\n\n".join([d.page_content for d in state["documents"]])

    quality_prompt = ChatPromptTemplate.from_messages([
        ("system", 
         "You are a document quality grader. Your only task is to decide if the retrieved documents are relevant and sufficient "
         "to answer the original question. Output 'GENERATE' if context is good, or 'REWRITE' if context is poor. "
         "Provide a brief reasoning for your choice."),
        ("human", 
         f"Original Question: {state['question']}\n\n"
         f"Retrieved Documents:\n{doc_contents}")
    ])

    grader_chain = quality_prompt | models.json_llm.with_structured_output(RetrievalDecision)
    result = grader_chain.invoke({})
    
    print(f"Retrieval Decision: {result.decision} (Reason: {result.reasoning})")
    
    # The grader's decision is stored in a new state field to guide the conditional edge
    return {"retrieval_decision": result.decision}


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
    Routes to the grader if enabled, otherwise goes directly to generate.
    """
    if state.get("use_grader", False):
        return "GRADER"
    else:
        return "GENERATE"

def route_from_grader(state: AgentState) -> str:
    """
    Conditional edge function for the Grader Node's output.
    This function routes the graph based on the grader's decision.
    """
    if state.get("retrieval_decision") == "GENERATE":
        return "GENERATE"
    else: # 'REWRITE'
        # Clear documents to avoid polluting the next retrieval attempt
        state["documents"] = []
        return "CONTEXT_ANALYSIS"


# --- 3.2. BUILD THE GRAPH ---

workflow = StateGraph(AgentState)

# 1. Add Nodes
workflow.add_node("context_analysis", context_analysis_node)
workflow.add_node("retrieve", retrieve_node)
workflow.add_node("grader", grader_node)
workflow.add_node("generate", generate_node)

# 2. Set Entry Point
workflow.set_entry_point("context_analysis")

# 3. Add Edges (Fixed Transitions)
workflow.add_edge("context_analysis", "retrieve")
workflow.add_edge("generate", END)

# 4. Add Conditional Edges (The Iterative Loop)
# The Retrieve node decides whether to use the grader
workflow.add_conditional_edges(
    "retrieve",
    route_from_retrieve,
    {
        "GRADER": "grader",
        "GENERATE": "generate",
    },
)
# The Grader Node decides whether to loop back or generate
workflow.add_conditional_edges(
    "grader",
    route_from_grader,
    {
        "CONTEXT_ANALYSIS": "context_analysis", # Loop back for re-evaluation/rewrite
        "GENERATE": "generate",                 # Context is sufficient
    },
)

checkpointer = MemorySaver()
app = workflow.compile(checkpointer=checkpointer)
