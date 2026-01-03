import os
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Request, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import FileResponse
from database.mongo import get_db
from tasks.ingestion import ingest_resource_task
from services.vector_store_service import VectorStoreService
from .auth_middleware import get_current_user
from utils.file_utils import calculate_file_hash, get_resource_type
from bson.objectid import ObjectId
from rq import Queue
from redis import Redis

router = APIRouter(prefix="/v1/resources", tags=["resources"])

# Configuration
UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER", "/app/uploads")
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB limit
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Shared Redis Connection
redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
redis_conn = Redis.from_url(redis_url)
nrs_queue = Queue("nrs_ingestion", connection=redis_conn)

@router.post("/upload")
async def upload_resource(
    request: Request,
    file: UploadFile = File(...),
    auto_ingest: bool = Form(True),
    strategy: str = Form("recursive"),
    description: str = Form(""),
    user: dict = Depends(get_current_user)
):
    user_id = user.get("userId") or user.get("id")
    content = await file.read()
    
    # 0. File Size Check
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413, 
            detail=f"File too large. Max size: {MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    # 1. Duplicate Check (User-scoped)
    file_hash = calculate_file_hash(content)
    db = get_db()
    
    existing = await db.resources.find_one({
        "userId": user_id, 
        "fileHash": file_hash, 
        "deletedAt": None
    })
    
    if existing:
        return {
            "id": str(existing["_id"]),
            "title": existing["title"],
            "status": existing.get("ingestionStatus", "completed"),
            "duplicate": True
        }
    
    # 2. Save to Disk
    filename = file.filename
    unique_id = str(uuid.uuid4())[:8]
    date_path = datetime.now().strftime("%Y/%m")
    save_dir = os.path.join(UPLOAD_FOLDER, date_path)
    os.makedirs(save_dir, exist_ok=True)
    
    unique_filename = f"{unique_id}_{filename}"
    file_path = os.path.join(save_dir, unique_filename)
    
    with open(file_path, "wb") as f:
        f.write(content)
    
    relative_path = os.path.join(date_path, unique_filename)

    # 3. Save Metadata
    resource_doc = {
        "userId": user_id,
        "title": filename,
        "description": description,
        "type": get_resource_type(filename),
        "mimeType": file.content_type,
        "filePath": relative_path,
        "fileSize": len(content),
        "fileHash": file_hash,
        "ingestionStatus": "pending",
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc),
        "deletedAt": None
    }
    
    result = await db.resources.insert_one(resource_doc)
    resource_id = str(result.inserted_id)

    # 4. Trigger Ingestion
    if auto_ingest:
        nrs_queue.enqueue(ingest_resource_task, resource_id=resource_id, strategy=strategy)

    return {
        "id": resource_id,
        "title": filename,
        "status": "pending",
        "autoIngest": auto_ingest
    }

@router.get("/")
async def list_resources(
    type: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    user_id = user.get("userId") or user.get("id")
    db = get_db()
    query = {"userId": user_id, "deletedAt": None}
    if type:
        query["type"] = type
        
    cursor = db.resources.find(query).sort("createdAt", -1)
    
    output = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        output.append(doc)
        
    return output

@router.get("/{resource_id}/download")
async def download_resource(
    resource_id: str,
    user: dict = Depends(get_current_user)
):
    user_id = user.get("userId") or user.get("id")
    role = user.get("role")
    
    db = get_db()
    query = {"_id": ObjectId(resource_id), "deletedAt": None}
    if role not in ["admin", "ingestion_worker"]:
        query["userId"] = user_id
        
    res = await db.resources.find_one(query)
    if not res:
        raise HTTPException(status_code=404, detail="Resource not found")
        
    file_path = os.path.join(UPLOAD_FOLDER, res["filePath"])
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Physical file missing")
        
    return FileResponse(
        path=file_path,
        filename=res.get("originalFilename", res["title"]),
        media_type=res["mimeType"]
    )

@router.get("/{resource_id}/meta")
async def get_resource_metadata(
    resource_id: str,
    user: dict = Depends(get_current_user)
):
    user_id = user.get("userId") or user.get("id")
    db = get_db()
    res = await db.resources.find_one({"_id": ObjectId(resource_id), "userId": user_id, "deletedAt": None})
    if not res:
        raise HTTPException(status_code=404, detail="Resource not found")
        
    res["id"] = str(res.pop("_id"))
    return res

@router.post("/search")
async def search_resources(
    query: str = Form(...),
    resource_ids: Optional[List[str]] = Form(None),
    limit: int = Form(5),
    user: dict = Depends(get_current_user)
):
    user_id = user.get("userId") or user.get("id")
    vector_store = VectorStoreService()
    results = await vector_store.search(query, user_id, resource_ids=resource_ids, k=limit)
    
    return [
        {"content": doc.page_content, "metadata": doc.metadata}
        for doc in results
    ]

@router.delete("/{resource_id}")
async def delete_resource(
    resource_id: str,
    user: dict = Depends(get_current_user)
):
    user_id = user.get("userId") or user.get("id")
    db = get_db()
    result = await db.resources.update_one(
        {"_id": ObjectId(resource_id), "userId": user_id},
        {"$set": {"deletedAt": datetime.now(timezone.utc)}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Resource not found")
        
    # Optional: We should also delete vectors from Qdrant
    vector_store = VectorStoreService()
    await vector_store.delete_by_resource(resource_id, user_id)
    
    return {"message": "Resource deleted", "id": resource_id}
