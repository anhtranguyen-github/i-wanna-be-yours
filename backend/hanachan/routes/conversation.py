from flask import Blueprint, request, jsonify
from services.conversation_service import ConversationService
from utils.auth import login_required

bp = Blueprint('conversations', __name__, url_prefix='/conversations')

@bp.route('/', methods=['POST'])
@login_required
def start_conversation():
    data = request.json
    user_id = request.user.get("userId") or request.user.get("id")
    title = str(data.get('title', 'Untitled'))
    
    if not user_id:
        return jsonify({"error": "userId is required"}), 400
        
    service = ConversationService()
    conversation = service.create_conversation(user_id, title)
    return jsonify(conversation), 201

@bp.route('/user/<UserId>', methods=['GET'])
@login_required
def list_user_conversations(UserId):
    curr_user_id = request.user.get("userId") or request.user.get("id")
    if str(UserId) != str(curr_user_id):
        return jsonify({"error": "Unauthorized"}), 403
    service = ConversationService()
    conversations = service.list_user_conversations(UserId)
    return jsonify(conversations)

@bp.route('/<conversation_id>/messages', methods=['POST'])
@login_required
def add_message(conversation_id):
    user_id = request.user.get("userId") or request.user.get("id")
    data = request.json
    role = str(data.get('role', 'user'))
    content = str(data.get('content', ''))
    attachment_ids = data.get('attachmentIds', [])
    
    if not role or not content:
        return jsonify({"error": "role and content are required"}), 400
        
    service = ConversationService()
    
    try:
        # Verify ownership
        conv = service.get_conversation_details(conversation_id)
        if not conv or str(conv.get("userId")) != str(user_id):
            return jsonify({"error": "Conversation not found or unauthorized"}), 404

        message = service.add_message(conversation_id, role, content, attachment_ids)
        return jsonify(message), 201
    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500

@bp.route('/<conversation_id>', methods=['GET'])
@login_required
def get_conversation(conversation_id):
    user_id = request.user.get("userId") or request.user.get("id")
    service = ConversationService()
    conversation = service.get_conversation_details(conversation_id)
    if conversation:
        if str(conversation.get("userId")) != str(user_id):
             return jsonify({"error": "Unauthorized"}), 403
        return jsonify(conversation)
    return jsonify({"error": "Conversation not found"}), 404


