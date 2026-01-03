import os
import sys
import logging
from dotenv import load_dotenv

# Setup path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

# Load env from hanachan root
load_dotenv(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../.env')))

from services.llm_factory import ModelFactory
from langchain_core.messages import HumanMessage

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_openai_direct_connect():
    """
    Test 1: Verify Direct Connection to OpenAI via ModelFactory
    """
    print("\n--- TEST: OpenAI Connection ---")
    
    provider = os.environ.get("LLM_PROVIDER")
    print(f"Current Provider in .env: {provider}")
    
    if provider != "openai":
        print("⚠️  Warning: LLM_PROVIDER is not set to 'openai'. Test might use a different model.")
    
    try:
        model = ModelFactory.create_chat_model()
        print(f"✅ Model Created: {model}")
        
        msg = HumanMessage(content="Hello, are you online? Reply with 'Yes'")
        print(f"📤 Sending: {msg.content}")
        
        response = model.invoke([msg])
        print(f"📥 Received: {response.content}")
        
        if response.content:
            print("✅ OpenAI Connection Successful")
        else:
            print("❌ Empty response")

    except Exception as e:
        print(f"❌ Connection Failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_openai_direct_connect()
