
import requests
import json
import time
import uuid

def test_real_flow():
    print("🚀 Starting Real OpenAI Integration Test...")
    
    session_id = f"real-test-{uuid.uuid4()}"
    payload = {
        "prompt": "Say 'Cognition initialized' if you can read this.",
        "session_id": session_id,
        "user_id": "test-user-999"
    }
    
    print(f"📡 Sending request to Hanachan (Session: {session_id})...")
    start_time = time.time()
    
    try:
        # Using stream endpoint
        response = requests.post(
            "http://localhost:5400/agent/stream",
            json=payload,
            stream=True,
            timeout=30
        )
        
        if response.status_code != 200:
            print(f"❌ Hanachan returned error: {response.status_code}")
            print(response.text)
            return
            
        full_text = ""
        print("📥 Receiving stream: ", end="", flush=True)
        for line in response.iter_lines():
            if line:
                chunk = line.decode('utf-8')
                full_text += chunk
                print(chunk, end="", flush=True)
        print("\n")
        
        elapsed = time.time() - start_time
        print(f"⏱️ Stream completed in {elapsed:.2f}s")
        
        if "Cognition initialized" in full_text:
            print("✅ OpenAI response verified.")
        else:
            print("⚠️ OpenAI response unexpected, check logs.")

        print("🔍 Verifying Background Task Enqueuing...")
        # Since it's async, we check if the worker picked it up.
        # We'll wait a few seconds and then check docker logs for the worker.
        print("⏳ Waiting 5s for background worker...")
        time.sleep(5)
        
        import subprocess
        logs = subprocess.check_output(["docker", "logs", "hanabiraorg-worker-1"]).decode('utf-8')
        
        if session_id in logs and "Finished processing interaction" in logs:
            print(f"✅ Background worker successfully processed {session_id}")
        else:
            print(f"❌ Background worker log NOT found for {session_id}")
            # Print last 10 lines of worker logs for debug
            print("--- Worker Last 10 Lines ---")
            print("\n".join(logs.splitlines()[-10:]))
            
    except Exception as e:
        print(f"❌ Test failed: {e}")

if __name__ == "__main__":
    test_real_flow()
