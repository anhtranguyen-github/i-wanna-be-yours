import requests
import sys

BASE_URL = "http://127.0.0.1:5000"

def test_static_files():
    print("Verifying Static Files...")
    
    files = [
        ("/", "text/html", "<title>AI Chat | Professional Interface</title>"),
        ("/static/css/styles.css", "text/css", ".sidebar"),
        ("/static/js/dashboard.js", "application/javascript", "async function init()")
    ]
    
    all_passed = True
    
    for relative_path, content_type, snippet in files:
        url = f"{BASE_URL}{relative_path}"
        try:
            r = requests.get(url)
            if r.status_code == 200:
                # Check for snippet
                if snippet in r.text:
                    print(f"PASS: {relative_path} found. ({len(r.content)} bytes)")
                else:
                    print(f"FAIL: {relative_path} found but snippet '{snippet}' missing.")
                    all_passed = False
            else:
                print(f"FAIL: {relative_path} returned {r.status_code}")
                all_passed = False
        except Exception as e:
            print(f"FAIL: {relative_path} connection error: {e}")
            all_passed = False
            
    if all_passed:
        print("\nAll UI assets verified successfully.")
        sys.exit(0)
    else:
        print("\nVerification failed.")
        sys.exit(1)

if __name__ == "__main__":
    test_static_files()
