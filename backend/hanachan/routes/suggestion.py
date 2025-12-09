from flask import Blueprint, request, jsonify
from models.action import Suggestion

bp = Blueprint('suggestions', __name__, url_prefix='/suggestions')

@bp.route('/<suggestion_id>/use', methods=['POST'])
def use_suggestion(suggestion_id):
    # Functional endpoint to "use" a suggestion.
    # In a real app, this might trigger a new conversation message or agent turn.
    # For now, we retrieve it to confirm it exists and return it so the frontend can populate the input.
    suggestion = Suggestion.query.filter_by(suggestion_external_id=suggestion_id).first()
    if suggestion:
        return jsonify({
            "suggestionId": suggestion.suggestion_external_id,
            "prompt": suggestion.prompt,
            "action": "populated_input"
        })
    return jsonify({"error": "Suggestion not found"}), 404
