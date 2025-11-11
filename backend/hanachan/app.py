import os
import logging
from flask import Flask, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo

# ---------------------------------- Logging setup ----------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(threadName)s : %(message)s",
)
logger = logging.getLogger("flask-ai-agent")

# ---------------------------------- Flask initialization ----------------------------------------
app = Flask(__name__)
CORS(app)  # Cho phép CORS từ mọi domain (frontend gọi API dễ dàng)

# ---------------------------------- Database configuration --------------------------------------
app.config["MONGO_URI_FLASKAIAGENTDATABASE"] = "mongodb://localhost:27017/flaskAiAgentDB"
mongo_flaskAiAgentDB = PyMongo(app, uri="mongodb://localhost:27017/flaskAiAgentDB")

# ---------------------------------- Environment & Ports -----------------------------------------
flask_port = 5400  # chạy ở port 5400 cho service AI Agent
env = os.getenv("APP_ENV", "dev")  # dev hoặc prod
host = "host.docker.internal" if env == "prod" else "localhost"
logger.info(f"Running Flask AI Agent in {env} mode on port {flask_port}")

# ---------------------------------- Global API Endpoints ----------------------------------------
@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint."""
    return jsonify({"message": "OK"}), 200


# ---------------------------------- Class Imports (Modules) -------------------------------------
# Dưới đây là nơi bạn import và đăng ký các modules cho AI Agent.
# Giống như flashcard server, mỗi module có method register_routes(app).

try:
    from modules.context.combined_context import (
        ContextManager,
        UserProfile,
        ConversationHistory,
        SystemContext,
        RetrievedKnowledge,
        ToolContext,
        ConversationGoalTracker
    )

    # --- Initialize context components ---
    logger.info("Initializing AI Agent context components...")

    user_profile_service = UserProfile()
    conversation_history_service = ConversationHistory()
    conversation_goal_tracker_service = ConversationGoalTracker()
    system_context_service = SystemContext()
    retrieved_knowledge_service = RetrievedKnowledge()
    tool_context_service = ToolContext()

    context_manager = ContextManager(
        user_profile=user_profile_service,
        conversation_history=conversation_history_service,
        system_context=system_context_service,
        retrieved_knowledge=retrieved_knowledge_service,
        tool_context=tool_context_service,
        conversation_goal_tracker=conversation_goal_tracker_service,
    )

    logger.info("AI Agent ContextManager initialized successfully.")

except ImportError as e:
    logger.warning(f"Some context modules not found: {e}")
    context_manager = None


try:
    from modules.agent_module import AgentModule
    agent_module = AgentModule(context_manager)
    agent_module.register_routes(app)
    logger.info("Registered AgentModule successfully.")
except ModuleNotFoundError:
    logger.warning("modules/agent_module.py not found — skipping route registration.")
except Exception as e:
    logger.exception(f"Error registering AgentModule: {e}")


# ---------------------------------- Run Flask App -----------------------------------------------
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=flask_port)
