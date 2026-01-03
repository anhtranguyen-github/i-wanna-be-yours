import os
import sys
import time
from dotenv import load_dotenv

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
load_dotenv(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../.env')))

from services.agent_service import AgentService
from schemas.chat import AgentRequest, ContextConfigurationDTO
from app import create_app

def workflow_long_streaming():
    """
    WORKFLOW 3: Long Context Streaming
    
    Target Flow:
    1. User asks for a long story.
    2. Stream should yield many chunks without error.
    3. Measure continuity and completion.
    """
    print("\n🚀 WORKFLOW: Long Streaming Stability")
    
    app = create_app()
    with app.app_context():
        service = AgentService()
        req = AgentRequest(
            session_id="wf-stream-long-001",
            user_id="wf-user-001",
            prompt="Write a 200 word story about a cat learning to code.",
            context_config=ContextConfigurationDTO()
        )
        
        print("\n⚡ Starting Long Stream...")
        start_time = time.time()
        chunk_count = 0
        total_len = 0
        
        try:
            for chunk in service.stream_agent(req):
                # Ignore metadata lines for verify
                if chunk.startswith("__METADATA__"):
                    continue
                
                chunk_count += 1
                total_len += len(chunk)
                
                # Visual feedback every 10 chunks
                if chunk_count % 10 == 0:
                    sys.stdout.write(f"[{total_len} chars]")
                    sys.stdout.flush()
            
            print("\n")
            duration = time.time() - start_time
            print(f"✅ Stream Complete in {duration:.2f}s")
            print(f"   Total Chunks: {chunk_count}")
            print(f"   Total Length: {total_len} chars")
            
            if total_len > 100:
                print("✅ Workflow Successful: Long content streamed.")
            else:
                print("❌ Workflow Failed: Content too short.")
                
        except Exception as e:
            print(f"\n❌ Stream Interrupted: {e}")

if __name__ == "__main__":
    workflow_long_streaming()
