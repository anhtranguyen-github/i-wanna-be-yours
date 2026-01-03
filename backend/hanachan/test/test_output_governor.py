import pytest
import os
import sys
from unittest.mock import MagicMock, patch
from agent.engine.output_governor import OutputGovernor
from schemas.output import UnifiedOutput

# Ensure we can import from the root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def test_output_governor_registration():
    user_id = "test-user"
    session_id = "sess-1"
    conv_id = "conv-1"
    
    governor = OutputGovernor(user_id, session_id, conv_id)
    
    # Mock ArtifactService
    with patch('agent.engine.output_governor.ArtifactService') as mock_service:
        mock_service.create_artifact.return_value = {"_id": "real-db-id-123"}
        
        proposed = [
            {
                "type": "flashcard",
                "title": "N5 Test",
                "data": {"cards": []}
            }
        ]
        
        package = governor.package(
            content="Here is your flashcard.",
            proposed_artifacts=proposed,
            suggestions=["Ask for a quiz"]
        )
        
        # Verifications
        assert isinstance(package, UnifiedOutput)
        assert package.message.content == "Here is your flashcard."
        assert len(package.artifacts) == 1
        assert package.artifacts[0].id == "real-db-id-123"
        assert package.suggestions == ["Ask for a quiz"]
        
        # Ensure service was called
        mock_service.create_artifact.assert_called_once()
        print(f"Governor Package: {package.json()}")

if __name__ == "__main__":
    test_output_governor_registration()
    print("✅ OutputGovernor Logic Verified")
