from flask import Blueprint, request, jsonify
from services.resource_service import ResourceService

bp = Blueprint('resources', __name__, url_prefix='/resources')

@bp.route('/', methods=['POST'])
def create_resource():
    data = request.json
    service = ResourceService()
    resource = service.create_resource(data)
    return jsonify(resource), 201

@bp.route('/', methods=['GET'])
def list_resources():
    service = ResourceService()
    resources = service.list_resources()
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
