from flask import Blueprint, request, jsonify
from services.agent_service import AgentService
from schemas.chat import AgentRequest

bp = Blueprint('agent', __name__, url_prefix='/agent')

@bp.route('/invoke', methods=['POST'])
def invoke():
    data = request.json
    try:
        # Validate Input with Pydantic
        agent_req = AgentRequest(**data)
        
        service = AgentService()
        response = service.invoke_agent(agent_req)
        
        # Serialize Output with Pydantic
        return jsonify(response.dict()), 200
    except Exception as e:
        print(f"DEBUG: Request Data: {data}")
        print(f"DEBUG: Error: {e}")
        return jsonify({"error": str(e)}), 400
