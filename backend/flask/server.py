"""
Flask Service (Port 5100)

This service handles flashcards, quizzes, library, and resources.

NOTE: Study plan, learner progress, and adaptive learning have been moved to:
      backend/study-plan-service/ (port 5500)

Deprecated modules moved to: modules/deprecated/
"""

import os
import logging
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_pymongo import PyMongo
from flask_talisman import Talisman
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(threadName)s : %(message)s",
)

app = Flask(__name__)

# Security Headers
Talisman(app, force_https=False) # force_https=True in prod with proper certs

# Rate Limiting
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["2000 per day", "100 per hour"],
    storage_uri="memory://",
)

# CORS: Tighten origins
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
CORS(app, resources={r"/*": {"origins": allowed_origins}}, supports_credentials=True)

# Database configuration
mongo_uri = os.getenv("MONGO_URI_FLASK", "mongodb://localhost:27017/flaskFlashcardDB")
app.config["MONGO_URI_FLASKFLASHCARDDATABASE"] = mongo_uri
mongo_flaskFlashcardDB = PyMongo(app, uri=mongo_uri)

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
    debug_mode = os.getenv("FLASK_DEBUG", "False").lower() in ("true", "1", "t")
    app.run(debug=debug_mode, host="0.0.0.0", port=flask_port)
