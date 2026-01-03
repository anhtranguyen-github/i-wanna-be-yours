import requests
import json
import time

BASE_URL = "http://localhost:5400"

def test_stream():
    print("\nTesting Agent Stream...")
    payload = {
        "session_id": "stream-session-" + str(int(time.time())),
        "user_id": "test-user-123",
        "prompt": "Hello Hanachan, are you ready?"
    }
    
    try:
        print("POST /agent/stream : ")
        resp = requests.post(f"{BASE_URL}/agent/stream", json=payload, stream=True, timeout=120)
        if resp.status_code == 200:
            for chunk in resp.iter_content(chunk_size=None):
                if chunk:
                    print(f"Chunk: {repr(chunk.decode('utf-8'))}")
        else:
            print(f"FAILED ({resp.status_code}) - {resp.text}")
    except Exception as e:
        print(f"ERROR: {str(e)}")

if __name__ == "__main__":
    test_stream()
