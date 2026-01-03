
import os
from sqlalchemy import create_engine, text

db_url = "postgresql://user:password@localhost:5433/mydatabase"
engine = create_engine(db_url)

with engine.connect() as conn:
    # Check if quiz_sets table exists first, if not we might need to create it or at least not have a FK yet
    # But since artifact.py has it, it should exist if db.create_all() was run.
    
    print("Adding missing columns to message_artifacts...")
    try:
        conn.execute(text("ALTER TABLE message_artifacts ADD COLUMN quiz_set_id INTEGER REFERENCES quiz_sets(id)"))
        print("Added quiz_set_id")
    except Exception as e:
        print(f"Error adding quiz_set_id: {e}")
        conn.rollback()

    try:
        conn.execute(text("ALTER TABLE message_artifacts ADD COLUMN metadata_ JSONB"))
        print("Added metadata_")
    except Exception as e:
        print(f"Error adding metadata_: {e}")
        conn.rollback()
    
    conn.commit()
    print("Done.")
