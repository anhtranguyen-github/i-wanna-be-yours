
import os
from sqlalchemy import create_engine, inspect

db_url = "postgresql://user:password@localhost:5433/mydatabase"
engine = create_engine(db_url)
inspector = inspect(engine)

columns = [c['name'] for c in inspector.get_columns('message_artifacts')]
print(f"Columns in message_artifacts: {columns}")
