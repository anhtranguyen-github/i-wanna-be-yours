from flask import Blueprint, jsonify, request
from flask import current_app as app
from modules.data_models import UserProfile as UserProfileModel
from dataclasses import asdict

class UserProfile:
    def __init__(self):
        # In a real application, this would connect to a database
        # to fetch and store user profile information.
        self.profile_bp = Blueprint('user_profile_bp', __name__)
        self.profile_bp.add_url_rule("/agent/v1/profile/<user_id>", view_func=self.get_profile, methods=["GET"])

    def _get_profile_data(self, user_id: str) -> UserProfileModel:
        """Core logic to fetch user profile data."""
        app.logger.info(f"Fetching profile for user: {user_id}")
        # Placeholder: Fetch user data from a database
        profile = UserProfileModel(
            id=user_id,
            name="Alex Doe",
            native_language="English",
            target_language="Japanese",
            proficiency_level="B1",
            interests=["anime", "technology", "travel"]
        )
        return profile

    def get_profile(self, user_id):
        """
        Web endpoint to retrieve the learning profile for a given user.
        ---
        /agent/v1/profile/user123
        """
        profile = self._get_profile_data(user_id)
        return jsonify(asdict(profile)), 200

    def register_routes(self, app):
        app.register_blueprint(self.profile_bp)