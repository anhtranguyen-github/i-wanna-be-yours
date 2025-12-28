from flask import Blueprint, request, jsonify, current_app

bp = Blueprint('agent', __name__, url_prefix='/agent')

@bp.route('/invoke', methods=['POST'])
@validate_resource_access
def invoke():
    if hasattr(current_app, 'limiter'):
        @current_app.limiter.limit("10 per minute")
        def limited_invoke():
            pass # Placeholder for limit trigger
    data = request.json
    try:
        agent_req = AgentRequest(**data)
        service = AgentService()
        response = service.invoke_agent(agent_req)
        return jsonify(response.dict()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@bp.route('/stream', methods=['POST'])
@validate_resource_access
def stream():
    from flask import Response, stream_with_context
    data = request.json
    try:
        agent_req = AgentRequest(**data)
        service = AgentService()
        
        def generate():
            for chunk in service.stream_agent(agent_req):
                yield chunk

        return Response(stream_with_context(generate()), mimetype='text/event-stream')
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400
