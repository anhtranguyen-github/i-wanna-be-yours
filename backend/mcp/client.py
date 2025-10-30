import socket
import json
import logging

logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")
logger = logging.getLogger("Client")

HOST = "127.0.0.1"
PORT = 8765

def send_request(tool_name: str, params: dict = None):
    """Send MCP request to TCP server."""
    request = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": params or {}
        }
    }
    
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.connect((HOST, PORT))
        
        # Send request
        message = json.dumps(request) + "\n"
        sock.sendall(message.encode())
        logger.info(f"📤 Sent: {tool_name}")
        
        # Receive response
        response = b""
        while True:
            chunk = sock.recv(4096)
            if not chunk:
                break
            response += chunk
            if b"\n" in response:
                break
        
        sock.close()
        
        # Parse response
        result = json.loads(response.decode().strip())
        if "result" in result:
            print(json.dumps(result["result"], ensure_ascii=False, indent=2))
        elif "error" in result:
            logger.error(f"❌ Error: {result['error']}")
        
    except Exception as e:
        logger.error(f"❌ Failed: {e}")


if __name__ == "__main__":
    logger.info("🚀 Testing MCP tools...")
    
    print("\n" + "="*50)
    print("TEST 1: Explain Grammar")
    print("="*50)
    send_request("explain_grammar", {"title": "A うが B うが"})
    
    print("\n" + "="*50)
    print("TEST 2: Get Examples")
    print("="*50)
    send_request("get_examples", {"title": "A うが B うが", "count": 3})
    
    print("\n" + "="*50)
    print("TEST 3: Random Grammar")
    print("="*50)
    send_request("random_grammar")
    
    logger.info("✅ Done")