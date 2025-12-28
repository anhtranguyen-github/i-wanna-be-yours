import os
import sys
import logging

# Add backend/hanachan to path
sys.path.append(os.path.join(os.getcwd(), 'backend', 'hanachan'))

# Lazy import Neo4j
def init_indexes():
    from langchain_neo4j import Neo4jGraph
    
    url = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
    username = os.environ.get("NEO4J_USERNAME", "neo4j")
    password = os.environ.get("NEO4J_PASSWORD", "password")
    
    print(f"Connecting to Neo4j at {url}...")
    graph = Neo4jGraph(url=url, username=username, password=password)
    
    # List of labels to index
    labels = ["Topic", "Level", "Goal", "Preference", "Fact"]
    
    for label in labels:
        index_name = f"{label.lower()}_embeddings"
        print(f"Creating vector index for {label} ({index_name})...")
        
        # Cypher for creating vector index (Neo4j 5.x syntax)
        cypher = f"""
        CREATE VECTOR INDEX {index_name} IF NOT EXISTS
        FOR (n:{label}) ON (n.embedding)
        OPTIONS {{indexConfig: {{
          `vector.dimensions`: 1536,
          `vector.similarity_function`: 'cosine'
        }}}};
        """
        try:
            graph.query(cypher)
            print(f"✅ Success index for {label}")
        except Exception as e:
            print(f"❌ Failed index for {label}: {e}")

    print("\nInitialization complete.")

if __name__ == "__main__":
    if os.path.exists("backend/hanachan/.env"):
        from dotenv import load_dotenv
        load_dotenv("backend/hanachan/.env")
    
    init_indexes()
