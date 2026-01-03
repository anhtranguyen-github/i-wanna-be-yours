"""
Debug Routes - Exposes internal agent state for Sovereign HUD.
Protected by admin/dev flag.
"""
from flask import Blueprint, jsonify, request, g
from functools import wraps
import os

bp = Blueprint('debug', __name__, url_prefix='/v1/debug')


def require_admin_or_dev(f):
    """
    Decorator to require admin role or DEV_MODE environment variable.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Check if DEV_MODE is enabled
        if os.environ.get("DEV_MODE", "false").lower() == "true":
            return f(*args, **kwargs)
        
        # Check for admin role (placeholder for actual auth logic)
        user = getattr(g, 'current_user', None)
        if user and user.get('role') == 'admin':
            return f(*args, **kwargs)
        
        return jsonify({"error": "Unauthorized. Admin access required."}), 403
    return decorated_function


@bp.route('/traces', methods=['GET'])
@require_admin_or_dev
def get_traces():
    """
    Returns recent internal thought traces for the authenticated user.
    Query params: user_id, limit
    """
    from services.debug_service import DebugService
    
    user_id = request.args.get('user_id')
    limit = int(request.args.get('limit', 20))
    
    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400
    
    traces = DebugService.get_recent_traces(user_id, limit=limit)
    return jsonify({"traces": traces})


@bp.route('/memory/semantic', methods=['GET'])
@require_admin_or_dev
def get_semantic_graph():
    """
    Returns the user's knowledge graph from Neo4j.
    Query params: user_id
    """
    from services.debug_service import DebugService
    
    user_id = request.args.get('user_id')
    
    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400
    
    graph = DebugService.get_semantic_graph(user_id)
    return jsonify(graph)


@bp.route('/memory/artifacts', methods=['GET'])
@require_admin_or_dev
def get_artifact_audit():
    """
    Returns the user's artifacts from MongoDB with Ghost ID status.
    Query params: user_id, limit
    """
    from services.debug_service import DebugService
    
    user_id = request.args.get('user_id')
    limit = int(request.args.get('limit', 50))
    
    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400
    
    audit = DebugService.get_artifact_audit(user_id, limit=limit)
    return jsonify(audit)


@bp.route('/memory/episodic', methods=['GET'])
@require_admin_or_dev
def get_episodic_memory():
    """
    Performs a vector search on episodic memory.
    Query params: user_id, query, limit
    """
    from services.debug_service import DebugService
    
    user_id = request.args.get('user_id')
    query = request.args.get('query', 'recent')
    limit = int(request.args.get('limit', 10))
    
    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400
    
    memories = DebugService.get_episodic_memory(user_id, query=query, limit=limit)
    return jsonify({"memories": memories})
