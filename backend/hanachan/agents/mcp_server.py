import random
from typing import Dict, Any
from pymongo import MongoClient
from mcp.server.fastmcp import FastMCP

# Config
MONGO_URI = "mongodb://127.0.0.1:27017"
DB_NAME = "zenRelationshipsAutomated"
GRAMMAR_COLLECTION = "grammars"

# MongoDB
client = MongoClient(MONGO_URI)
db = client[DB_NAME]

# MCP Server
mcp = FastMCP("ZenGrammarTutor")

@mcp.tool()
def explain_grammar(title: str) -> Dict[str, Any]:
    """Explain a Japanese grammar pattern with details and JLPT level."""
    doc = db[GRAMMAR_COLLECTION].find_one({"title": {"$regex": title, "$options": "i"}})
    if not doc:
        return {"success": False, "error": f"Grammar '{title}' not found"}
    
    
    print("[DEBUG] MCP server [explain_grammar] is alive and ready", file=sys.stderr)

    return {
        "success": True,
        "title": doc["title"],
        "short_explanation": doc.get("short_explanation"),
        "long_explanation": doc.get("long_explanation"),
        "formation": doc.get("formation"),
        "jlpt_level": doc.get("p_tag"),
        "examples_count": len(doc.get("examples", []))
    }

@mcp.tool()
def get_examples(title: str, count: int = 3) -> Dict[str, Any]:
    """Get example sentences for a Japanese grammar pattern with translations."""
    doc = db[GRAMMAR_COLLECTION].find_one({"title": {"$regex": title, "$options": "i"}})
    if not doc or "examples" not in doc:
        return {"success": False, "error": f"No examples for '{title}'"}
    
    examples = random.sample(doc["examples"], min(count, len(doc["examples"])))
    print("[DEBUG] MCP server [get_examples] is alive and ready", file=sys.stderr)

    return {
        "success": True,
        "title": doc["title"],
        "examples": [
            {
                "japanese": ex["jp"],
                "romaji": ex.get("romaji"),
                "english": ex["en"]
            }
            for ex in examples
        ]
    }

@mcp.tool()
def random_grammar() -> Dict[str, Any]:
    """Get a random Japanese grammar point to study."""
    count = db[GRAMMAR_COLLECTION].count_documents({})
    if count == 0:
        return {"success": False, "error": "No grammar data"}
    
    skip = random.randint(0, count - 1)
    doc = db[GRAMMAR_COLLECTION].find().skip(skip).limit(1).next()
    print("[DEBUG] MCP server [random_grammar] is alive and ready", file=sys.stderr)   
    return {
        "success": True,
        "title": doc["title"],
        "short_explanation": doc.get("short_explanation"),
        "jlpt_level": doc.get("p_tag")
    }

if __name__ == "__main__":
    mcp.run()