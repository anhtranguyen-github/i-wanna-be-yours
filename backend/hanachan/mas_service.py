import asyncio
import logging
from typing import TypedDict, List, Dict, Any, AsyncGenerator
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, BaseMessage
from chat import chat_service, ConfigLoader

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Setup Agent Logger
agent_logger = logging.getLogger("agent_logger")
agent_logger.setLevel(logging.INFO)
file_handler = logging.FileHandler("agents.log")
formatter = logging.Formatter('%(asctime)s - %(message)s')
file_handler.setFormatter(formatter)
agent_logger.addHandler(file_handler)

def log_agent_action(session_id: str, agent_name: str, prompt: str, response: str, tools: List[str] = None):
    """Helper to log agent actions in a structured way."""
    log_entry = f"Session: {session_id} | Agent: {agent_name} | Tools: {tools or []}\n"
    log_entry += f"Prompt: {prompt[:200]}...\n" # Truncate prompt for readability
    log_entry += f"Response: {response}\n"
    log_entry += "-" * 50
    agent_logger.info(log_entry)

# Define the State
class AgentState(TypedDict):
    messages: List[BaseMessage]
    user_input: str
    actor_response: str
    corrections: List[str]
    next_step: str
    conversation_id: str # Added for logging

# --- Nodes ---

async def scenario_actor_node(state: AgentState):
    """
    The Scenario Actor engages in conversation with the user.
    """
    logger.info("--- Scenario Actor ---")
    user_input = state["user_input"]
    messages = state["messages"]
    conversation_id = state.get("conversation_id", "unknown")
    
    # Get Agent
    llm_with_tools, _, system_prompt = await chat_service.agent_factory.create_agent("scenario_actor")
    
    # Construct prompt
    prompt_messages = [SystemMessage(content=system_prompt)] + messages + [HumanMessage(content=user_input)]
    
    response = await llm_with_tools.ainvoke(prompt_messages)
    
    log_agent_action(conversation_id, "Scenario Actor", str(prompt_messages), response.content)
    
    return {"actor_response": response.content}

async def sensei_node(state: AgentState):
    """
    Sensei analyzes the user's input and decides on corrections.
    """
    logger.info("--- Sensei Analysis ---")
    user_input = state["user_input"]
    conversation_id = state.get("conversation_id", "unknown")
    
    # Get Agent
    llm_with_tools, _, system_prompt = await chat_service.agent_factory.create_agent("sensei")
    
    analysis_prompt = f"""
    Analyze the following user input for Japanese mistakes:
    "{user_input}"
    
    If there are mistakes, reply with "MISTAKE: [Reason]".
    If it is natural and correct, reply with "OK".
    """
    
    messages = [SystemMessage(content=system_prompt), HumanMessage(content=analysis_prompt)]
    response = await llm_with_tools.ainvoke(messages)
    content = response.content
    
    log_agent_action(conversation_id, "Sensei", str(messages), content)
    
    if "MISTAKE" in content:
        logger.info(f"Sensei detected mistake: {content}")
        return {"next_step": "correct", "corrections": [content]} 
    else:
        logger.info("Sensei approved.")
        return {"next_step": "ok", "corrections": []}

async def grammar_police_node(state: AgentState):
    logger.info("--- Grammar Police ---")
    user_input = state["user_input"]
    conversation_id = state.get("conversation_id", "unknown")
    
    llm, _, prompt = await chat_service.agent_factory.create_agent("grammar_police")
    
    messages = [SystemMessage(content=prompt), HumanMessage(content=user_input)]
    response = await llm.ainvoke(messages)
    
    log_agent_action(conversation_id, "Grammar Police", str(messages), response.content)
    
    return {"corrections": [f"Grammar Police: {response.content}"]}

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

def create_mas_graph():
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

    return workflow.compile()

class MasService:
    def __init__(self):
        self.app = create_mas_graph()

    async def stream_answer(self, user_input: str, conversation_id: str = None, user_id: str = None, show_thinking: bool = False) -> AsyncGenerator[str, None]:
        # Fetch history using ChatService's method
        history_messages = chat_service.get_conversation_history(conversation_id) if conversation_id else []
        
        state = {
            "messages": history_messages,
            "user_input": user_input,
            "actor_response": "",
            "corrections": [],
            "next_step": "",
            "conversation_id": conversation_id or "unknown"
        }
        
        async for output in self.app.astream(state):
            for key, value in output.items():
                # We can yield progress updates
                if show_thinking:
                    yield f"<thinking>Finished step: {key}</thinking>\n"
                
                # If we have the final output from aggregator, we can yield it
                if key == "aggregator":
                    # The aggregator updates 'messages' with the final AIMessage
                    new_msgs = value.get("messages", [])
                    if new_msgs:
                        last_msg = new_msgs[-1]
                        yield last_msg.content
                        
                        # Save to DB
                        if conversation_id:
                            chat_service.save_message(conversation_id, user_id, "USER", user_input)
                            chat_service.save_message(conversation_id, user_id, "AGENT", last_msg.content)

mas_service = MasService()

def register_routes(app):
    from flask import request, Response, stream_with_context, jsonify
    import asyncio
    
    @app.route('/chat/stream', methods=['POST'])
    def mas_stream():
        data = request.get_json() or {}
        query = data.get('query') or data.get('text') or ''
        show_thinking = bool(data.get('thinking') or (request.args.get('thinking') in ['1','true','yes']))
        conversation_id = data.get('conversation_id')
        user_id = data.get('user_id')
        
        if not query:
            return jsonify({'error': "Missing 'query'"}), 400

        def generate():
            try:
                loop = asyncio.get_event_loop()
                if loop.is_closed():
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)

            agen = mas_service.stream_answer(query, conversation_id, user_id, show_thinking)
            
            while True:
                try:
                    chunk = loop.run_until_complete(agen.__anext__())
                    yield chunk
                except StopAsyncIteration:
                    break
                except Exception as e:
                    logger.error(f"Error in MAS stream: {e}")
                    yield f"Error: {str(e)}"
                    break

        return Response(stream_with_context(generate()), mimetype='text/plain')

    @app.route('/chat/history', methods=['GET'])
    def get_history():
        # Reuse chat_service for history as it shares the DB
        conversation_id = request.args.get('conversation_id')
        if not conversation_id:
            return jsonify({'error': "Missing 'conversation_id'"}), 400
            
        history = chat_service.get_history_json(conversation_id)
        return jsonify({'history': history})

