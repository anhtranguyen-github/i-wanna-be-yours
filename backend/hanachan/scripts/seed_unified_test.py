import os
import sys
import logging
from pymongo import MongoClient
from datetime import datetime, timezone
from dotenv import load_dotenv

# Load env variables
load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def seed_unified_test_data():
    user_id = "test-user-123"
    logger.info(f"🌱 Seeding unified test data for user: {user_id}")

    # 1. MongoDB - Artifacts and Study Data
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    client = MongoClient(mongo_uri)
    db = client["hanachan"]
    artifacts_col = db["artifacts"]
    
    # We also have study data in flaskStudyPlanDB based on other scripts
    study_db = client["flaskStudyPlanDB"]
    goals_col = study_db["smart_goals"]
    perf_col = study_db["performance_trackings"]

    # Clear existing data for test user
    artifacts_col.delete_many({"userId": user_id})
    goals_col.delete_many({"user_id": user_id})
    perf_col.delete_many({"user_id": user_id})

    # Seed an Artifact (Flashcard)
    flashcard_artifact = {
        "userId": user_id,
        "type": "flashcard_deck",
        "title": "N5 Particles Intro",
        "description": "Basic particles mastered during session 1",
        "data": {
            "cards": [
                {"front": "は (wa)", "back": "Topic marker"},
                {"front": "を (wo)", "back": "Object marker"}
            ]
        },
        "metadata": {"level": "N5", "source": "tutoring"},
        "createdAt": datetime.now(timezone.utc),
        "savedToLibrary": True
    }
    artifacts_col.insert_one(flashcard_artifact)
    logger.info("✅ Seeded MongoDB Artifacts.")

    # Seed a Smart Goal
    goal = {
        "user_id": user_id,
        "title": "Master N5 Grammar",
        "status": "active",
        "priority": 1,
        "created_at": datetime.now(timezone.utc)
    }
    goals_col.insert_one(goal)
    logger.info("✅ Seeded MongoDB Study Goals.")

    # 2. Neo4j - Semantic Memory
    try:
        from langchain_neo4j import Neo4jGraph
        graph = Neo4jGraph(
            url=os.getenv("NEO4J_URI", "bolt://localhost:7687"),
            username=os.getenv("NEO4J_USERNAME", "neo4j"),
            password=os.getenv("NEO4J_PASSWORD", "password")
        )
        # Clear
        graph.query("MATCH (u:User {id: $user_id})-[r:KNOWS|STRUGGLES_WITH]->() DELETE r", {"user_id": user_id})
        # Seed
        cypher = """
        MERGE (u:User {id: $user_id})
        MERGE (t1:Topic {id: "particles", name: "Grammar Particles"})
        MERGE (t2:Topic {id: "kanji", name: "Basic Kanji"})
        MERGE (u)-[:STRUGGLES_WITH]->(t1)
        MERGE (u)-[:KNOWS]->(t2)
        """
        graph.query(cypher, {"user_id": user_id})
        logger.info("✅ Seeded Neo4j Semantic Memory.")
    except Exception as e:
        logger.warning(f"⚠️ Neo4j Seeding skipped: {e}")

    # 3. Qdrant - Mock Resource Metadata (Physical Record in a real system)
    # Since we can't easily seed Qdrant vectors without the full embedding pipeline,
    # we just acknowledge the user-provided files in the report.
    logger.info(f"📁 Resources assigned to user: ['2508.14797v1 (2).pdf', 'Building an AI-Integrated Goal Tracker.pdf']")

if __name__ == "__main__":
    seed_unified_test_data()
