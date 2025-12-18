from flask import Blueprint, request, jsonify
from services.resource_service import ResourceService

bp = Blueprint('resources', __name__, url_prefix='/resources')

@bp.route('/', methods=['POST'])
def create_resource():
    data = request.json
    service = ResourceService()
    resource = service.create_resource(data)
    return jsonify(resource), 201

@bp.route('/upload', methods=['POST'])
def upload_resource():
    # Simple file upload implementation for MVP
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    user_id = request.form.get('userId') or request.form.get('user_id')
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    # In a real app, we'd save the file to disk/S3
    # For MVP, we'll create a resource record with metadata
    data = {
        "title": file.filename,
        "type": "document", # Default to document, can be refined by extension
        "content": f"[Physical File: {file.filename}]", 
        "userId": user_id
    }
    
    service = ResourceService()
    resource = service.create_resource(data)
    return jsonify(resource), 201

@bp.route('/', methods=['GET'])
def list_resources():
    user_id = request.args.get('userId')
    service = ResourceService()
    resources = service.list_resources(user_id=user_id)
    return jsonify(resources)

@bp.route('/<int:resource_id>', methods=['GET'])
def get_resource(resource_id):
    service = ResourceService()
    resource = service.get_resource(resource_id)
    if resource:
        return jsonify(resource)
    return jsonify({"error": "Resource not found"}), 404

@bp.route('/<int:resource_id>', methods=['DELETE'])
def delete_resource(resource_id):
    service = ResourceService()
    success = service.delete_resource(resource_id)
    if success:
        return jsonify({"status": "deleted"})
    return jsonify({"error": "Resource not found"}), 404

@bp.route('/search', methods=['GET'])
def search_resources():
    query = request.args.get('q', '')
    service = ResourceService()
    resources = service.search_resources(query)
    return jsonify(resources)

@bp.route('/<int:resource_id>/summary', methods=['GET'])
def get_resource_summary(resource_id):
    service = ResourceService()
    summary = service.get_resource_summary(resource_id)
    if summary:
        return jsonify(summary)
    return jsonify({"error": "Resource or summary not found"}), 404

