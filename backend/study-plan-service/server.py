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

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(threadName)s : %(message)s",
)

app = Flask(__name__)

# CORS: Open completely for development
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Service configuration
SERVICE_PORT = int(os.getenv("STUDY_PLAN_SERVICE_PORT", 5500))

# --- Health check endpoint --- #
@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"message": "OK", "service": "study-plan-service", "port": SERVICE_PORT}), 200


# ---------------- Module imports ----------------- #

from modules.study_plan import StudyPlanModule
study_plan_module = StudyPlanModule()
study_plan_module.register_routes(app)

from modules.learner_progress import LearnerProgressModule
learner_progress_module = LearnerProgressModule()
learner_progress_module.register_routes(app)

from modules.adaptive_learning import AdaptiveLearningModule
adaptive_learning_module = AdaptiveLearningModule()
adaptive_learning_module.register_routes(app)

# TODO: Add new strategic framework modules here (Phase 0-6)
# from modules.content_mastery import ContentMasteryModule
# from modules.strategy_framework import StrategyFrameworkModule
# from modules.context_tracker import ContextTrackerModule
# from modules.priority_matrix import PriorityMatrixModule
# from modules.review_cycles import ReviewCyclesModule

# --------------- End of Module imports ---------------- #


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=SERVICE_PORT)
