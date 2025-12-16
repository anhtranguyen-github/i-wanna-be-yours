from flask import Flask
from flask_cors import CORS
from database.database import init_app, db

def create_app(test_config=None):
    app = Flask(__name__)
    CORS(app)
    
    if test_config:
        app.config.from_mapping(test_config)
    
    app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
    
    # Initialize database
    init_app(app)
    
    # Register blueprints
    from routes.agent import bp as agent_bp
    from routes.mcp import bp as mcp_bp
    app.register_blueprint(agent_bp)
    app.register_blueprint(mcp_bp)
    
    from routes.resource import bp as resource_bp
    from routes.conversation import bp as conversation_bp
    from routes.task import bp as task_bp
    from routes.suggestion import bp as suggestion_bp
    from routes.artifacts import bp as artifacts_bp
    app.register_blueprint(resource_bp)
    app.register_blueprint(conversation_bp)
    app.register_blueprint(task_bp)
    app.register_blueprint(suggestion_bp)
    app.register_blueprint(artifacts_bp)
    
    # Initialize MongoDB indexes for artifacts
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
