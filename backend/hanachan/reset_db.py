from app import create_app, db
from sqlalchemy import text

def reset_database():
    """
    Drops all tables and recreates them to reset the database to a clean state.
    """
    app = create_app()
    with app.app_context():
        print("⚠ WARNING: This will delete ALL data in the database.")
        confirm = input("Are you sure you want to proceed? (y/n): ")
        
        if confirm.lower() != 'y':
            print("Operation cancelled.")
            return

        print("Dropping all tables...")
        try:
            # Drop all tables interacting with the database
            db.drop_all()
            print("All tables dropped.")
            
            # Recreate all tables
            print("Recreating tables...")
            db.create_all()
            print("Database has been reset successfully. All tables created.")
            
        except Exception as e:
            print(f"An error occurred: {e}")
            # Fallback for strong recursion or stubborn tables (Postgres specific cascade)
            print("Attempting forced CASCADE drop (Postgres only)...")
            try:
                with db.engine.connect() as conn:
                    # Reflect all tables
                    meta = db.MetaData()
                    meta.reflect(bind=db.engine)
                    for table in reversed(meta.sorted_tables):
                        print(f"Dropping {table.name}...")
                        conn.execute(text(f'DROP TABLE IF EXISTS "{table.name}" CASCADE'))
                    conn.commit()
                print("Recreating tables after forced drop...")
                db.create_all()
                print("Database reset complete.")
            except Exception as e2:
                print(f"Failed forced drop: {e2}")

if __name__ == "__main__":
    reset_database()
