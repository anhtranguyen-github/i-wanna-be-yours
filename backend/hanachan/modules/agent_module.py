# mas_graph.py

import operator
import os
from typing import TypedDict, Annotated, List, Dict, Any, Literal
from pydantic import BaseModel, Field

from langgraph.graph import StateGraph, END, START
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate

# Import the necessary components from your data model file
from data_models import (
    Turn, UserProfileModel, CurrentConversationGoal,
    RetrievedKnowledgeItem, UserQuery, Speaker,
    KnowledgeType
)

# Import the model factory and config loader
from llm_factory import load_config, create_llm_instance 


# --- 1. Model Configuration and Initialization ---

# Load configuration (from simulated external file/env)
GLOBAL_CONFIG = load_config()
LLM_CONFIG = GLOBAL_CONFIG["llm_config"]

# Initialize LLMs using the factory, based on the flexible configuration
router_llm = create_llm_instance(
    model_name=LLM_CONFIG["router_model_name"], 
    config=LLM_CONFIG
)
reasoning_llm = create_llm_instance(
    model_name=LLM_CONFIG["reasoning_model_name"], 
    config=LLM_CONFIG
)


# 1.1. Router Output Schema (for Planner/Model Router)
class AgentDecision(BaseModel):
    """Structured output for the Planner (Model Router) decision."""
    reasoning_agent: Literal["PedagogicalTeacher", "CulturalSpecial"] = Field(
        ...,
        description="The primary specialized agent for deeper reasoning on the topic."
    )
    knowledge_tool: Literal["Retriever", "None"] = Field(
        ...,
        description="Whether an external information retrieval (Retriever) tool is needed. Output 'Retriever' if external search is required, 'None' otherwise."
    )


# --- 2. Define the Graph State ---

class AgentState(TypedDict):
    """
    Represents the state of the graph, shared across all nodes.
    This structure remains the single source of truth for the MAS.
    """
    user_profile: UserProfileModel
    user_query: UserQuery
    routing_decision: AgentDecision 
    retrieved_knowledge: Annotated[List[RetrievedKnowledgeItem], operator.add]
    pedagogical_plan: str
    cultural_context: str
    final_agent_response: str
    conversation_history: Annotated[List[Turn], operator.add]


# --- 3. Define Agent Functions (Nodes) ---

def planner_node(state: AgentState) -> Dict[str, Any]:
    """
    The Planner acts as the Model Router, using the configured router_llm.
    """
    print(f"--- Running Planner (Model Router) using {LLM_CONFIG['router_model_name']} ---")
    
    query_text = state['user_query'].parts[0].content
    planner_router = router_llm.with_structured_output(AgentDecision)

    router_prompt = ChatPromptTemplate.from_messages([
        SystemMessage(
            "You are an expert AI planner. Analyze the user's query and their profile "
            "to decide which specialized agents and external tools are required."
        ),
        HumanMessage(content=f"User Query: {query_text}")
    ])
    
    prompt_input = {
        "proficiency_level": state['user_profile'].proficiency_level,
        "interests": ", ".join(state['user_profile'].interests),
        "query": query_text
    }

    decision: AgentDecision = (router_prompt | planner_router).invoke(prompt_input)
    
    print(f"Planner Decision: {decision.model_dump()}")
    return {"routing_decision": decision}


def retriever_node(state: AgentState) -> Dict[str, Any]:
    """Retrieves knowledge using the configured reasoning_llm and tool identifier."""
    if state['routing_decision'].knowledge_tool != "Retriever":
        print("--- Retriever skipped (Routing decision was 'None') ---")
        return {"retrieved_knowledge": []}

    print(f"--- Running Retriever Node using {LLM_CONFIG['reasoning_model_name']} ---")
    query_text = state['user_query'].parts[0].content

    # Simulate a search result using the configured LLM
    search_result_prompt = ChatPromptTemplate.from_messages([
        SystemMessage(f"You are an expert search engine using the {GLOBAL_CONFIG['tool_config']['default_retriever']}. For the query, provide a single, concise factual finding."),
        HumanMessage(content=f"Query: {query_text}")
    ])
    
    content = reasoning_llm.invoke(search_result_prompt).content
    
    knowledge = RetrievedKnowledgeItem(
        type=KnowledgeType.API_RESULT,
        content=content,
        source=GLOBAL_CONFIG['tool_config']['default_retriever']
    )
    
    print(f"Retrieved: {knowledge.content[:50]}...")
    return {"retrieved_knowledge": [knowledge]}


def pedagogical_teacher_node(state: AgentState) -> Dict[str, Any]:
    """Generates a pedagogical plan using the configured reasoning_llm."""
    print(f"--- Running Pedagogical Teacher Node using {LLM_CONFIG['reasoning_model_name']} ---")
    query_text = state['user_query'].parts[0].content
    profile = state['user_profile']

    pedagogical_prompt = ChatPromptTemplate.from_messages([
        SystemMessage(
            f"You are a language teacher specializing in {profile.target_language} at the {profile.proficiency_level} level. "
            "Formulate a short, actionable learning task or pedagogical context based on the user's query and profile."
        ),
        HumanMessage(content=f"User query: {query_text}.")
    ])

    plan = reasoning_llm.invoke(pedagogical_prompt).content
    print(f"Pedagogical Plan generated: {plan[:50]}...")
    return {"pedagogical_plan": plan}


