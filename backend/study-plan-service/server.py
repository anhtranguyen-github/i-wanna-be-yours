"""
Study Plan Service
Port: 5500

This service handles all study planning, learner progress, and adaptive learning features.

Modules:
- study_plan.py: Study plans, milestones, daily tasks
- learner_progress.py: Progress tracking, achievements, sessions
- adaptive_learning.py: AI recommendations, difficulty adjustment

Database: flaskStudyPlanDB
"""

import os
import logging
from flask import Flask, jsonify
from flask_cors import CORS
from flask_talisman import Talisman
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(threadName)s : %(message)s",
)

app = Flask(__name__)

# --- Security Configuration ---
# Talisman for security headers
csp = {
    'default-src': '\'self\'',
    'img-src': '*',
    'style-src': ['\'self\'', '\'unsafe-inline\''],
    'script-src': '\'self\''
}
Talisman(app, content_security_policy=csp, force_https=False)  # Set force_https=True in production

# Limiter for rate limiting
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["2000 per day", "100 per hour"],
    storage_uri="memory://",
)

# CORS configuration
allowed_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
CORS(app, resources={r"/*": {"origins": allowed_origins}}, supports_credentials=True)

# Service configuration
SERVICE_PORT = int(os.getenv("STUDY_PLAN_SERVICE_PORT", 5500))

# --- Health check endpoint --- #
@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"message": "OK", "service": "study-plan-service", "port": SERVICE_PORT}), 200

@app.errorhandler(Exception)
def handle_exception(e):
    # Log the error
    app.logger.error(f"Unhandled exception: {str(e)}", exc_info=True)
    return jsonify({
        "error": str(e),
        "type": type(e).__name__
    }), 500


# ---------------- Module imports ----------------- #

from modules.content_mastery import ContentMasteryModule
content_mastery_module = ContentMasteryModule()
content_mastery_module.register_routes(app)

from modules.smart_goals import SmartGoalsModule
smart_goals_module = SmartGoalsModule()
smart_goals_module.register_routes(app)

from modules.okr import OKRModule
okr_module = OKRModule(content_mastery_module)
okr_module.register_routes(app)

from modules.pact import PACTModule
pact_module = PACTModule()
pact_module.register_routes(app)

from modules.context import ContextModule
context_module = ContextModule()
context_module.register_routes(app)

from modules.priority import PriorityMatrixModule
priority_matrix_module = PriorityMatrixModule()
priority_matrix_module.register_routes(app)

from modules.review_cycles import ReviewCyclesModule
review_cycles_module = ReviewCyclesModule()
review_cycles_module.register_routes(app)

from modules.study_plan import StudyPlanModule
study_plan_module = StudyPlanModule()
study_plan_module.register_routes(app)

from modules.learner_progress import LearnerProgressModule
learner_progress_module = LearnerProgressModule()
learner_progress_module.register_routes(app)

from modules.adaptive_learning import AdaptiveLearningModule
adaptive_learning_module = AdaptiveLearningModule()
adaptive_learning_module.register_routes(app)

from modules.user_preferences import UserPreferencesModule
user_preferences_module = UserPreferencesModule()
user_preferences_module.register_routes(app)

from modules.performance import PerformanceModule
performance_module = PerformanceModule()
performance_module.register_routes(app)

# --------------- End of Module imports ---------------- #


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=SERVICE_PORT)
