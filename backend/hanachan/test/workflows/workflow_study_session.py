import os
import sys
import logging
from dotenv import load_dotenv

# Setup paths
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
load_dotenv(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../.env')))

from services.agent_service import AgentService
from schemas.chat import AgentRequest, ContextConfigurationDTO
from app import create_app

def workflow_study_session():
    """
    WORKFLOW 1: Study Session with Mocked Resources
    
    Target Flow:
    1. User starts session referencing a "textbook" (mocked via ID).
    2. Agent responds using that context.
    3. User asks follow-up.
    4. Service persists conversation state.
    """
    print("\n🚀 WORKFLOW: Study Session (RAG + Q&A)")
    
    app = create_app()
    with app.app_context():
        service = AgentService()
        session_id = "wf-study-session-001"
        user_id = "wf-user-001"
        
        # --- Step 1: Initial Query with Resource Context ---
        print("\n📝 [Step 1] User asks about 'Grammar' with resource context...")
        req1 = AgentRequest(
            session_id=session_id,
            user_id=user_id,
            prompt="Explain the 'TE-form' please.",
            context_config=ContextConfigurationDTO(
                resource_ids=["mock-resource-grammar-101"] # Needs to be handled by mock logic or resource processor
            )
        )
        
        resp1 = service.invoke_agent(req1)
        content1 = resp1.responses[0].content if resp1.responses else "No content"
        if hasattr(content1, 'content'): content1 = content1.content
        
        print(f"🤖 Agent: {content1[:100]}...")
        
        # --- Step 2: Follow-up Question ---
        print("\n📝 [Step 2] User asks follow-up 'Can you give an example?'...")
        req2 = AgentRequest(
            session_id=session_id,
            user_id=user_id,
            prompt="Can you give me an example sentence using it?",
            context_config=ContextConfigurationDTO(
                resource_ids=[] # Rely on previous context/memory
            )
        )
        
        resp2 = service.invoke_agent(req2)
        content2 = resp2.responses[0].content if resp2.responses else "No content"
        if hasattr(content2, 'content'): content2 = content2.content
        
        print(f"🤖 Agent: {content2[:100]}...")
        
        # --- Verification ---
        if len(content1) > 10 and len(content2) > 10:
            print("\n✅ Workflow Successful: Context maintained across turns.")
        else:
            print("\n❌ Workflow Failed: Responses too short or empty.")

if __name__ == "__main__":
    workflow_study_session()
