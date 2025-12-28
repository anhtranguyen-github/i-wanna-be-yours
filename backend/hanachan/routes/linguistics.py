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
def convert_all():
    """Endpoint for phonetic conversion in Text Parser"""
    data = request.json
    text = data.get('text', '')
    if not text:
        return jsonify({"error": "No text provided"}), 400
    res = linguistics_service.phonetic_conversion(text)
    return jsonify(res)

@bp.route('/v1/convert/hiragana', methods=['POST'])
def convert_to_hiragana():
    data = request.json
    text = data.get('text', '')
    if not text:
        return jsonify({"error": "No text provided"}), 400
    # Reuse the phonetic converter logic which already extracts hiragana
    res = linguistics_service.phonetic_conversion(text)
    return jsonify({"hiragana": res.get("hiragana", text)})

@bp.route('/v1/extract-kanji', methods=['POST'])
def extract_kanji():
    data = request.json
    text = data.get('text', '')
    if not text:
        return jsonify({"error": "No text provided"}), 400
    # Simple regex to find all kanji characters: range [0x4e00, 0x9faf]
    import re
    kanji_list = re.findall(r'[\u4e00-\u9faf]', text)
    # Return unique kanji preserved in order
    seen = set()
    unique_kanji = [x for x in kanji_list if not (x in seen or seen.add(x))]
    return jsonify(unique_kanji)
