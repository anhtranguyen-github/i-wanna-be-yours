"""
Debug Service - Aggregates internal state for Sovereign HUD visualization.
Exposes Thought Traces, Semantic Graph, and Artifact Audits.
"""
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)


class DebugService:
    """
    Service for exposing internal agent state to the frontend HUD.
    All data is scoped to the requesting user.
    """

    @staticmethod
    def get_recent_traces(user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Fetches the most recent internal thought traces for a user.
        """
        try:
            from app import create_app
            app = create_app()
            with app.app_context():
                from models.trace import AgentTrace
                traces = AgentTrace.query.filter_by(user_id=user_id)\
                    .order_by(AgentTrace.timestamp.desc())\
                    .limit(limit)\
                    .all()
                return [t.to_dict() for t in traces]
        except Exception as e:
            logger.error(f"Error fetching traces: {e}")
            return []

    @staticmethod
    def get_semantic_graph(user_id: str) -> Dict[str, Any]:
        """
        Fetches the user's Neo4j knowledge graph for visualization.
        Returns a format compatible with react-force-graph-2d: { nodes: [], links: [] }
        """
        try:
            from memory.semantic import SemanticMemory
            semantic = SemanticMemory()
            if not semantic.graph:
                return {"nodes": [], "links": [], "error": "Neo4j disconnected"}
            
            return semantic.get_user_graph(user_id)
        except Exception as e:
            logger.error(f"Error fetching semantic graph: {e}")
            return {"nodes": [], "links": [], "error": str(e)}

    @staticmethod
    def get_artifact_audit(user_id: str, limit: int = 50) -> Dict[str, Any]:
        """
        Fetches MongoDB artifacts for the user, including their persistence status.
        """
        try:
            from services.artifact_service import ArtifactService
            artifacts = ArtifactService.get_user_artifacts(user_id, limit=limit)
            
            # Enrich with "ghost" status
            for art in artifacts:
                art["is_ghost"] = str(art.get("_id", "")).startswith("ghost-")
            
            return {
                "count": len(artifacts),
                "artifacts": artifacts
            }
        except Exception as e:
            logger.error(f"Error fetching artifact audit: {e}")
            return {"count": 0, "artifacts": [], "error": str(e)}

    @staticmethod
    def get_episodic_memory(user_id: str, query: str = "recent", limit: int = 10) -> List[Dict[str, Any]]:
        """
        Performs a vector search on episodic memory for debugging.
        """
        try:
            from memory.episodic import EpisodicMemory
            episodic = EpisodicMemory()
            
            results = episodic.retrieve(query, user_id=user_id, limit=limit, return_documents=True)
            
            # Format for display
            if isinstance(results, list):
                return [{"content": doc.page_content, "metadata": doc.metadata} for doc in results]
            return []
        except Exception as e:
            logger.error(f"Error fetching episodic memory: {e}")
            return []
