import os
import logging
from flask import Flask, jsonify
from flask_cors import CORS

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(threadName)s : %(message)s",
)

app = Flask(__name__)
CORS(app)

# Database configuration (placeholder for when you need it)
# app.config["MONGO_URI_AGENT"] = "mongodb://localhost:27017/agentDB"
# mongo_agentDB = PyMongo(app, uri="mongodb://localhost:27017/agentDB")

# ---------------------------------- Global vars ----------------------------------------------

agent_port = 5400

# Determine the environment (dev or prod)
# Reading environment variable with a default value of "dev"
env = os.getenv("APP_ENV", "dev")

# --- universal API endpoints ---- #

# curl -X GET http://localhost:5400/agent/v1/health or http://127.0.0.1:5400/agent/v1/health
@app.route("/agent/v1/health", methods=["GET"])
def health_check():
    """Responds with a simple JSON message and a 200 OK status."""
    app.logger.info("Health check endpoint was called.")
    return jsonify({"status": "OK", "message": "Agent service is running"}), 200

# ---------------- Class imports ----------------- #

from modules.context.user_profile import UserProfile
from modules.context.conversation_history import ConversationHistory
from modules.context.learning_goals import LearningGoals
from modules.context.system_context import SystemContext
from modules.context.context_manager import ContextManager

# Instantiate and register the user profile component
user_profile = UserProfile()
user_profile.register_routes(app)

# Instantiate and register context source components
conversation_history = ConversationHistory()
conversation_history.register_routes(app)

learning_goals = LearningGoals()
learning_goals.register_routes(app)

system_context = SystemContext()
system_context.register_routes(app)



# Instantiate the main agent orchestrator (ContextManager) with its dependencies
context_manager = ContextManager(user_profile, conversation_history, learning_goals, system_context)
context_manager.register_routes(app)

# --------------- End of Class imports ---------------- #

if __name__ == '__main__':
    # debug=True will reload the server on code changes
    # and provide more detailed error messages.
    # In a production environment using Gunicorn, debug should be False.
    app.logger.info(f"Starting agent service in {env} mode on port {agent_port}")
    app.run(debug=True, host="0.0.0.0", port=agent_port)
