import os
from typing import List, Dict, Any
from pydantic import BaseModel, Field

class SemanticMemory:
    def __init__(self):
        self.graph = None
        try:
            from langchain_neo4j import Neo4jGraph
            self.graph = Neo4jGraph(
                url=os.environ.get("NEO4J_URI", "bolt://localhost:7687"),
                username=os.environ.get("NEO4J_USERNAME", "neo4j"),
                password=os.environ.get("NEO4J_PASSWORD", "password")
            )
        except Exception as e:
            print(f"Failed to connect to Neo4j: {e}")

    def add_relationships(self, relationships: List[Any]):
        """
        Adds relationships to the graph.
        relationships: List of Relationship objects (Pydantic models from extraction)
        """
        if not self.graph:
            return

        for rel in relationships:
            try:
                cypher = """
                MERGE (s:{source_type} {id: $source_id})
                MERGE (t:{target_type} {id: $target_id})
                MERGE (s)-[r:{rel_type}]->(t)
                """
                query = cypher.format(
                    source_type=rel.source.type.replace(' ', '_'),
                    target_type=rel.target.type.replace(' ', '_'),
                    rel_type=rel.type.replace(' ', '_')
                )
                self.graph.query(query, {
                    'source_id': rel.source.id,
                    'target_id': rel.target.id
                })
            except Exception as e:
                print(f"Error adding relationship to Neo4j: {e}")

    def retrieve(self, query: str = None, limit: int = 10) -> str:
        if not self.graph:
            return "Semantic memory unavailable."
        
        # Simple retrieval - get everything for now, or could enhance to search by entities in query
        # For this phase, we just dump recent/all relationships up to limit to provide context
        try:
            result = self.graph.query("""
                MATCH (n)-[r]->(m)
                RETURN n.id as source, type(r) as relationship, m.id as target
                LIMIT $limit
            """, {'limit': limit})
            
            if result:
                return "\n".join([f"{r['source']} --[{r['relationship']}]--> {r['target']}" for r in result])
            return "No semantic memories found."
        except Exception as e:
            print(f"Error retrieving semantic memory: {e}")
            return "Error retrieving semantic context."
