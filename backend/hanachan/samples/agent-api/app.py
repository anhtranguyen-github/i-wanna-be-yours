from flask import Flask
from flask_cors import CORS
from backend.routes.agent import agent_bp
from backend.routes.mcp import mcp_bp
from backend.database import engine, Base

app = Flask(__name__)
CORS(app)

# Create tables if they don't exist
# Base.metadata.create_all(bind=engine)

app.register_blueprint(agent_bp, url_prefix='/api')
app.register_blueprint(mcp_bp, url_prefix='/api')

@app.route('/health')
def health():
    return "OK"

if __name__ == '__main__':
    app.run(debug=True, port=5000)
