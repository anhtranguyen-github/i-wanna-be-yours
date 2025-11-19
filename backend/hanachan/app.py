import os
import logging
from flask import Flask, jsonify
from flask_cors import CORS

# ---------------------------------- Logging setup ----------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(threadName)s : %(message)s",
)
logger = logging.getLogger("flask-ai-agent")

# ---------------------------------- Flask initialization ----------------------------------------
app = Flask(__name__)
CORS(app)  # Allow CORS for all domains

# ---------------------------------- Environment & Ports -----------------------------------------
flask_port = int(os.getenv("FLASK_PORT", 5400))
env = os.getenv("APP_ENV", "dev")
logger.info(f"Running Flask AI Agent in {env} mode on port {flask_port}")

# ---------------------------------- Global API Endpoints ----------------------------------------
@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint."""
    return jsonify({"message": "OK", "status": "healthy"}), 200

@app.route("/", methods=["GET"])
def index():
    """Serve the UI."""
    return app.send_static_file("ui.html")

# ---------------------------------- Module Registration -----------------------------------------
# Register Chat Routes (Main Agent)
try:
    from chat import register_routes as register_chat_routes
    register_chat_routes(app)
    logger.info("✅ Registered chat routes successfully.")
except ImportError as e:
    logger.error(f"❌ Could not import chat routes: {e}")
except Exception as e:
    logger.exception(f"❌ Error registering chat routes: {e}")

# Register other modules (Optional/Legacy)
try:
    from modules.agent_module import AgentModule
    agent_module = AgentModule()
    agent_module.register_routes(app)
    logger.info("✅ Registered AgentModule successfully.")
except ImportError:
    logger.info("ℹ️ AgentModule not found, skipping.")
except Exception as e:
    logger.warning(f"⚠️ Error registering AgentModule: {e}")

# ---------------------------------- Run Flask App -----------------------------------------------
if __name__ == "__main__":
    app.run(debug=(env == "dev"), host="0.0.0.0", port=flask_port)
