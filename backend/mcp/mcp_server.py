import logging
import random
import socket
import json
from typing import Dict, Any
from pymongo import MongoClient

# -------------------------------
# Configuration
# -------------------------------
MONGO_URI = "mongodb://127.0.0.1:27017"
DB_NAME = "zenRelationshipsAutomated"
GRAMMAR_COLLECTION = "grammars"
HOST = "127.0.0.1"
PORT = 8765

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("ZenGrammarTutorMCP")

# -------------------------------
# MongoDB Connection
# -------------------------------
try:
    mongo_client = MongoClient(MONGO_URI)
    db = mongo_client[DB_NAME]
    logger.info(f"✅ Connected to MongoDB: {MONGO_URI}, database: {DB_NAME}")
except Exception as e:
    logger.error(f"❌ MongoDB connection failed: {e}")
    raise

# -------------------------------
# Tool Functions
# -------------------------------
def explain_grammar(title: str) -> Dict[str, Any]:
    """Provide detailed explanation for a specific grammar pattern."""
    logger.info(f"🔍 explain_grammar called with title: {title}")

    doc = db[GRAMMAR_COLLECTION].find_one({"title": {"$regex": title, "$options": "i"}})
    if not doc:
        logger.warning(f"No grammar found for '{title}'")
        return {"success": False, "error": f"No grammar found for '{title}'."}

    logger.info(f"✅ Found grammar: {doc['title']} ({doc.get('p_tag')})")

    return {
        "success": True,
        "type": "grammar_explanation",
        "title": doc["title"],
        "short_explanation": doc.get("short_explanation"),
        "long_explanation": doc.get("long_explanation"),
        "formation": doc.get("formation"),
        "jlpt_level": doc.get("p_tag"),
        "examples_available": len(doc.get("examples", []))
    }

def get_examples(title: str, count: int = 3) -> Dict[str, Any]:
    """Return example sentences for a grammar pattern."""
    logger.info(f"🎓 get_examples called for '{title}', count={count}")

    doc = db[GRAMMAR_COLLECTION].find_one({"title": {"$regex": title, "$options": "i"}})
    if not doc or "examples" not in doc:
        logger.warning(f"No examples found for '{title}'")
        return {"success": False, "error": f"No examples found for '{title}'."}

    examples = random.sample(doc["examples"], min(count, len(doc["examples"])))
    logger.info(f"📚 Returning {len(examples)} examples for {doc['title']}")

    formatted_examples = [
        {
            "jp": ex["jp"],
            "romaji": ex.get("romaji"),
            "en": ex["en"],
            "audio": ex.get("grammar_audio")
        }
        for ex in examples
    ]

    return {
        "success": True,
        "type": "grammar_examples",
        "title": doc["title"],
        "examples": formatted_examples
    }

def random_grammar() -> Dict[str, Any]:
    """Return a random grammar point for study suggestion."""
    logger.info("🎲 random_grammar tool invoked")

    count = db[GRAMMAR_COLLECTION].count_documents({})
    if count == 0:
        return {"success": False, "error": "No grammar data available."}

    skip = random.randint(0, count - 1)
    doc = db[GRAMMAR_COLLECTION].find().skip(skip).limit(1).next()
    logger.info(f"🎯 Selected random grammar: {doc['title']}")

    return {
        "success": True,
        "title": doc["title"],
        "short_explanation": doc.get("short_explanation"),
        "jlpt_level": doc.get("p_tag"),
        "example_count": len(doc.get("examples", []))
    }

# -------------------------------
# Tool Router
# -------------------------------
TOOLS = {
    "explain_grammar": explain_grammar,
    "get_examples": get_examples,
    "random_grammar": random_grammar
}

def handle_request(request_data: dict) -> dict:
    """Handle incoming MCP tool request."""
    try:
        method = request_data.get("method")
        params = request_data.get("params", {})
        
        if method == "tools/call":
            tool_name = params.get("name")
            arguments = params.get("arguments", {})
            
            if tool_name in TOOLS:
                result = TOOLS[tool_name](**arguments)
                return {
                    "jsonrpc": "2.0",
                    "id": request_data.get("id"),
                    "result": result
                }
            else:
                return {
                    "jsonrpc": "2.0",
                    "id": request_data.get("id"),
                    "error": {"code": -32601, "message": f"Tool not found: {tool_name}"}
                }
        else:
            return {
                "jsonrpc": "2.0",
                "id": request_data.get("id"),
                "error": {"code": -32601, "message": f"Method not supported: {method}"}
            }
    except Exception as e:
        logger.error(f"Error handling request: {e}")
        return {
            "jsonrpc": "2.0",
            "id": request_data.get("id"),
            "error": {"code": -32603, "message": str(e)}
        }

# -------------------------------
# TCP Server
# -------------------------------
def start_server():
    """Start TCP server to handle MCP requests."""
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server_socket.bind((HOST, PORT))
    server_socket.listen(5)
    
    logger.info(f"🚀 Server listening on {HOST}:{PORT}")
    
    try:
        while True:
            client_socket, address = server_socket.accept()
            logger.info(f"📥 Connection from {address}")
            
            try:
                # Receive request
                data = b""
                while True:
                    chunk = client_socket.recv(4096)
                    if not chunk:
                        break
                    data += chunk
                    if b"\n" in data:
                        break
                
                if data:
                    request = json.loads(data.decode().strip())
                    logger.info(f"📨 Request: {request.get('method')} - {request.get('params', {}).get('name')}")
                    
                    # Handle request
                    response = handle_request(request)
                    
                    # Send response
                    response_data = json.dumps(response) + "\n"
                    client_socket.sendall(response_data.encode())
                    logger.info(f"📤 Response sent")
                
            except Exception as e:
                logger.error(f"Error handling client: {e}")
            finally:
                client_socket.close()
                
    except KeyboardInterrupt:
        logger.info("🛑 Server stopped manually.")
    finally:
        server_socket.close()

# -------------------------------
# Server Start
# -------------------------------
if __name__ == "__main__":
    start_server()