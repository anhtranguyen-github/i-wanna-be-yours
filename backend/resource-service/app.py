import os
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s : %(message)s",
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

def create_app() -> FastAPI:
    app = FastAPI(
        title="Neural Resource Service (NRS)",
        description="Unified Async Service for Resource Management and RAG Ingestion",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc"
    )
    
    # CORS configuration
    allowed_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Middleware for logging/scoping if needed
    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        logger.info(f"Incoming request: {request.method} {request.url.path}")
        response = await call_next(request)
        return response

    # Register Blueprints (FastAPI Routers)
    from routes.resource_routes import router as resource_router
    app.include_router(resource_router)

    @app.get("/health")
    async def health():
        return {"status": "healthy", "service": "resource-service-async"}

    @app.get("/")
    async def index():
        return {"message": "Neural Resource Service API (FastAPI)"}
        
    return app

app = create_app()

if __name__ == '__main__':
    import uvicorn
    port = int(os.environ.get('PORT', 5300))
    logger.info(f"🚀 Neural Resource Service (Async) starting on port {port}")
    uvicorn.run(app, host='0.0.0.0', port=port)
