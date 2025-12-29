
import os
import sys
from pymongo import MongoClient
from datetime import datetime, timedelta, timezone

# Ensure we can import from the root if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def seed_data():
    user_id = "recalibrate-test-user"
    print(f"🌱 Seeding study history for user: {user_id}")

    # 1. MongoDB - Performance Trackings
    mongo_client = MongoClient("mongodb://localhost:27017/")
    db = mongo_client["flaskStudyPlanDB"]
    perf_col = db["performance_trackings"]
    goals_col = db["smart_goals"]

    # Clear existing for fresh start
    perf_col.delete_many({"user_id": user_id})
    goals_col.delete_many({"user_id": user_id})

    # Seed some audits mentioning struggle with 'particles' and 'passive form'
    now = datetime.now(timezone.utc)
    audits = [
        {
            "user_id": user_id,
            "timestamp": now - timedelta(days=2),
            "type": "detailed_audit",
            "summary": "Struggled with particles in writing task.",
            "note_quality_score": 5,
            "note_audit_details": "User confused 'wa' and 'ga' repeatedly. Significant particle misuse.",
            "quantitative_stats": {"correct_count": 2, "total_count": 5}
        },
        {
            "user_id": user_id,
            "timestamp": now - timedelta(days=1),
            "type": "detailed_audit",
            "summary": "Passive form errors in review.",
            "note_quality_score": 4,
            "note_audit_details": "User failed to conjugate passive forms correctly. Persistent struggle with -rareru.",
            "quantitative_stats": {"correct_count": 1, "total_count": 4}
        }
    ]
    perf_col.insert_many(audits)
    print("✅ Seeded MongoDB performance trackings.")

    # Seed an active goal that needs recalibration
    goal = {
        "user_id": user_id,
        "title": "Daily Grammar Practice",
        "specific": "Practice General N3 Grammar",
        "measurable_metric": "grammar_points",
        "measurable_target": 10,
        "measurable_baseline": 0,
        "status": "active",
        "priority": 1,
        "created_at": now,
        "updated_at": now
    }
    goals_col.insert_one(goal)
    print("✅ Seeded MongoDB active goal.")

    # 2. Neo4j - Semantic Memory
    try:
        from langchain_neo4j import Neo4jGraph
        graph = Neo4jGraph(
            url=os.environ.get("NEO4J_URI", "bolt://localhost:7687"),
            username=os.environ.get("NEO4J_USERNAME", "neo4j"),
            password=os.environ.get("NEO4J_PASSWORD", "password")
        )
        
        # Clear existing struggle relations for this user
        graph.query("MATCH (u:User {id: $user_id})-[r:STRUGGLES_WITH]->() DELETE r", {"user_id": user_id})
        
        # Seed STRUGGLES_WITH relation
        cypher = """
        MERGE (u:User {id: $user_id})
        MERGE (p:Topic {id: "particles"})
        MERGE (ps:Topic {id: "passive_form"})
        MERGE (u)-[:STRUGGLES_WITH]->(p)
        MERGE (u)-[:STRUGGLES_WITH]->(ps)
        """
        graph.query(cypher, {"user_id": user_id})
        print("✅ Seeded Neo4j STRUGGLES_WITH relationships.")
        
    except Exception as e:
        print(f"⚠️ Neo4j Seeding failed: {e}")

if __name__ == "__main__":
    seed_data()
