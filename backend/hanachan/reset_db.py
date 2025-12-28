import argparse
from app import create_app, db
from sqlalchemy import text
import os
from neo4j import GraphDatabase
from qdrant_client import QdrantClient

def reset_database():
    """
    Drops all SQL tables, clears Neo4j graph, and wipes Qdrant collections.
    """
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true", help="Skip confirmation")
    args = parser.parse_args()

    app = create_app()
    
    if not args.force:
        print("⚠ WARNING: This will delete ALL data in the database (SQL, Neo4j, Qdrant).")
        confirm = input("Are you sure you want to proceed? (y/n): ")
        if confirm.lower() != 'y':
            print("Operation cancelled.")
            return

    print("\n--- 1. Resetting SQL Database ---")
    with app.app_context():
        try:
            db.drop_all()
            print("SQL tables dropped.")
            db.create_all()
            print("SQL tables recreated.")
        except Exception as e:
            print(f"SQL Reset Failed: {e}")

    print("\n--- 2. Resetting Neo4j Graph ---")
    try:
        neo4j_uri = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
        neo4j_user = os.environ.get("NEO4J_USERNAME", "neo4j")
        neo4j_pass = os.environ.get("NEO4J_PASSWORD", "password")
        driver = GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_pass))
        with driver.session() as session:
            session.run("MATCH (n) DETACH DELETE n")
        driver.close()
        print("Neo4j graph cleared.")
    except Exception as e:
        print(f"Neo4j Reset Failed: {e}")

    print("\n--- 3. Resetting Qdrant Vectors ---")
    try:
        qdrant_host = os.environ.get("QDRANT_HOST", "localhost")
        qdrant_port = int(os.environ.get("QDRANT_PORT", 6333))
        client = QdrantClient(host=qdrant_host, port=qdrant_port)
        
        collections = ["episodic_memory", "semantic_memory", "resource_vectors"]
        for col in collections:
            try:
                client.delete_collection(col)
                print(f"Deleted collection: {col}")
            except Exception:
                pass # Collection might not exist
        print("Qdrant collections cleared.")
    except Exception as e:
        print(f"Qdrant Reset Failed: {e}")

    print("\n✅ Full System Reset Complete.")

if __name__ == "__main__":
    reset_database()
