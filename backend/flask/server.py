"""
Flask Service (Port 5100)

This service handles flashcards, quizzes, library, and resources.

NOTE: Study plan, learner progress, and adaptive learning have been moved to:
      backend/study-plan-service/ (port 5500)

Deprecated modules moved to: modules/deprecated/
"""

import os
import logging
from flask import Flask, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(threadName)s : %(message)s",
)

app = Flask(__name__)

# CORS: Open completely for development
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Database configuration
app.config["MONGO_URI_FLASKFLASHCARDDATABASE"] = "mongodb://localhost:27017/flaskFlashcardDB"
mongo_flaskFlashcardDB = PyMongo(app, uri="mongodb://localhost:27017/flaskFlashcardDB")

# ---------------------------------- Global vars ----------------------------------------------

flask_port = 5100

# Determine the environment (dev or prod) to use the correct port
# Reading environment variable with a default value of "dev"
# env var is baked into Dockerfile
env = os.getenv("APP_ENV", "dev")    # prod/dev
port = "8000"  # port of static DB container
host = "host.docker.internal" if env == "prod" else "localhost"


# --- universal API endpoints ---- #

# curl -X GET http://localhost:5100/health
@app.route("/health", methods=["GET"])
def health_check():
    # Responds with a simple JSON message and a 200 OK status
    return jsonify({"message": "OK", "service": "flask-core", "port": flask_port}), 200




# ---------------- Class imports ----------------- #

# -- emails -- #
from modules.email_waitlist import EmailWaitlist
email_waitlist = EmailWaitlist()
email_waitlist.register_routes(app)

# -- flashcards -- #
from modules.flashcards import FlashcardModule
flashcard_module = FlashcardModule()
flashcard_module.register_routes(app)

# -- library -- #
from modules.library import LibraryTexts
library_texts_module = LibraryTexts()
library_texts_module.register_routes(app)

# -- quiz -- #
from modules.quiz import QuizModule
quiz_module = QuizModule()
quiz_module.register_routes(app)

# -- decks -- #
from modules.decks import DeckModule
deck_module = DeckModule()
deck_module.register_routes(app)

# -- resources -- #
from modules.resources import ResourcesModule
resources_module = ResourcesModule()
resources_module.register_routes(app)

# --------------- End of Class imports ---------------- #

# MOVED TO study-plan-service (port 5500):
# - study_plan.py
# - learner_progress.py
# - adaptive_learning.py

# DEPRECATED (moved to modules/deprecated/):
# - login_streak.py (duplicate of learner_progress streak)
# - vocabulary_mining.py (unused)
# - sentence_mining.py (unused)


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=flask_port)
