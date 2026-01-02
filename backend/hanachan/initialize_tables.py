import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db

app = create_app()
with app.app_context():
    db.create_all()
    print("Tables created/updated successfully.")
