from flask import Blueprint, request, jsonify
from services.agent_service import AgentService
from schemas.chat import AgentRequest
from utils.middleware import validate_resource_access

bp = Blueprint('agent', __name__, url_prefix='/agent')

@bp.route('/invoke', methods=['POST'])
@validate_resource_access
def invoke():
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
        
        # This would require refactoring AgentService to split logic.
        # For a quick "Alpha" implementation, we'll use the OllamaAgent directly
        # and ignore persistence/artifacts for the live stream (they'll be saved on complete)
        from agent.ollama_agent import OllamaAgent
        agent = OllamaAgent()
        
        def generate():
            # 1. Send metadata/artifacts first if possible (simplified for now: just text)
            for chunk in agent.invoke(
                prompt=agent_req.prompt,
                user_id=agent_req.user_id,
                resource_ids=agent_req.context_config.resource_ids if agent_req.context_config else [],
                stream=True
            ):
                yield chunk

        return Response(stream_with_context(generate()), mimetype='text/event-stream')
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400
