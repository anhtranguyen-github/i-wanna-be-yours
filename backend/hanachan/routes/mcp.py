from flask import Blueprint, jsonify
from services.mcp_service import McpService

bp = Blueprint('mcp', __name__, url_prefix='/mcp')

@bp.route('/status', methods=['GET'])
def get_status():
    status = McpService.get_status()
    return jsonify(status)

@bp.route('/resources/<resource_id>/ingest', methods=['POST'])
def ingest_resource(resource_id):
    from services.resource_processor import ResourceProcessor
    processor = ResourceProcessor()
    job_id = processor.trigger_ingestion(resource_id)
    if job_id:
        return jsonify({"message": "Ingestion enqueued", "job_id": job_id}), 202
    return jsonify({"error": "Failed to enqueue ingestion"}), 500
