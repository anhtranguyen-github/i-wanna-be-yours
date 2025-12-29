
import os
import subprocess
import time
import socket
import sys
import requests
import signal

# Configuration
FLASK_PORT = 5100
HANA_PORT = 5400
HOST = "localhost"
FLASK_URL = f"http://{HOST}:{FLASK_PORT}"
HANA_URL = f"http://{HOST}:{HANA_PORT}"
WORKFLOW_SCRIPT = "backend/hanachan/test/workflows/workflow_comprehensive_chat.py"
PYTHON_CMD_HANA = "backend/hanachan/.venv/bin/python" 
PYTHON_CMD_FLASK = "backend/flask/.venv/bin/python" 
WORKFLOW_PYTHON = "backend/hanachan/.venv/bin/python"
def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex((HOST, port)) == 0

def start_flask():
    print(f"🚀 [System] Starting Flask (Resources) on Port {FLASK_PORT}...")
    env = os.environ.copy()
    env["FLASK_PORT"] = str(FLASK_PORT)
    env["MONGO_URI_FLASK"] = "mongodb://localhost:27017/flaskFlashcardDB"
    
    cmd = [PYTHON_CMD_FLASK, "backend/flask/server.py"]
    # Inherit stdout/stderr to see Flask logs in console
    return subprocess.Popen(cmd, env=env, stdout=None, stderr=None, preexec_fn=os.setsid)

def start_hanachan():
    print(f"🚀 [System] Starting Hanachan (Agent) on Port {HANA_PORT}...")
    env = os.environ.copy()
    env["FLASK_PORT"] = str(HANA_PORT)
    db_path = os.path.abspath("backend/hanachan/instance/test_system.db")
    env["DATABASE_URL"] = f"sqlite:///{db_path}"
    env["MONGO_URI"] = "mongodb://localhost:27017/flaskFlashcardDB"
    env["ENABLE_MONGO"] = "true" 
    
    cmd = [PYTHON_CMD_HANA, "backend/hanachan/app.py"]
    # Inherit stdout/stderr to see Hanachan logs in console
    return subprocess.Popen(cmd, env=env, stdout=None, stderr=None, preexec_fn=os.setsid)

def wait_for_health(url, name, timeout=60):
    start_time = time.time()
    print(f"⏳ [System] Waiting for {name} health ({url})...")
    while time.time() - start_time < timeout:
        try:
            response = requests.get(f"{url}/health", timeout=5)
            if response.status_code == 200:
                print(f"✅ [System] {name} is Ready!")
                return True
        except requests.RequestException:
            pass
        time.sleep(1)
    return False

def run_client_simulation():
    print(f"\n🎬 [System] Running Client Simulation: {WORKFLOW_SCRIPT}")
    env = os.environ.copy()
    env["PYTHONUNBUFFERED"] = "1"
    env["PYTHONPATH"] = "backend/hanachan"
    env["FLASK_URL"] = FLASK_URL
    env["HANA_URL"] = HANA_URL
    db_path = os.path.abspath("backend/hanachan/instance/test_system.db")
    env["DATABASE_URL"] = f"sqlite:///{db_path}"
    env["MONGO_URI"] = "mongodb://localhost:27017/flaskFlashcardDB"
    
    result = subprocess.run(
        [WORKFLOW_PYTHON, WORKFLOW_SCRIPT],
        env=env,
        capture_output=False
    )
    return result.returncode

def main():
    flask_p = None
    hana_p = None

    try:
        # 1. Start Flask
        if not is_port_in_use(FLASK_PORT):
            flask_p = start_flask()
            if not wait_for_health(FLASK_URL, "Flask"): return 1
        else:
            print(f"ℹ️  [System] Flask running on {FLASK_PORT}.")

        # 2. Start Hanachan
        if not is_port_in_use(HANA_PORT):
            hana_p = start_hanachan()
            if not wait_for_health(HANA_URL, "Hanachan"): return 1
        else:
            print(f"ℹ️  [System] Hanachan running on {HANA_PORT}.")

        # 2. Run Client
        exit_code = run_client_simulation()
        
        if exit_code == 0:
            print("\n🎉 [System] Comprehensive System Test PASSED.")
        else:
            print("\nFAILED [System] Client Simulation Failed.")
            sys.exit(exit_code)

    finally:
        # 3. Cleanup
        print("\n🧹 [System] Stopping Services...")
        if flask_p:
            try:
                os.killpg(os.getpgid(flask_p.pid), signal.SIGTERM)
                print("   Flask Stopped.")
            except: pass
        if hana_p:
            try:
                os.killpg(os.getpgid(hana_p.pid), signal.SIGTERM)
                print("   Hanachan Stopped.")
            except: pass

if __name__ == "__main__":
    main()
