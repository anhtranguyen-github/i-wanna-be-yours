from flask import Blueprint, request, jsonify
from memory.manager import get_memory_manager
import logging

bp = Blueprint('memory', __name__, url_prefix='/memory')
logger = logging.getLogger(__name__)

@bp.route('/semantic', methods=['GET'])
def get_semantic_graph():
    user_id = request.args.get('userId')
    if not user_id:
        return jsonify({"error": "userId is required"}), 400

    manager = get_memory_manager()
    if not manager.semantic:
         return jsonify({"nodes": [], "links": []}) # Service not active
    
    graph_data = manager.semantic.get_user_graph(user_id)
    return jsonify(graph_data)

@bp.route('/episodic', methods=['GET'])
def get_episodic_timeline():
    user_id = request.args.get('userId')
    limit = int(request.args.get('limit', 20))
    
    if not user_id:
        return jsonify({"error": "userId is required"}), 400

    manager = get_memory_manager()
    if not manager.episodic:
        return jsonify([])
        
    memories = manager.episodic.get_recent_memories(user_id, limit=limit)
    return jsonify(memories)
