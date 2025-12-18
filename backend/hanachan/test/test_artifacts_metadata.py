
import requests
import json
import time

BASE_URL = "http://127.0.0.1:5400"

def log(msg, status="INFO"):
    colors = {
        "INFO": "\033[94m",
        "PASS": "\033[92m",
        "FAIL": "\033[91m",
        "END": "\033[0m"
    }
    print(f"{colors.get(status, '')}[{status}] {msg}{colors['END']}")

def test_metadata():
    log("Testing Artifact Metadata Persistence...", "INFO")
    
    # 1. Simulate Agent Invoke (Mock Agent should generate artifacts with sidebar metadata)
    agent_payload = {
        "session_id": "test-metadata-session",
        "user_id": "test-user-meta",
        "prompt": "debug", # "debug" triggers Mock Agent to return all supported artifacts with metadata
        "context_config": {
            "model_name": "gpt-4",
            "resource_ids": []
        }
    }
    
    try:
        r = requests.post(f"{BASE_URL}/agent/invoke", json=agent_payload)
        if r.status_code != 200:
            log(f"Agent Invoke Failed: {r.status_code} {r.text}", "FAIL")
            return

        resp_data = r.json()
        responses = resp_data.get('responses', [])
        
        # Check if we got artifacts
        artifacts = [item for item in responses if item['type'] != 'text']
        if not artifacts:
            log("No artifacts returned from 'debug' prompt", "FAIL")
            return

        # Check for sidebar metadata in the RESPONSE (Phase 4 requirement)
        sidebar_found = False
        for art in artifacts:
            if 'sidebar' in art:
                sidebar_found = True
                log(f"Found sidebar metadata in agent response for {art['type']}: {art['sidebar']}", "PASS")
            
            # Also check if it has a responseId which maps to a database ID
            if 'responseId' in art:
                log(f"Artifact has persistence ID: {art['responseId']}", "PASS")
                
                # 2. Verify Persistence via Artifacts API (Phase 1/3 requirement)
                art_id = art['responseId']
                r_art = requests.get(f"{BASE_URL}/artifacts/{art_id}")
                if r_art.status_code == 200:
                    db_art = r_art.json()
                    # Check metadata in DB
                    db_meta = db_art.get('metadata', {})
                    # The service merges 'sidebar' into 'metadata' on creation? 
                    # Let's check agent_service.py again. 
                    # Yes: metadata=art.get("sidebar", {})
                    
                    if 'group' in db_meta and 'status' in db_meta:
                        log(f"Verified persistence of sidebar metadata in DB for {art_id}: {db_meta}", "PASS")
                    else:
                        log(f"DB Metadata missing sidebar fields! Got: {db_meta}", "FAIL")
                else:
                    log(f"Failed to fetch artifact {art_id} from API", "FAIL")

        if not sidebar_found:
            log("No sidebar metadata found in any artifact response", "FAIL")

    except Exception as e:
        log(f"Exception: {e}", "FAIL")

if __name__ == "__main__":
    time.sleep(2) # Give services a moment
    test_metadata()
