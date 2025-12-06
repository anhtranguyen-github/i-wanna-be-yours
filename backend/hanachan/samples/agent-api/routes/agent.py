from backend.agent.graph import get_agent_graph
from flask import Blueprint, request, Response, jsonify, stream_with_context
from backend.database import get_db
from backend.models import Thread
from backend.agent.mcp import get_mcp_tools
from langchain_core.messages import HumanMessage
import json
import uuid
import asyncio
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from psycopg_pool import AsyncConnectionPool
import os


agent_bp = Blueprint('agent', __name__)

# Setup Postgres connection pool
DB_URI = os.getenv("DATABASE_URL")
connection_kwargs = {
    "autocommit": True,
    "prepare_threshold": 0,
}



# Helper to create a fresh connection pool and checkpointer
async def create_checkpointer():
    # Setup Postgres connection pool
    DB_URI = os.getenv("DATABASE_URL")
    connection_kwargs = {
        "autocommit": True,
        "prepare_threshold": 0,
    }

    pool = AsyncConnectionPool(
        conninfo=DB_URI,
        max_size=20,
        kwargs=connection_kwargs,
        open=False,
    )
    await pool.open()

    # Initialize PostgresSaver
    checkpointer = AsyncPostgresSaver(pool)
    
    # Ensure tables are created
    await checkpointer.setup()
    
    return checkpointer, pool

@agent_bp.route('/threads', methods=['GET'])
def list_threads():
    db = next(get_db())
    threads = db.query(Thread).order_by(Thread.updatedAt.desc()).all()
    return jsonify([{
        "id": t.id,
        "title": t.title,
        "createdAt": t.createdAt.isoformat(),
        "updatedAt": t.updatedAt.isoformat()
    } for t in threads])

@agent_bp.route('/threads', methods=['POST'])
def create_thread():
    db = next(get_db())
    data = request.json or {}
    title = data.get("title", "New Chat")
    
    new_thread = Thread(title=title)
    db.add(new_thread)
    db.commit()
    
    return jsonify({
        "id": new_thread.id,
        "title": new_thread.title,
        "createdAt": new_thread.createdAt.isoformat(),
        "updatedAt": new_thread.updatedAt.isoformat()
    })

@agent_bp.route('/stream', methods=['GET'])
def stream_agent():
    user_content = request.args.get("content", "")
    thread_id = request.args.get("threadId", "unknown")
    model_name = request.args.get("model", "gpt-4o")
    
    def generate():
        async def async_gen():
            yield ": connected\n\n"
            
            pool = None
            try:
                # Fetch tools dynamically
                tools = await get_mcp_tools()
                
                # Create fresh checkpointer and pool
                checkpointer, pool = await create_checkpointer()
                
                # Build graph with current tools
                graph = get_agent_graph(tools=tools, checkpointer=checkpointer, model_name=model_name)
                
                config = {"configurable": {"thread_id": thread_id}}

                async for event in graph.astream_events(
                    {"messages": [HumanMessage(content=user_content)]},
                    config,
                    version="v2"
                ):
                    kind = event["event"]
                    
                    if kind == "on_chat_model_stream":
                        content = event["data"]["chunk"].content
                        if content:
                            yield f"data: {json.dumps({'type': 'ai', 'content': content})}\n\n"
                    
                    # Handle tool calls, etc. if needed
                    # This is a simplified stream mirroring the Next.js one
                    
                yield "event: done\n"
                yield "data: {}\n\n"
                
            except Exception as e:
                yield "event: error\n"
                yield f"data: {json.dumps({'message': str(e)})}\n\n"
            finally:
                if pool:
                    await pool.close()

        # Run the async generator synchronously
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            # Call the async generator function to get the generator object
            gen_instance = async_gen()
            async_iter = gen_instance.__aiter__()
            while True:
                try:
                    chunk = loop.run_until_complete(async_iter.__anext__())
                    yield chunk
                except StopAsyncIteration:
                    break
        except Exception as e:
            yield "event: error\n"
            yield f"data: {json.dumps({'message': f'Stream error: {str(e)}'})}\n\n"
        finally:
            loop.close()

    return Response(stream_with_context(generate()), mimetype='text/event-stream')

@agent_bp.route('/history/<thread_id>', methods=['GET'])
async def get_history(thread_id):
    pool = None
    try:
        # Create fresh checkpointer and pool
        checkpointer, pool = await create_checkpointer()
        
        # We need to build the graph to access state, even if tools don't matter for history
        graph = get_agent_graph(tools=[], checkpointer=checkpointer)
        config = {"configurable": {"thread_id": thread_id}}
        state = await graph.aget_state(config)
        
        messages = []
        if state and state.values and "messages" in state.values:
            for msg in state.values["messages"]:
                msg_type = "user" if isinstance(msg, HumanMessage) else "ai"
                messages.append({
                    "role": msg_type,
                    "content": msg.content,
                    "id": msg.id
                })
                
        return jsonify(messages)
    finally:
        if pool:
            await pool.close()
