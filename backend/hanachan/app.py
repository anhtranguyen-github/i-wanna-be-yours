from flask import Flask
from flask_cors import CORS
from flask_talisman import Talisman
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from database.database import init_app, db
import os
import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s : %(message)s",
)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

def create_app(test_config=None):
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
    app.limiter = Limiter(
        get_remote_address,
        app=app,
        default_limits=["2000 per day", "100 per hour"],
        storage_uri="memory://",
    )
    limiter = app.limiter

    # CORS configuration
    allowed_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    CORS(app, resources={r"/*": {"origins": allowed_origins}})
    
    if test_config:
        app.config.from_mapping(test_config)
    
    app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
    
    # Initialize database
    init_app(app)
    
    # Import models to ensure they are registered with SQLAlchemy
    import models

    # Register blueprints
    from routes.agent import bp as agent_bp
    from routes.mcp import bp as mcp_bp
    app.register_blueprint(agent_bp)
    app.register_blueprint(mcp_bp)
    
    from routes.conversation import bp as conversation_bp
    from routes.task import bp as task_bp
    from routes.suggestion import bp as suggestion_bp
    from routes.artifacts import bp as artifacts_bp
    from routes.linguistics import bp as linguistics_bp
    from routes.resource import bp as resource_bp
    app.register_blueprint(conversation_bp)
    app.register_blueprint(task_bp)
    app.register_blueprint(suggestion_bp)
    app.register_blueprint(artifacts_bp)
    app.register_blueprint(linguistics_bp, url_prefix='/d-api')
    app.register_blueprint(resource_bp)
    
    # Initialize MongoDB indexes for artifacts (conditional)
    if os.environ.get("ENABLE_MONGO", "false").lower() == "true":
        try:
            from database.mongo import init_mongo_indexes
            init_mongo_indexes()
        except Exception as e:
            print(f"⚠️ MongoDB index init skipped: {e}")
    
    @app.route('/health')
    def health():
        return 'OK'

    @app.route('/')
    def index():
        return app.send_static_file('dashboard.html')
        
    return app

import os

if __name__ == '__main__':
    app = create_app()
    port = int(os.environ.get('FLASK_PORT', 5400))
    app.run(debug=True, port=port)
