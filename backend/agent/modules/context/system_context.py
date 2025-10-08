from flask import Blueprint, jsonify
from flask import current_app as app

class SystemContext:
    def __init__(self):
        # Defines the agent's core instructions, tools, and functions.
        self.system_bp = Blueprint('system_context_bp', __name__)
        self.system_bp.add_url_rule("/agent/v1/system/instructions", view_func=self.get_instructions, methods=["GET"])

    def _get_instructions_data(self):
        """Core logic to fetch system instructions."""
        app.logger.info("Fetching system instructions and tools.")
        instructions = {
            "system_prompt": "You are a helpful and encouraging language learning assistant. Your goal is to create a personalized and effective learning plan for the user.",
            "available_tools": ["create_quiz", "find_reading_material", "explain_grammar"]
        }
        return instructions

    def get_instructions(self):
        """
        Web endpoint to provide system-level instructions for the agent.
        ---
        /agent/v1/system/instructions
        """
        instructions = self._get_instructions_data()
        return jsonify(instructions), 200

    def register_routes(self, app):
        app.register_blueprint(self.system_bp)