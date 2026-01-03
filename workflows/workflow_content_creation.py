import os
import sys
import logging
from dotenv import load_dotenv

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
load_dotenv(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../.env')))

from services.agent_service import AgentService
from schemas.chat import AgentRequest, ContextConfigurationDTO
from app import create_app

def workflow_content_creation():
    """
    WORKFLOW 2: Content Creation (Quiz Generation)
    
    Target Flow:
    1. User explicitly requests a quiz.
    2. Agent detects intent and generates 'quiz' artifact.
    3. Verify artifact structure in response.
    """
    print("\n🚀 WORKFLOW: Content Creation (Quiz)")
    
    app = create_app()
    with app.app_context():
        service = AgentService()
        session_id = "wf-content-001"
        user_id = "wf-user-001"
        
        # --- Step 1: Request Quiz ---
        print("\n📝 [Step 1] User says 'Make me a N5 vocabulary quiz'...")
        req = AgentRequest(
            session_id=session_id,
            user_id=user_id,
            prompt="Make me a N5 vocabulary quiz with 3 questions.",
            context_config=ContextConfigurationDTO()
        )
        
        resp = service.invoke_agent(req)
        
        # --- Verification ---
        artifacts = getattr(resp, 'responses', [])
        quiz_found = False
        
        for item in artifacts:
            # Check content of ResponseItemDTO
            # The item.content usually contains the actual artifact data or is the artifact
            # Depend on schema: item.type might be 'quiz' or 'artifact'
            print(f"   Inspect Item Type: {item.type}")
            
            # Since MockAgent returns 'artifacts' in a list, 
            # and AgentService might map them to ResponseItemDTOs...
            # In current AgentService logic (checked earlier), it saves text as 'text' type.
            # Artifacts are typically embedded or separate.
            
            # Let's check 'responses' content
            if hasattr(item.content, 'quiz') and item.content.quiz:
                quiz_found = True
                print("   ✅ Found Quiz Artifact in content structure")
            elif isinstance(item.content, dict) and item.content.get('type') == 'quiz':
                quiz_found = True
                print("   ✅ Found Quiz Artifact (dict)")
        
        # Also check specialized fields in AgentResponse if any (like proposedTasks)
        # MockAgent returns { artifacts: [...] }
        
        if quiz_found:
             print("\n✅ Workflow Successful: Quiz generated.")
        else:
             print("\n⚠️ Workflow Warning: No explicit 'quiz' artifact found. Check MockAgent content creation logic.")
             # Dump partial for debug
             print(f"   Full Response: {resp}")

if __name__ == "__main__":
    workflow_content_creation()
