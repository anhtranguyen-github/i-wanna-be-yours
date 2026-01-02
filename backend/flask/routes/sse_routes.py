from flask import Blueprint, Response, stream_with_context, request
import redis
import os
import json

sse_bp = Blueprint('sse', __name__)
REDIS_HOST = os.getenv("REDIS_HOST", "redis")
# Reuse the redis connection pool if possible, but for SSE we need a dedicated pubsub connection per client usually, or carefully managed
# Simple implementation:
redis_client = redis.Redis(host=REDIS_HOST, port=6379, db=0)

@sse_bp.route('/stream')
def stream_events():
    # In a real app, you MUST authenticate here (e.g., check cookie or header)
    # user_id = request.user.id
    # For prototype, we'll assume a query param or default
    user_id = request.args.get("user_id", "default_user")
    
    def event_stream():
        pubsub = redis_client.pubsub()
        channel = f"notifications:{user_id}"
        pubsub.subscribe(channel)
        
        # Send heartbeat/connection confirmation
        yield "event: connected\ndata: true\n\n"
        
        try:
            for message in pubsub.listen():
                if message['type'] == 'message':
                    data = message['data'].decode('utf-8')
                    yield f"data: {data}\n\n"
        except GeneratorExit:
            pubsub.unsubscribe()
            pubsub.close()
            print(f"Client disconnected from SSE channel {channel}")

    return Response(stream_with_context(event_stream()), mimetype="text/event-stream")
