import logging
import uuid
from typing import List, Dict, Any, Optional
from schemas.output import UnifiedOutput, PackageArtifact, PackageMessage
from services.artifact_service import ArtifactService

logger = logging.getLogger(__name__)

class OutputGovernor:
    """
    The 'Governor' of system outputs.
    Ensures artifacts are registered, schema-compliant, and IDs are resolved.
    'LLM Proposes, System Disposes' - but for outputs.
    """
    
    def __init__(self, user_id: str, session_id: str, conversation_id: str):
        self.user_id = user_id
        self.session_id = session_id
        self.conversation_id = conversation_id
        self.artifacts: List[PackageArtifact] = []

    def package(self, 
                content: str, 
                proposed_artifacts: List[Dict[str, Any]] = None,
                proposed_tasks: List[Dict[str, Any]] = None,
                suggestions: List[str] = None) -> UnifiedOutput:
        """
        Finalizes the interaction by registering products and packaging the response.
        """
        logger.info(f"📦 [Governor] Packaging final response for conversation {self.conversation_id}")
        
        # 1. Apply Safety Filter (Hiding the 'Guts')
        safe_content = self._safety_filter(content)
        
        # 2. Register Artifacts Physically
        final_artifacts = []
        if proposed_artifacts:
            for art in proposed_artifacts:
                reg_art = self._register_artifact(art)
                if reg_art:
                    final_artifacts.append(reg_art)
        
        # 3. Process Task Proposals
        from schemas.output import PackageTask
        final_tasks = []
        if proposed_tasks:
            for task in proposed_tasks:
                final_tasks.append(PackageTask(
                    id=str(uuid.uuid4()), # Proposed tasks have temp IDs until accepted
                    title=task.get("title", "Proposed Task"),
                    description=task.get("description", "")
                ))
        
        # 4. Package into Unified DTO
        package = UnifiedOutput(
            session_id=self.session_id,
            conversation_id=self.conversation_id,
            message=PackageMessage(content=safe_content),
            artifacts=final_artifacts,
            tasks=final_tasks,
            suggestions=suggestions or []
        )
        
        return package

    def _safety_filter(self, content: str) -> str:
        """
        Ensures internal technical terms or database implementation details
        are not leaked to the user.
        """
        # Redact common 'Guts' terms
        guts_terms = ["MongoDB", "Qdrant", "PostgreSQL", "Neo4j", "SQL", "Database ID", "ObjectID"]
        for term in guts_terms:
            content = content.replace(term, "[Internal System]")
            content = content.replace(term.lower(), "[Internal System]")
            
        # Redact raw hex IDs (24 chars) to prevent leakage
        import re
        content = re.sub(r'[0-9a-fA-F]{24}', "[ID]", content)
        
        return content

    def _register_artifact(self, art_data: Dict[str, Any]) -> Optional[PackageArtifact]:
        """
        Calls ArtifactService to ensure physical persistence and returns a PackageArtifact.
        """
        a_type = art_data.get("type", "unknown")
        a_title = art_data.get("title", "Untitled Artifact")
        a_payload = art_data.get("data", {})
        
        logger.info(f"🔨 [Governor] Registering Artifact: {a_title} ({a_type})")
        
        try:
            # Physically save to MongoDB (Product canonical store)
            # We bridge to ArtifactService
            mongo_art = ArtifactService.create_artifact(
                user_id=self.user_id,
                artifact_type=a_type,
                title=a_title,
                data=a_payload,
                description=art_data.get("description"),
                metadata=art_data.get("metadata", {}),
                conversation_id=self.conversation_id,
                save_to_library=False # System decides initial state
            )
            
            # Resolve the real system ID
            real_id = str(mongo_art["_id"])
            
            return PackageArtifact(
                id=real_id,
                type=a_type,
                title=a_title,
                data=a_payload,
                metadata=art_data.get("metadata", {})
            )
            
        except Exception as e:
            logger.error(f"❌ [Governor] Artifact registration failed: {e}")
            # If registration fails, we might return a "Ghost" or fail-safe artifact
            # For strictness, we'll skip it and log the error.
            return None
