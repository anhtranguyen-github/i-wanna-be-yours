import requests
import json
import time

BASE_URL = "http://localhost:5400"

def test_agent():
    print("\nTesting Agent Endpoints...")
    payload = {
        "session_id": "test-session-" + str(int(time.time())),
        "user_id": "test-user-123",
        "prompt": "Hello Hanachan, please create a study plan for me."
    }
    
    try:
        print("POST /agent/invoke : ", end="")
        resp = requests.post(f"{BASE_URL}/agent/invoke", json=payload, timeout=120)
        if resp.status_code == 200:
            print("OK")
            print(json.dumps(resp.json(), indent=2, ensure_ascii=False))
        else:
            print(f"FAILED ({resp.status_code}) - {resp.text}")
    except Exception as e:
        print(f"ERROR: {str(e)}")

if __name__ == "__main__":
    test_agent()
