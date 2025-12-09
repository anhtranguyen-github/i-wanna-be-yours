from flask import Blueprint, request, jsonify
from services.conversation_service import ConversationService

bp = Blueprint('conversations', __name__, url_prefix='/conversations')

@bp.route('/', methods=['POST'])
def start_conversation():
    data = request.json
    user_id = data.get('userId')
    title = data.get('title')
    
    if not user_id:
        return jsonify({"error": "userId is required"}), 400
        
    service = ConversationService()
    conversation = service.create_conversation(user_id, title)
    return jsonify(conversation), 201

@bp.route('/<int:conversation_id>/messages', methods=['POST'])
def add_message(conversation_id):
    data = request.json
    role = data.get('role')
    content = data.get('content')
    attachment_ids = data.get('attachmentIds', [])
    
    if not role or not content:
        return jsonify({"error": "role and content are required"}), 400
        
    service = ConversationService()
    # Ideally check if conversation exists first, but keeping it simple
    try:
        message = service.add_message(conversation_id, role, content, attachment_ids)
        return jsonify(message), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/<int:conversation_id>', methods=['GET'])
def get_conversation(conversation_id):
    service = ConversationService()
    conversation = service.get_conversation_details(conversation_id)
    if conversation:
        return jsonify(conversation)
    return jsonify({"error": "Conversation not found"}), 404

@bp.route('/user/<UserId>', methods=['GET'])
def list_user_conversations(UserId):
    service = ConversationService()
    conversations = service.list_user_conversations(UserId)
    return jsonify(conversations)
