
from app import create_app, db
from sqlalchemy import inspect

def verify_tables():
    app = create_app()
    with app.app_context():
        # Ensure tables are created
        db.create_all()
        
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        
        required = {'episodes', 'memory_jobs'}
        existing = set(tables)
        
        missing = required - existing
        
        if missing:
            print(f"❌ Missing tables: {missing}")
            print(f"Found: {tables}")
            exit(1)
        else:
            print("✅ New tables 'episodes' and 'memory_jobs' verified successfully.")
            exit(0)

if __name__ == "__main__":
    verify_tables()
