import requests
import json
import time

BASE_URL = "http://127.0.0.1:5000"

def log(msg, status="INFO"):
    colors = {
        "INFO": "\033[94m",
        "PASS": "\033[92m",
        "FAIL": "\033[91m",
        "END": "\033[0m"
    }
    print(f"{colors.get(status, '')}[{status}] {msg}{colors['END']}")

def test_endpoints():
    try:
        # 1. Health Check
        log("Testing Health Check...", "INFO")
        try:
            r = requests.get(f"{BASE_URL}/health")
            if r.status_code == 200:
                log("Health Check Passed", "PASS")
            else:
                log(f"Health Check Failed: {r.status_code}", "FAIL")
        except:
             log("Health Check Failed: Connection Error", "FAIL")

        # 2. Resources CRUD
        log("\nTesting Resources CRUD...", "INFO")
        
        # Create
        res_payload = {
            "title": "E2E Test Doc",
            "type": "document",
            "content": "Content for testing"
        }
        r = requests.post(f"{BASE_URL}/resources/", json=res_payload)
        if r.status_code == 201:
            res_id = r.json()['id']
            log("Create Resource Passed", "PASS")
        else:
            log(f"Create Resource Failed: {r.text}", "FAIL")
            res_id = None

        # List
        r = requests.get(f"{BASE_URL}/resources/")
        if r.status_code == 200 and len(r.json()) > 0:
            log("List Resources Passed", "PASS")
        else:
            log(f"List Resources Failed: {r.text}", "FAIL")

        # 3. Agent Invoke
        log("\nTesting Agent Invoke...", "INFO")
        agent_payload = {
            "sessionId": "e2e-session-1",
            "userId": "user-e2e",
            "prompt": "Hello e2e",
            "contextConfiguration": {
                "modelName": "gpt-4",
                "resourceIds": [res_id] if res_id else []
            },
            "history": []
        }
        # Note: Pydantic expects snake_case in schema definition if not aliased? 
        # Schema definition showed snake_case keys for fields.
        # Let's try sending valid JSON that matches Pydantic expectations.
        # If schema field is `session_id`, usually JSON key `session_id` works unless AliasGenerator used.
        # verify_agent_flow.py used snake_case keys. Let's stick to that to start.
        agent_payload_snake = {
            "session_id": "e2e-session-1",
            "user_id": "user-e2e",
            "prompt": "Make me a flashcard", 
            "context_config": {
                "model_name": "gpt-4",
                "resource_ids": [res_id] if res_id else []
            },
            "history": []
        }
        
        r = requests.post(f"{BASE_URL}/agent/invoke", json=agent_payload_snake)
        if r.status_code == 200:
            resp_data = r.json()
            if len(resp_data.get('responses', [])) > 0 and resp_data['responses'][0]['type'] == 'flashcard':
                log("Agent Invoke (Flashcard Mock) Passed", "PASS")
            else:
                log(f"Agent Invoke (Flashcard Mock) Failed: No flashcard in response", "FAIL")
        else:
            log(f"Agent Invoke Failed: {r.text}", "FAIL")

        # 4. Conversations
        log("\nTesting Conversations...", "INFO")
        # Create
        conv_payload = {"userId": "user-e2e", "title": "E2E Conv"}
        r = requests.post(f"{BASE_URL}/conversations/", json=conv_payload)
        if r.status_code == 201:
            conv_id = r.json()['id']
            log("Create Conversation Passed", "PASS")
        else:
            log(f"Create Conversation Failed: {r.text}", "FAIL")
            conv_id = None
            
        if conv_id:
            # Add Message w/ Attachments
            msg_payload = {
                "role": "user",
                "content": "Test Msg",
                "attachmentIds": [res_id] if res_id else []
            }
            r = requests.post(f"{BASE_URL}/conversations/{conv_id}/messages", json=msg_payload)
            if r.status_code == 201:
                log("Add Message Passed", "PASS")
            else:
                log(f"Add Message Failed: {r.text}", "FAIL")

            # Get Details
            r = requests.get(f"{BASE_URL}/conversations/{conv_id}")
            if r.status_code == 200:
                hist = r.json().get('history', [])
                if len(hist) > 0:
                    log("Get Conversation History Passed", "PASS")
                else:
                    log("Get Conversation History Failed (Empty)", "FAIL")
            else:
                log("Get Conversation Details Failed", "FAIL")

    except Exception as e:
        log(f"Exception during testing: {e}", "FAIL")

if __name__ == "__main__":
    # Wait a sec for server if just started (User already running it though)
    time.sleep(1)
    test_endpoints()
