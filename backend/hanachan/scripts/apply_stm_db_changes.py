import sqlite3
import os

db_path = "backend/hanachan/instance/hanachan.db"

if not os.path.exists(db_path):
    print(f"Database {db_path} not found.")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    print("Adding 'summary' column to 'conversations' table...")
    cursor.execute("ALTER TABLE conversations ADD COLUMN summary TEXT")
    print("Column 'summary' added successfully.")
except sqlite3.OperationalError as e:
    if "duplicate column name" in str(e).lower():
        print("Column 'summary' already exists.")
    else:
        print(f"Error adding 'summary': {e}")

try:
    print("Adding 'last_summarized_msg_id' column to 'conversations' table...")
    cursor.execute("ALTER TABLE conversations ADD COLUMN last_summarized_msg_id INTEGER")
    print("Column 'last_summarized_msg_id' added successfully.")
except sqlite3.OperationalError as e:
    if "duplicate column name" in str(e).lower():
        print("Column 'last_summarized_msg_id' already exists.")
    else:
        print(f"Error adding 'last_summarized_msg_id': {e}")

conn.commit()
conn.close()
print("Database migration complete.")
