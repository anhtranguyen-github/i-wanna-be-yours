import os
from typing import List, Dict, Any
from pydantic import BaseModel, Field

class SemanticMemory:
    def __init__(self):
        self.graph = None
        self.embeddings = None
        try:
            from langchain_neo4j import Neo4jGraph
            from services.llm_factory import ModelFactory
            
            self.graph = Neo4jGraph(
                url=os.environ.get("NEO4J_URI", "bolt://localhost:7687"),
                username=os.environ.get("NEO4J_USERNAME", "neo4j"),
                password=os.environ.get("NEO4J_PASSWORD", "password")
            )
            self.embeddings = ModelFactory.create_embeddings()
        except Exception as e:
            print(f"Failed to initialize SemanticMemory: {e}")

    def _resolve_semantic_node(self, label: str, node_id: str, embedding: List[float]) -> str:
        """
        Search for a semantically similar node. Returns the found node's ID or the original node_id.
        """
        try:
            index_name = f"{label.lower()}_embeddings"
            # Neo4j 5.x Vector Search
            cypher = f"""
            CALL db.index.vector.queryNodes('{index_name}', 1, $emb)
            YIELD node, score
            WHERE score > 0.95
            RETURN node.id as id
            """
            result = self.graph.query(cypher, {"emb": embedding})
            if result:
                found_id = result[0]['id']
                if found_id != node_id:
                    print(f"🧬 [SEMANTIC] Resolved '{node_id}' to existing concept '{found_id}'")
                return found_id
        except Exception as e:
            # Index might not exist yet for this label, ignore silently
            pass
        return node_id

    def add_relationships(self, relationships: List[Any], user_id: str):
        if not self.graph or not user_id or not self.embeddings:
            return

        for rel in relationships:
            try:
                # 1. Generate embeddings for source and target labels
                src_label = rel.source.type.replace(' ', '_')
                tgt_label = rel.target.type.replace(' ', '_')
                
                src_emb = self.embeddings.embed_query(rel.source.id)
                tgt_emb = self.embeddings.embed_query(rel.target.id)
                
                # 2. Semantic Resolution (Deduplication)
                src_id = self._resolve_semantic_node(src_label, rel.source.id, src_emb)
                tgt_id = self._resolve_semantic_node(tgt_label, rel.target.id, tgt_emb)

                # 3. MERGE with embeddings
                cypher = """
                MERGE (u:User {id: $user_id})
                MERGE (s:%s {id: $src_id})
                ON CREATE SET s.embedding = $src_emb
                MERGE (t:%s {id: $tgt_id})
                ON CREATE SET t.embedding = $tgt_emb
                MERGE (u)-[:KNOWS]->(s)
                MERGE (s)-[r:%s]->(t)
                """ % (src_label, tgt_label, rel.type.replace(' ', '_'))
                
                self.graph.query(cypher, {
                    'user_id': str(user_id),
                    'src_id': src_id,
                    'src_emb': src_emb,
                    'tgt_id': tgt_id,
                    'tgt_emb': tgt_emb
                })
            except Exception as e:
                print(f"Error adding relationship to Neo4j: {e}")

    def retrieve(self, user_id: str, query: str = None, limit: int = 15) -> str:
        if not self.graph or not user_id:
            return ""
        
        try:
            # If no query, fallback to basic retrieval
            if not query or not self.embeddings:
                cypher = """
                    MATCH (u:User {id: $user_id})-[:KNOWS]->(n)-[r]->(m)
                    RETURN n.id as source, type(r) as relationship, m.id as target
                    LIMIT $limit
                """
                result = self.graph.query(cypher, {'user_id': str(user_id), 'limit': limit})
            else:
                # 1. Embed the query
                query_emb = self.embeddings.embed_query(query)
                
                # 2. Hybrid Vector-Graph Search
                # First find user-connected nodes that are semantically similar to query
                # We check across common labels (Topic, Fact, Goal, Preference)
                cypher = """
                MATCH (u:User {id: $user_id})-[:KNOWS]->(n)
                WHERE n.embedding IS NOT EMPTY
                WITH n, gds.similarity.cosine(n.embedding, $query_emb) AS score
                WHERE score > 0.7
                MATCH (n)-[r]->(m)
                RETURN n.id as source, type(r) as relationship, m.id as target, score
                ORDER BY score DESC
                LIMIT $limit
                """
                # Note: gds.similarity.cosine depends on GDS plugin. 
                # Alternative: Use simple vector search CALL if possible, but we need User filtering.
                # Let's use a more compatible approach if GDS isn't there: 
                # (Assuming Neo4j 5.x vector query handles this better with subqueries)
                
                # Fallback to a simpler user-scoped traversal if fancy similarity fails
                try:
                    result = self.graph.query(cypher, {'user_id': str(user_id), 'query_emb': query_emb, 'limit': limit})
                except:
                    # Basic match if similarity function is missing
                    cypher_basic = """
                    MATCH (u:User {id: $user_id})-[:KNOWS]->(n)-[r]->(m)
                    RETURN n.id as source, type(r) as relationship, m.id as target
                    LIMIT $limit
                    """
                    result = self.graph.query(cypher_basic, {'user_id': str(user_id), 'limit': limit})
            
            if result:
                return "Recent Facts: " + " | ".join([f"{r['source']} {r['relationship']} {r['target']}" for r in result])
            return "No relevant facts found."
        except Exception as e:
            print(f"Error retrieving semantic memory: {e}")
            return ""
