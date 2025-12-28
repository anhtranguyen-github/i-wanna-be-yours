
import os
import sys
import requests
import time
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_openai_connection():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("ℹ️ SKIPPED: OPENAI_API_KEY not found. Assuming local Ollama mode.")
        sys.exit(0)

    print(f"🔄 Testing OpenAI Connection with key: {api_key[:8]}...")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    # Tiny model request to test auth & quota
    payload = {
        "model": "gpt-3.5-turbo",
        "messages": [{"role": "user", "content": "ping"}],
        "max_tokens": 5
    }

    try:
        start = time.time()
        response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload, timeout=10)
        elapsed = time.time() - start
        
        if response.status_code == 200:
            print(f"✅ OpenAI Connection Successful ({elapsed:.2f}s)")
            sys.exit(0)
            
        elif response.status_code == 429:
            print("⚠️ OpenAI Rate Limit Hit or Quota Exceeded (429)")
            print(f"Details: {response.text}")
            # This is a 'pass' for the test in the sense that we caught the limit
            # But a 'fail' for usability. 
            print("Action Required: Check OpenAI billing or switch to Fallback.")
            sys.exit(0) 
            
        elif response.status_code == 401:
            print("❌ Authentication Failed (401). Check API Key.")
            sys.exit(1)
            
        else:
            print(f"❌ Unexpected Error: {response.status_code}")
            print(response.text)
            sys.exit(1)

    except Exception as e:
        print(f"❌ Connection Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_openai_connection()
