import asyncio
import logging
from typing import TypedDict, Annotated, List, Dict, Any
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, BaseMessage
from chat import chat_service, ConfigLoader

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define the State
class AgentState(TypedDict):
    messages: List[BaseMessage]
    user_input: str
    actor_response: str
    corrections: List[str]
    next_step: str

# --- Nodes ---

async def scenario_actor_node(state: AgentState):
    """
    The Scenario Actor engages in conversation with the user.
    """
    logger.info("--- Scenario Actor ---")
    user_input = state["user_input"]
    messages = state["messages"]
    
    # Get Agent
    llm_with_tools, _, system_prompt = await chat_service.agent_factory.create_agent("scenario_actor")
    
    # Construct prompt
    # We include history + current user input
    # Note: In a real app, we'd manage history more carefully.
    prompt_messages = [SystemMessage(content=system_prompt)] + messages + [HumanMessage(content=user_input)]
    
    response = await llm_with_tools.ainvoke(prompt_messages)
    
    return {"actor_response": response.content}

async def sensei_node(state: AgentState):
    """
    Sensei analyzes the user's input and decides on corrections.
    """
    logger.info("--- Sensei Analysis ---")
    user_input = state["user_input"]
    
    # Get Agent
    llm_with_tools, _, system_prompt = await chat_service.agent_factory.create_agent("sensei")
    
    # Sensei needs to decide if there's a mistake.
    # We can ask Sensei to output JSON or a specific format, or just text.
    # For now, let's ask for a thought process and a decision.
    
    analysis_prompt = f"""
    Analyze the following user input for Japanese mistakes:
    "{user_input}"
    
    If there are mistakes, reply with "MISTAKE: [Reason]".
    If it is natural and correct, reply with "OK".
    """
    
    messages = [SystemMessage(content=system_prompt), HumanMessage(content=analysis_prompt)]
    response = await llm_with_tools.ainvoke(messages)
    content = response.content
    
    if "MISTAKE" in content:
        logger.info(f"Sensei detected mistake: {content}")
        return {"next_step": "correct", "corrections": [content]} # Store initial analysis
    else:
        logger.info("Sensei approved.")
        return {"next_step": "ok", "corrections": []}

async def grammar_police_node(state: AgentState):
    logger.info("--- Grammar Police ---")
    user_input = state["user_input"]
    llm, _, prompt = await chat_service.agent_factory.create_agent("grammar_police")
    
    messages = [SystemMessage(content=prompt), HumanMessage(content=user_input)]
    response = await llm.ainvoke(messages)
    
    return {"corrections": [f"Grammar Police: {response.content}"]}

async def pitch_coach_node(state: AgentState):
    logger.info("--- Pitch Coach ---")
    user_input = state["user_input"]
    llm, _, prompt = await chat_service.agent_factory.create_agent("pitch_coach")
    
    messages = [SystemMessage(content=prompt), HumanMessage(content=user_input)]
    response = await llm.ainvoke(messages)
    
    return {"corrections": [f"Pitch Coach: {response.content}"]}

async def aggregator_node(state: AgentState):
    """
    Combines the actor's response and any corrections.
    """
    logger.info("--- Aggregator ---")
    actor_response = state["actor_response"]
    corrections = state.get("corrections", [])
    
    final_output = f"{actor_response}"
    
    if corrections:
        final_output += "\n\n--- Sensei's Feedback ---\n"
        for c in corrections:
            final_output += f"- {c}\n"
            
    # Update history
    new_messages = state["messages"] + [
        HumanMessage(content=state["user_input"]),
        AIMessage(content=final_output)
    ]
    
    return {"messages": new_messages}

# --- Graph Construction ---

workflow = StateGraph(AgentState)

workflow.add_node("actor", scenario_actor_node)
workflow.add_node("sensei", sensei_node)
workflow.add_node("grammar", grammar_police_node)
# workflow.add_node("pitch", pitch_coach_node) # Optional: Can add logic to choose which specialist
workflow.add_node("aggregator", aggregator_node)

# Parallel execution of Actor and Sensei
workflow.set_entry_point("sensei") 

# Conditional Edge from Sensei
def sensei_router(state: AgentState):
    if state["next_step"] == "correct":
        return "grammar" # For simplicity, always call grammar if mistake. 
        # In a real system, Sensei would output WHICH specialist to call.
    else:
        return "actor"

workflow.add_conditional_edges(
    "sensei",
    sensei_router,
    {
        "grammar": "grammar",
        "actor": "actor"
    }
)

# If Grammar runs, we still need the Actor's response?
# Actually, if we run them in parallel, we need to join them.
# LangGraph supports parallel branches.

# Revised Flow:
# Start -> Parallel(Actor, Sensei)
# Sensei -> (If Mistake) -> Grammar -> Join
# Actor -> Join
# Join -> Aggregator

# Let's try a simpler sequential flow for now to ensure stability:
# Start -> Actor (Get response) -> Sensei (Check user input) -> (If Mistake) -> Grammar -> Aggregator
# If No Mistake -> Aggregator (Just Actor response)

workflow = StateGraph(AgentState)
workflow.add_node("actor", scenario_actor_node)
workflow.add_node("sensei", sensei_node)
workflow.add_node("grammar", grammar_police_node)
workflow.add_node("aggregator", aggregator_node)

workflow.set_entry_point("actor")
workflow.add_edge("actor", "sensei")

def sensei_router_seq(state: AgentState):
    if state["next_step"] == "correct":
        return "grammar"
    else:
        return "aggregator"

workflow.add_conditional_edges(
    "sensei",
    sensei_router_seq,
    {
        "grammar": "grammar",
        "aggregator": "aggregator"
    }
)

workflow.add_edge("grammar", "aggregator")
workflow.add_edge("aggregator", END)

app = workflow.compile()

# --- Main Execution ---

async def main():
    print("=== Hanachan Multi-Agent System (LangGraph) ===")
    
    # Initial state
    state = {
        "messages": [],
        "user_input": "",
        "actor_response": "",
        "corrections": [],
        "next_step": ""
    }
    
    while True:
        user_input = input("\nYou: ").strip()
        if user_input.lower() in ["quit", "exit"]:
            break
            
        state["user_input"] = user_input
        
        # Run the graph
        async for output in app.astream(state):
            for key, value in output.items():
                print(f"Finished: {key}")
                # Update local state with the output delta
                # Note: astream returns the update from the node
                if isinstance(value, dict):
                    state.update(value)
        
        # Print final result from the last message
        if state["messages"]:
            last_msg = state["messages"][-1]
            print(f"\n🤖 {last_msg.content}")

if __name__ == "__main__":
    asyncio.run(main())
