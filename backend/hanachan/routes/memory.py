from flask import Blueprint, request, jsonify
from services.memory import MemoryService
import logging

bp = Blueprint('memory', __name__, url_prefix='/memory')
logger = logging.getLogger(__name__)

def get_memory_service():
    return MemoryService()

@bp.route('/semantic', methods=['GET'])
def get_semantic_graph():
    user_id = request.args.get('userId')
    if not user_id:
        return jsonify({"error": "userId is required"}), 400

    try:
        from hanachan.memory.semantic import SemanticMemory
        semantic_mem = SemanticMemory()
        graph_data = semantic_mem.get_user_graph(user_id)
        return jsonify(graph_data)
    except Exception as e:
        logger.error(f"Error fetching semantic graph: {e}")
        return jsonify({"nodes": [], "links": []})

@bp.route('/episodic', methods=['GET'])
def get_episodic_timeline():
    user_id = request.args.get('userId')
    limit = int(request.args.get('limit', 20))
    
    if not user_id:
        return jsonify({"error": "userId is required"}), 400

    memories = get_memory_service().retrieve_episodic_memory(user_id, query="recent", n_results=limit)
    
    # Format for UI
    formatted = []
    for i, mem in enumerate(memories):
        meta = mem.get('metadata', {})
        formatted.append({
            "id": mem.get('id', f"mem_{i}"),
            "content": mem['content'],
            "source": meta.get('source', 'AI Core'),
            "type": meta.get('type', 'episodic'),
            "timestamp": meta.get('timestamp') 
        })
        
    return jsonify(formatted)

@bp.route('/stats', methods=['GET'])
def get_memory_stats():
    user_id = request.args.get('userId')
    if not user_id:
        return jsonify({"error": "userId is required"}), 400
    
    try:
        # Get Episodic Count from Qdrant
        episodic_stats = get_memory_service().get_memory_stats(user_id)
        episodic_count = episodic_stats.get("episodic_count", 0)
        
        # Get Semantic Count from Neo4j
        from hanachan.memory.semantic import SemanticMemory
        semantic_mem = SemanticMemory()
        semantic_count = semantic_mem.get_node_count(user_id)
        
        return jsonify({
            "episodic_count": episodic_count,
            "semantic_count": semantic_count
        })
    except Exception as e:
        logger.error(f"Error fetching memory stats: {e}")
        return jsonify({"episodic_count": 0, "semantic_count": 0})
