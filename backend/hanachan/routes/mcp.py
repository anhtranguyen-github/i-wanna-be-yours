from flask import Blueprint, jsonify
from services.mcp_service import McpService

bp = Blueprint('mcp', __name__, url_prefix='/mcp')

@bp.route('/status', methods=['GET'])
def get_status():
    status = McpService.get_status()
    return jsonify(status)
