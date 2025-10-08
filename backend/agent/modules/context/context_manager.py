from flask import Blueprint, jsonify, request
from flask import current_app as app
from modules.data_models import Prompt, UserProfile, LearningGoal, Turn
from dataclasses import asdict

class ContextManager:
    def __init__(self, user_profile, conversation_history, learning_goals, system_context):
        """
        Initializes the main agent context orchestrator (ContextManager).
        """
        self.manager_bp = Blueprint('context_manager_bp', __name__)
        self.manager_bp.add_url_rule("/agent/v1/build_prompt", view_func=self.build_prompt, methods=["POST"])

       
        # and was causing an error. It can be added back when implemented.
        # Store references to other modules
        self.user_profile = user_profile
        self.conversation_history = conversation_history
        self.learning_goals = learning_goals
        self.system_context = system_context

    def build_prompt_data(self, user_id: str, session_id: str, query: str):
        """
        Gathers context from all modules and returns a structured Prompt object.
        This is the core logic, decoupled from Flask.
        """
        app.logger.info(f"Building prompt for user: {user_id}")

        # Gather data from each component's core logic method
        prompt_data = Prompt(
            system_prompt=self.system_context._get_instructions_data(),
            user_profile=self.user_profile._get_profile_data(user_id),
            conversation_history=self.conversation_history._get_history_data(session_id),
            learning_goals=self.learning_goals._get_goals_data(user_id),
            retrieved_knowledge=[], # Placeholder for knowledge_base.search()
            current_query=query
        )
        return prompt_data

    def build_prompt(self):
        """
        The web endpoint that handles the POST request, calls the core logic,
        and returns a JSON response.
        ---
        POST /agent/v1/build_prompt
        Body: { "user_id": "user123", "session_id": "session456", "query": "How do I use 'wa' vs 'ga'?" }
        """
        data = request.get_json()
        if not data or "user_id" not in data or "session_id" not in data:
            return jsonify({"error": "Missing user_id or session_id"}), 400

        prompt_data = self.build_prompt_data(data["user_id"], data["session_id"], data.get("query", ""))

        return jsonify(asdict(prompt_data)), 200

    def register_routes(self, app):
        app.register_blueprint(self.manager_bp)