
import os
import requests
import jwt
import time
import json
import uuid
from datetime import datetime

# Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your-development-secret-key")
HANACHAN_URL = "http://localhost:5400"
RESOURCES_URL = "http://localhost:5100"
FILE_PATH = "/mnt/c/Users/tra01/OneDrive/Desktop/Last dance/hanabira.org/2403.15466v1.pdf"
USER_ID = f"test-user-{int(time.time())}"

def generate_token():
    payload = {
        "userId": USER_ID,
        "id": USER_ID,
        "role": "user",
        "exp": int(time.time()) + 3600
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def test_upload(token):
    print(f"🚀 Uploading {FILE_PATH} for user {USER_ID}...")
    
    if not os.path.exists(FILE_PATH):
        print(f"❌ File {FILE_PATH} not found!")
        return None

    url = f"{RESOURCES_URL}/v1/resources/upload"
    headers = {"Authorization": f"Bearer {token}"}
    
    # We open file in binary mode
    with open(FILE_PATH, 'rb') as f:
        # requests.post files argument: {'fieldname': (filename, file_object, content_type)}
        files = {'file': (os.path.basename(FILE_PATH), f, 'application/pdf')}
        data = {'description': 'Test upload via script'}
        
        try:
            response = requests.post(url, headers=headers, files=files, data=data)
            if response.status_code == 201:
                res = response.json()
                print(f"✅ Upload successful! ID: {res['id']}")
                return res['id']
            else:
                print(f"❌ Upload failed ({response.status_code}): {response.text}")
                return None
        except Exception as e:
            print(f"❌ Connection error: {e}")
            return None

def trigger_ingest(token, resource_id):
    if not resource_id: return
    print(f"⚙️ Triggering ingestion for {resource_id}...")
    url = f"{HANACHAN_URL}/resource/ingest/{resource_id}"
    # Hanachan doesn't require auth for this internal endpoint currently? 
    # Wait, Hanachan doesn't use @login_required on this new route yet. 
    # But usually good practice. Let's send header anyway.
    headers = {"Authorization": f"Bearer {token}"}
    try:
        resp = requests.post(url, headers=headers)
        if resp.ok:
            data = resp.json()
            print(f"✅ Ingestion queued: {data}")
            return data.get('job_id')
        else:
            print(f"❌ Ingestion trigger failed: {resp.status_code} {resp.text}")
            return None
    except Exception as e:
        print(f"❌ Ingestion error: {e}")
        return None

def poll_ingestion(job_id):
    if not job_id: return False
    print(f"⏳ Polling status for job {job_id}...")
    url = f"{HANACHAN_URL}/resource/ingest/status/{job_id}"
    
    start_time = time.time()
    while time.time() - start_time < 120: # 2 minute timeout
        try:
            resp = requests.get(url) 
            if resp.ok:
                data = resp.json()
                status = data.get('status')
                if status == 'finished':
                    print(f"✅ Ingestion COMPLETED (Status: {status})")
                    return True
                elif status == 'failed':
                    print(f"❌ Ingestion FAILED (Status: {status})")
                    return False
                else:
                    print(f"   Status: {status}...")
            else:
                print(f"⚠️ Status check failed: {resp.status_code}")
        except Exception as e:
            print(f"⚠️ Polling error: {e}")
            
        time.sleep(2)
    
    print("❌ Ingestion timed out!")
    return False

def test_chat(token, resource_id):
    if not resource_id:
        print("⚠️ Skipping chat test due to missing resource ID.")
        return

    # No sleep needed, we polled!
    
    print("🚀 Starting chat session...")
    
    session_id = str(uuid.uuid4())
    url = f"{HANACHAN_URL}/agent/stream"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    prompt = "What is this paper about? Summarize the main contribution."
    
    payload = {
        "session_id": session_id,
        "user_id": USER_ID,
        "prompt": prompt,
        "context_config": {
            "resource_ids": [resource_id]
        }
    }
    
    print(f"❓ Asking: '{prompt}' with Resource ID {resource_id}")
    
    try:
        response = requests.post(url, headers=headers, json=payload, stream=True)
        if response.status_code != 200:
            print(f"❌ Chat failed ({response.status_code}): {response.text}")
            return
            
        print("✅ Receiving stream response:")
        full_text = ""
        for line in response.iter_lines():
            if line:
                decoded_line = line.decode('utf-8')
                if decoded_line.startswith("__METADATA__:"):
                    print(f"   [Metadata]: {decoded_line}")
                else:
                    full_text += decoded_line

        print(f"\n✅ Full Response Length: {len(full_text)}")
        print(f"✅ Response Preview: {full_text[:500]}...")
        
        if len(full_text) > 50:
            print("🚀 Test COMPLETE: Resource RAG verified!")
        else:
            print("⚠️ Response too short, ingestion might be slow or failed.")
            
    except Exception as e:
        print(f"❌ Chat validation error: {e}")

if __name__ == "__main__":
    print("=== Testing Resource Flow (Upload -> Ingest -> RAG) ===")
    token = generate_token()
    resource_id = test_upload(token)
    job_id = trigger_ingest(token, resource_id)
    if poll_ingestion(job_id):
        test_chat(token, resource_id)
    else:
        print("❌ Skipping chat test due to ingestion failure.")