def cultural_special_node(state: AgentState) -> Dict[str, Any]:
    """Generates cultural context using the configured reasoning_llm."""
    print(f"--- Running Cultural Specialist Node using {LLM_CONFIG['reasoning_model_name']} ---")
    query_text = state['user_query'].parts[0].content
    
    cultural_prompt = ChatPromptTemplate.from_messages([
        SystemMessage(
            "You are a cultural specialist. Provide a brief, relevant cultural context or anecdote for the user's query."
        ),
        HumanMessage(content=f"Query: {query_text}")
    ])

    context = reasoning_llm.invoke(cultural_prompt).content
    print(f"Cultural Context generated: {context[:50]}...")
    return {"cultural_context": context}


def synthesizer_node(state: AgentState) -> Dict[str, Any]:
    """Combines all inputs into a final, polished response using the configured reasoning_llm."""
    print(f"--- Running Synthesizer Node using {LLM_CONFIG['reasoning_model_name']} ---")
    query_text = state['user_query'].parts[0].content
    
    knowledge_str = state['retrieved_knowledge'][0].content if state['retrieved_knowledge'] else "No external knowledge retrieved."
    
    synthesis_prompt = ChatPromptTemplate.from_messages([
        SystemMessage(
            "You are the final response agent. Synthesize the following components into one natural, helpful, "
            "and engaging response for a language learner. Start by directly answering the user's query."
        ),
        HumanMessage(content=f"Original Query: {query_text}\n"
                              f"Knowledge Found: {knowledge_str}\n"
                              f"Pedagogical Plan: {state['pedagogical_plan']}\n"
                              f"Cultural Context: {state['cultural_context']}")
    ])
    
    final_response = reasoning_llm.invoke(synthesis_prompt).content

    new_turn = Turn(speaker=Speaker.AGENT, text=final_response)

    print(f"Synthesized response complete: {final_response[:100]}...")
    return {
        "final_agent_response": final_response,
        "conversation_history": [new_turn]
    }


from flask import Flask, request, jsonify
from modules.context import ContextManager
# --- 4. Build and Compile the LangGraph ---

def create_mas_workflow():
    """Creates and compiles the Multi-Agent System (MAS) workflow graph."""
    workflow = StateGraph(AgentState)

    # 4.1 Add Nodes
    workflow.add_node("planner", planner_node)
    workflow.add_node("retriever", retriever_node)
    workflow.add_node("pedagogical_teacher", pedagogical_teacher_node)
    workflow.add_node("cultural_special", cultural_special_node)
    workflow.add_node("synthesizer", synthesizer_node)

    # 4.2 Set Entry Point
    workflow.set_entry_point("planner")

    # 4.3 Define Edges (Fork/Parallel Execution)
    # The planner starts the parallel execution of the three specialized agents.
    workflow.add_edge("planner", "retriever")
    workflow.add_edge("planner", "pedagogical_teacher")
    workflow.add_edge("planner", "cultural_special")

    # 4.4 Define Join Point (All paths lead to Synthesizer)
    # The graph automatically waits for all three parallel nodes to finish before proceeding to the synthesizer.
    workflow.add_edge("retriever", "synthesizer")
    workflow.add_edge("pedagogical_teacher", "synthesizer")
    workflow.add_edge("cultural_special", "synthesizer")

    # 4.5 Set Exit Point
    workflow.add_edge("synthesizer", END)

    return workflow.compile()


# --- 5. Agent Module for Flask Integration ---

class AgentModule:
    def __init__(self):
        self.workflow = create_mas_workflow()

    def register_routes(self, app: Flask):
        @app.route("/chat", methods=["POST"])
        def chat():
            """
            Handles a chat request by invoking the multi-agent system.
            """
            data = request.get_json()
            user_id = data.get("user_id")
            session_id = data.get("session_id")
            query_text = data.get("query")

            if not all([user_id, session_id, query_text]):
                return jsonify({"error": "Missing user_id, session_id, or query"}), 400

            # Initialize context for this specific request
            context_manager = ContextManager(user_id, session_id)
            
            # Assemble the initial state for the graph
            initial_state = context_manager.assemble_prompt(query_text)
            
            # The state for the graph is a dictionary, so we convert the Pydantic model
            graph_input = {
                "user_profile": initial_state.user_profile,
                "user_query": initial_state.user_query,
                "conversation_history": initial_state.conversation_history,
                # The rest of the state will be filled in by the graph
                "routing_decision": None,
                "retrieved_knowledge": [],
                "pedagogical_plan": "",
                "cultural_context": "",
                "final_agent_response": ""
            }

            # Invoke the workflow
            final_state = self.workflow.invoke(graph_input)

            return jsonify({"response": final_state.get("final_agent_response")})


app = create_mas_workflow()

