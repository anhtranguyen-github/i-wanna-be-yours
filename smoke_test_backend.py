import requests
import json

BASE_URL = "http://localhost:5400"

def test_linguistics():
    print("Testing Linguistics Endpoints...")
    endpoints = [
        ("/d-api/v1/parse-tree", {"text": "私は猫が好きです。"}),
        ("/d-api/v1/translate", {"text": "私は猫が好きです。"}),
        ("/d-api/v1/convert/all", {"text": "私"})
    ]
    
    for route, payload in endpoints:
        try:
            print(f"POST {route} : ", end="")
            resp = requests.post(f"{BASE_URL}{route}", json=payload, timeout=90)
            if resp.status_code == 200:
                print("OK")
            else:
                print(f"FAILED ({resp.status_code}) - {resp.text}")
        except Exception as e:
            print(f"ERROR: {str(e)}")

def test_agent():
    print("\nTesting Agent Endpoints...")
    payload = {
        "session_id": "test-session",
        "user_id": "test-user",
        "prompt": "Hello Hanachan!"
    }
    
    try:
        print("POST /agent/invoke : ", end="")
        resp = requests.post(f"{BASE_URL}/agent/invoke", json=payload, timeout=120)
        if resp.status_code == 200:
            print("OK")
        else:
            print(f"FAILED ({resp.status_code}) - {resp.text}")
    except Exception as e:
        print(f"ERROR: {str(e)}")

if __name__ == "__main__":
    test_linguistics()
    test_agent()
