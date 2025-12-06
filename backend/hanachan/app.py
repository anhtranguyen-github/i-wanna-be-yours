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
from dotenv import load_dotenv
load_dotenv()

try:
    from chat_service import register_routes as register_chat_routes
    register_chat_routes(app)
    logger.info("✅ Registered Chat Service routes successfully.")

except ImportError as e:
    logger.error(f"❌ Could not import routes: {e}")
except Exception as e:
    logger.exception(f"❌ Error registering routes: {e}")


try:
    from routers.agent_api import agent_api
    app.register_blueprint(agent_api)
    logger.info("✅ Registered Agent API routes successfully.")
except ImportError as e:
    logger.error(f"❌ Could not import Agent API routes: {e}")
except Exception as e:
    logger.exception(f"❌ Error registering Agent API routes: {e}")

# ---------------------------------- Run Flask App -----------------------------------------------
if __name__ == "__main__":
    app.run(debug=(env == "dev"), host="0.0.0.0", port=flask_port)
