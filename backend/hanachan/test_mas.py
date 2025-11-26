import requests
import json
import sys

def test_mas_stream():
    url = "http://localhost:5400/chat/stream"
    payload = {
        "query": "Watashi wa sushi ga suki desu.",
        "thinking": True,
        "conversation_id": "test_mas_123",
        "user_id": "test_user"
    }
    
    print(f"Testing MAS Stream: {url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(url, json=payload, stream=True)
        response.raise_for_status()
        
        print("\n--- Response Stream ---")
        for chunk in response.iter_content(chunk_size=None):
            if chunk:
                print(chunk.decode('utf-8'), end='', flush=True)
        print("\n-----------------------")
        
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_mas_stream()
