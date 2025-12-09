import os
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv

load_dotenv(override=True)

db = SQLAlchemy()

def init_app(app):
    if not app.config.get('SQLALCHEMY_DATABASE_URI'):
        app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
