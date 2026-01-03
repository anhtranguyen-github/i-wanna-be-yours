import pytest
import asyncio
import os
import sys
from unittest.mock import MagicMock
from agent.engine.context_assembler import ContextAssembler
from schemas.context import LearnerContext

# Ensure we can import from the root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

@pytest.mark.asyncio
async def test_aperture_parallel_assembly():
    # Mocking MemoryManager and its sub-components
    mock_mm = MagicMock()
    
    # Mock Resource Retrieval
    mock_mm.retrieve_resource_context.return_value = "Chunk from Document A"
    
    # Mock Memory Retrieval
    mock_mm.retrieve_context.return_value = "User struggles with wa/ga."
    
    # Mock Artifact Retrieval
    from services.artifact_service import ArtifactService
    ArtifactService.get_user_artifacts = MagicMock(return_value=[
        {"_id": "art1", "type": "flashcard", "title": "Particle Deck", "createdAt": "2024-01-01"}
    ])
    
    # Mock Study Service
    mock_study = MagicMock()
    mock_study.client.get_active_plan_summary.return_value = {
        "target_level": "N3",
        "current_milestone": "Particles",
        "health_status": "on_track"
    }
    mock_study.client.get_performance_trends.return_value = {
        "identified_struggles": ["wa/ga"]
    }
    mock_mm.study = mock_study
    
    # Initialize Aperture
    aperture = ContextAssembler(mock_mm)
    
    # Execute Assembly
    context = await aperture.assemble(
        query="Tell me about particles",
        user_id="test-user",
        resource_ids=["doc1"],
        timeout=2.0
    )
    
    # Verification
    assert isinstance(context, LearnerContext)
    assert len(context.resources) > 0
    assert context.study_state is not None
    assert context.study_state.health == "on_track"
    
    # Test Narrative Generation (Distiller)
    narrative = context.to_system_narrative()
    print(f"Narrative Output:\n{narrative}")
    
    assert "LEARNER SITUATION REPORT" in narrative
    assert "N3 Mastery" in narrative
    assert "wa/ga" in narrative
    assert "Chunk from Document A" in narrative
    
    # Logic check: No DB IDs should be in the narrative if they aren't in the mock return
    # (Since our schema only captures title/content)
    assert "doc1" not in narrative
    assert "SourceID" not in narrative

if __name__ == "__main__":
    asyncio.run(test_aperture_parallel_assembly())
    print("✅ Aperture Parallel Assembly Verified")
