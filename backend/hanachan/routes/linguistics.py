from flask import Blueprint, request, jsonify
from services.linguistics_service import LinguisticsService

bp = Blueprint('linguistics', __name__)
linguistics_service = LinguisticsService()

@bp.route('/v1/parse-tree', methods=['POST'])
def get_parse_tree():
    """Endpoint for Grammar Graph"""
    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({"error": "No text provided"}), 400
    
    result = linguistics_service.parse_tree(data['text'])
    return jsonify(result), 200

@bp.route('/v1/translate', methods=['POST'])
def get_translation():
    """Endpoint for Text Translate"""
    data = request.get_json()
    # Handle variations in client side prompt key
    user_prompt = data.get('userPrompt') or data.get('text')
    
    if not user_prompt:
        return jsonify({"error": "No text provided"}), 400
    
    translation = linguistics_service.translate(user_prompt)
    
    # Return in ChatGPT compatible format for UnifiedGptComponent
    return jsonify({
        "choices": [{
            "message": {
                "content": translation
            }
        }],
        "model": "qwen3:1.7b-neural-lab",
        "usage": {
            "total_tokens": 0, # Placeholder
            "prompt_tokens": 0,
            "completion_tokens": 0
        }
    }), 200

@bp.route('/v1/convert/all', methods=['POST'])
def get_phonetic_metadata():
    """Endpoint for phonetic conversion in Text Parser"""
    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({"error": "No text provided"}), 400
    
    result = linguistics_service.phonetic_conversion(data['text'])
    return jsonify(result), 200
