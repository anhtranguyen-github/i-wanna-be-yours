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

    def add_relationships(self, relationships: List[Any], user_id: str):
        """
        Adds relationships to the graph, scoped to a user.
        relationships: List of Relationship objects (Pydantic models from extraction)
        """
        if not self.graph or not user_id:
            return

        for rel in relationships:
            try:
                # Construct query directly with user scoping
                # MERGE the User node
                # MERGE the Source/Target nodes
                # MERGE the User->Source connection (User KNOWS Fact)
                cypher = """
                MERGE (u:User {id: $user_id})
                MERGE (s:%s {id: $source_id})
                MERGE (t:%s {id: $target_id})
                MERGE (u)-[:KNOWS]->(s)
                MERGE (s)-[r:%s]->(t)
                """ % (
                    rel.source.type.replace(' ', '_'),
                    rel.target.type.replace(' ', '_'),
                    rel.type.replace(' ', '_')
                )
                
                self.graph.query(cypher, {
                    'user_id': str(user_id),
                    'source_id': rel.source.id,
                    'target_id': rel.target.id
                })
            except Exception as e:
                print(f"Error adding relationship to Neo4j: {e}")

    def retrieve(self, user_id: str, query: str = None, limit: int = 10) -> str:
        if not self.graph:
            return "Semantic memory unavailable."
        
        if not user_id:
            return "No user ID provided for memory context."
        
        # Retrieval scoped to what the User KNOWS
        try:
            cypher = """
                MATCH (u:User {id: $user_id})-[:KNOWS]->(n)-[r]->(m)
                RETURN n.id as source, type(r) as relationship, m.id as target
                LIMIT $limit
            """
            result = self.graph.query(cypher, {'user_id': str(user_id), 'limit': limit})
            
            if result:
                return "\n".join([f"{r['source']} --[{r['relationship']}]--> {r['target']}" for r in result])
            return "No semantic memories found."
        except Exception as e:
            print(f"Error retrieving semantic memory: {e}")
            return "Error retrieving semantic context."

    def get_user_graph(self, user_id: str) -> Dict[str, List[Any]]:
        """
        Retrieves the user's knowledge graph (nodes connected to the User via KNOWS).
        Returns format compatible with react-force-graph-2d: { nodes: [], links: [] }
        """
        if not self.graph:
            return {"nodes": [], "links": []}

        # Query for: User -> KNOWS -> Source -[Rel]-> Target
        # We visualize the subgraph "known" by the user
        cypher = """
            MATCH (u:User {id: $user_id})-[:KNOWS]->(s)
            OPTIONAL MATCH (s)-[r]->(t)
            RETURN s.id as source_id, labels(s) as source_labels, 
                   type(r) as rel_type, 
                   t.id as target_id, labels(t) as target_labels
        """
        try:
             results = self.graph.query(cypher, {'user_id': str(user_id)})
             
             nodes = {}
             links = []
             
             for row in results:
                 s_id = row['source_id']
                 if s_id and s_id not in nodes:
                     # Clean up label (remove 'Resource' if generic, or just verify)
                     lbl = row['source_labels'][0] if row['source_labels'] else "Unknown"
                     nodes[s_id] = {"id": s_id, "group": lbl, "label": s_id}
                 
                 t_id = row['target_id']
                 if t_id:
                     if t_id not in nodes:
                         lbl = row['target_labels'][0] if row['target_labels'] else "Unknown"
                         nodes[t_id] = {"id": t_id, "group": lbl, "label": t_id}
                     
                     if row['rel_type']:
                         # Prevent duplicate links if multiple types exist
                         link_id = f"{s_id}-{row['rel_type']}-{t_id}"
                         links.append({
                             "source": s_id,
                             "target": t_id,
                             "type": row['rel_type'],
                             "id": link_id
                         })
                         
             return {"nodes": list(nodes.values()), "links": links}
        except Exception as e:
            print(f"Error fetching user graph: {e}")
            return {"nodes": [], "links": []}
