from flask import Blueprint, jsonify, request
from flask import current_app as app
from modules.data_models import Turn, Speaker
from typing import List
from dataclasses import asdict

class ConversationHistory:
    def __init__(self):
        # This would typically interact with a database (e.g., Redis, MongoDB)
        # to store and retrieve conversation logs.
        self.history_bp = Blueprint('conversation_history_bp', __name__)
        self.history_bp.add_url_rule("/agent/v1/history/<session_id>", view_func=self.get_history, methods=["GET"])

    def _get_history_data(self, session_id: str) -> List[Turn]:
        """Core logic to fetch conversation history data."""
        app.logger.info(f"Fetching history for session: {session_id}")
        # Placeholder: Fetch conversation data from a database
        turns = [
            Turn(speaker=Speaker.USER, text="Hello!"),
            Turn(speaker=Speaker.AGENT, text="Hi there! How can I help you learn today?")
        ]
        return turns

    def get_history(self, session_id):
        """
        Web endpoint to retrieve the conversation history for a given session.
        ---
        /agent/v1/history/session456
        """
        turns = self._get_history_data(session_id)
        return jsonify([asdict(turn) for turn in turns]), 200

    def register_routes(self, app):
        app.register_blueprint(self.history_bp)