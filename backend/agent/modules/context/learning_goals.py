from flask import Blueprint, jsonify, request
from flask import current_app as app
from modules.data_models import LearningGoal, GoalStatus
from datetime import date
from dataclasses import asdict

class LearningGoals:
    def __init__(self):
        # Manages the state of the user's current learning goals.
        self.goals_bp = Blueprint('learning_goals_bp', __name__)
        self.goals_bp.add_url_rule("/agent/v1/goals/<user_id>", view_func=self.get_goals, methods=["GET"])

    def _get_goals_data(self, user_id: str) -> LearningGoal:
        """Core logic to fetch learning goals data."""
        app.logger.info(f"Fetching learning goals for user: {user_id}")
        # Placeholder: Fetch goal state from a database
        goal = LearningGoal(
            goal_id="goal789",
            topic="JLPT N4 Vocabulary",
            status=GoalStatus.ACTIVE,
            proficiency_target="N4",
            start_date=date(2023, 10, 1)
        )
        return goal

    def get_goals(self, user_id):
        """
        Web endpoint to retrieve the current learning goals for a user.
        """
        goal = self._get_goals_data(user_id)
        return jsonify(asdict(goal)), 200

    def register_routes(self, app):
        app.register_blueprint(self.goals_bp)