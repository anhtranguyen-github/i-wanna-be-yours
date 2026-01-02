"""
Flask Service (Port 5100)

This service handles flashcards, quizzes, library, and resources.

NOTE: Study plan, learner progress, and adaptive learning have been moved to:
      backend/study-plan-service/ (port 5500)


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
# Max Content Length: 10MB (Aligns with Frontend)
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024

# Security Headers
Talisman(app, force_https=False) # force_https=True in prod with proper certs

# Rate Limiting
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["5000 per day", "1000 per hour"],
    storage_uri="memory://",
)

# CORS: Standardized Configuration
from config.cors import get_cors_config
cors_config = get_cors_config()
CORS(app, resources={r"/*": {
    "origins": cors_config["origins"],
    "methods": cors_config["methods"],
    "allow_headers": cors_config["allow_headers"],
    "expose_headers": cors_config["expose_headers"],
    "supports_credentials": cors_config["supports_credentials"],
    "max_age": cors_config["max_age"]
}})

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

# -- quiz (Unified into Express practiceRoutes) -- #
# from modules.quiz import QuizModule
# quiz_module = QuizModule()
# quiz_module.register_routes(app)

# -- decks -- #
from modules.decks import DeckModule
deck_module = DeckModule()
deck_module.register_routes(app)

# -- observability -- #
@app.route("/api/hanachan/traces", methods=["GET"])
def get_traces():
    from backend.hanachan.services.observability import obs_service
    limit = request.args.get("limit", 20, type=int)
    return jsonify({"traces": obs_service.get_trace_history(limit)}), 200

@app.route("/api/hanachan/signals", methods=["POST"])
def inject_signal():
    """Manually trigger an intelligent workflow signal."""
    from services.signal_producer import SignalProducer
    import redis
    
    data = request.json
    sig_type = data.get("type")
    priority = data.get("priority", "P2")
    user_id = data.get("user_id", "default_user")
    
    if not sig_type:
        return jsonify({"error": "Type is required"}), 400
        
    try:
        r = redis.Redis(host='localhost', port=6379, db=0)
        producer = SignalProducer(redis_client=r)
        trace_id = producer.emit(sig_type, priority, user_id)
        return jsonify({
            "status": "SUCCESS", 
            "trace_id": trace_id,
            "message": f"Signal '{sig_type}' injected for {user_id}"
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -- resources -- #
from modules.resources import ResourcesModule
resources_module = ResourcesModule()
resources_module.register_routes(app, limiter)

# --------------- End of Class imports ---------------- #

# MOVED TO study-plan-service (port 5500):
# - study_plan.py
# - learner_progress.py
# - adaptive_learning.py




if __name__ == "__main__":
    debug_mode = os.getenv("FLASK_DEBUG", "False").lower() in ("true", "1", "t")
    app.run(debug=debug_mode, host="0.0.0.0", port=flask_port)
