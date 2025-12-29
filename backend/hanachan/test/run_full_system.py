
import os
import subprocess
import time
import socket
import sys
import requests
import signal

# Configuration
PORT = 5100
HOST = "localhost"
BASE_URL = f"http://{HOST}:{PORT}"
WORKFLOW_SCRIPT = "backend/hanachan/test/workflows/workflow_comprehensive_chat.py"
PYTHON_CMD = "backend/hanachan/.venv/bin/python"  # Adjust if needed for relative path

def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex((HOST, port)) == 0

def start_backend():
    print(f"🚀 [System] Starting Backend on Port {PORT}...")
    # Adjust path to where server.py is likely located relative to root
    # Assuming running from repo root
    cmd = [PYTHON_CMD, "backend/hanachan/server.py"]
    
    # Run in background
    process = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        preexec_fn=os.setsid # Create new process group for clean kill
    )
    return process

def wait_for_health(timeout=30):
    start_time = time.time()
    print("⏳ [System] Waiting for backend health...")
    while time.time() - start_time < timeout:
        try:
            # Try a simple endpoint
            response = requests.get(f"{BASE_URL}/health", timeout=1)
            if response.status_code == 200:
                print("✅ [System] Backend is Ready!")
                return True
        except requests.ConnectionError:
            pass
        time.sleep(1)
    return False

def run_client_simulation():
    print(f"\n🎬 [System] Running Client Simulation: {WORKFLOW_SCRIPT}")
    env = os.environ.copy()
    env["PYTHONPATH"] = "backend/hanachan" # Ensure imports work
    
    result = subprocess.run(
        [PYTHON_CMD, WORKFLOW_SCRIPT],
        env=env,
        capture_output=False # Let it print to stdout
    )
    return result.returncode

def main():
    backend_process = None
    started_by_script = False

    try:
        # 1. Check Backend
        if not is_port_in_use(PORT):
            backend_process = start_backend()
            started_by_script = True
            if not wait_for_health():
                print("❌ [System] Failed to start backend (Health Check Timeout)")
                return 1
        else:
            print(f"ℹ️  [System] Backend already running on port {PORT}. Using existing instance.")

        # 2. Run Client
        exit_code = run_client_simulation()
        
        if exit_code == 0:
            print("\n🎉 [System] Comprehensive System Test PASSED.")
        else:
            print("\nFAILED [System] Client Simulation Failed.")
            sys.exit(exit_code)

    finally:
        # 3. Cleanup
        if started_by_script and backend_process:
            print(f"\n🧹 [System] Stopping Backend (PID {backend_process.pid})...")
            os.killpg(os.getpgid(backend_process.pid), signal.SIGTERM)

if __name__ == "__main__":
    main()
