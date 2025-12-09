from flask import Blueprint, request, jsonify
from services.task_service import TaskService

bp = Blueprint('tasks', __name__, url_prefix='/tasks')

@bp.route('/<task_id>/confirm', methods=['POST'])
def confirm_task(task_id):
    service = TaskService()
    result = service.confirm_task(task_id)
    if result:
        return jsonify(result)
    return jsonify({"error": "Task not found"}), 404

@bp.route('/<task_id>', methods=['GET'])
def get_task(task_id):
    service = TaskService()
    task = service.get_task(task_id_ext=task_id)
    if task:
        return jsonify(task.to_dict())
    return jsonify({"error": "Task not found"}), 404
