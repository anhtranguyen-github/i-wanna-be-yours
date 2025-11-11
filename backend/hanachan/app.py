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

try:
    from modules.context import ContextManager
    from modules.agent_module import AgentModule

    # The AgentModule will now be responsible for initializing the ContextManager
    # on a per-request basis, as user_id and session_id are request-specific.
    agent_module = AgentModule()
    agent_module.register_routes(app)
    
    logger.info("Registered AgentModule successfully.")

except ImportError as e:
    logger.warning(f"Could not import modules: {e}")
except Exception as e:
    logger.exception(f"Error registering AgentModule: {e}")


# ---------------------------------- Run Flask App -----------------------------------------------
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=flask_port)
