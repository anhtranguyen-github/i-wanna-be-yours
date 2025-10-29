import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from motor.motor_asyncio import AsyncIOMotorClient
from mcp_service import mcp # Import the FastMCP server instance

# Load environment variables
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles MongoDB connection startup and shutdown using FastAPI's lifespan manager.
    This ensures the asynchronous client is available and correctly closed.[3]
    """
    print("Connecting to MongoDB...")
    
    # Motor client connection (Async)
    app.state.mongodb_client = AsyncIOMotorClient(MONGO_URI)
    
    # Test connection: ping the database
    try:
        await app.state.mongodb_client.admin.command('ping')
        print("MongoDB connection successful.")
    except Exception as e:
        print(f"MongoDB connection failed: {e}")
        
    yield # Application startup completes
    
    # Shutdown logic
    app.state.mongodb_client.close()
    print("MongoDB connection closed.")


# Initialize FastAPI app with the lifespan manager
app = FastAPI(
    title="Japanese Dictionary Context Server",
    description="Provides asynchronous lexical lookups via MCP.",
    lifespan=lifespan
)

# --- Mount the FastMCP Server ---
# We mount the streamable HTTP endpoint to a path, making it accessible to MCP clients.
app.mount("/mcp", mcp.streamable_http_app())

# Basic health check endpoint
@app.get("/")
async def root():
    return {"status": "ok", "service": "Japanese MCP Server", "version": mcp.version}

# Optional: Add the MCP resource manifest path for clients to discover tools
@app.get("/mcp/mcp")
async def get_mcp_manifest(request: Request):
    # This redirects clients to the standard FastMCP manifest endpoint
    return mcp.streamable_http_app()(request)

if __name__ == "__main__":
    import uvicorn
    # Run Uvicorn with the FastAPI application
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)