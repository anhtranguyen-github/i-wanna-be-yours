# Long-Run Testing Session Plan

## Overview
This plan outlines the implementation of a comprehensive long-run testing session for the Hanachan agent system with the Neural Resource Service (NRS).

## Test Configuration

### Environment Variables
```bash
LLM_PROVIDER=ollama
CHAT_MODEL=qwen2.5:0.5b
EMBEDDING_MODEL=nomic-embed-text
LTM_ENABLED=True
MOCK_LLM=False
```

### Test Parameters
| Parameter | Value |
|-----------|-------|
| Number of Users | 2 |
| Conversations per User | 1 (total 2 conversations) |
| Turns per Conversation | 15-20 |
| File Size Limit | 50MB |
| Duplicate Check | SHA256 hash |

---

## Phase 1: Environment Preparation

### 1.1 Clean Legacy Data
- [ ] Drop existing SQLite database (`hanachan.db`)
- [ ] Clear MongoDB `resources` collection for test users
- [ ] Delete Qdrant vectors for test users
- [ ] Clear Redis queues

### 1.2 Verify Infrastructure
- [ ] MongoDB running on `localhost:27017`
- [ ] Qdrant running on `localhost:6333`
- [ ] Redis running on `localhost:6379`
- [ ] Ollama Docker container running with `qwen2.5:0.5b` and `nomic-embed-text` models
- [ ] NRS API running on `localhost:5300`
- [ ] NRS Worker running

---

## Phase 2: Feature Implementation

### 2.1 File Size Limit (NRS)
**Location**: `backend/resource-service/routes/resource_routes.py`

```python
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

@router.post("/upload")
async def upload_resource(...):
    content = await file.read()
    
    # File size check
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413, 
            detail=f"File too large. Max size: {MAX_FILE_SIZE // (1024*1024)}MB"
        )
    ...
```

### 2.2 Duplicate Check via Hash (NRS)
**Already Implemented**: `backend/resource-service/routes/resource_routes.py` line 38-54

```python
# Current implementation uses SHA256 hash
file_hash = calculate_file_hash(content)
existing = await db.resources.find_one({
    "userId": user_id, 
    "fileHash": file_hash, 
    "deletedAt": None
})

if existing:
    return {
        "id": str(existing["_id"]),
        "status": existing.get("ingestionStatus", "completed"),
        "duplicate": True
    }
```

### 2.3 Legacy Data Handling
**Strategy**: Skip and throw general errors - do not attempt recovery

```python
# In simulation script
try:
    # Database operation
except Exception as e:
    logger.error(f"Legacy data error (skipped): {e}")
    continue  # Skip to next iteration
```

---

## Phase 3: Test Script Implementation

### 3.1 Multi-User Simulation Script
**File**: `backend/hanachan/scripts/long_run_multi_user.py`

```python
# User configurations
USERS = [
    {"id": "test-user-alpha", "resources": ["doc_a.pdf"]},
    {"id": "test-user-beta", "resources": ["doc_b.pdf"]}
]

# Test phases per user:
# 1. Resource Upload (with duplicate check)
# 2. Phase 1: Initial queries (5 turns)
# 3. Phase 2: Memory stretching (10 turns) 
# 4. Phase 3: Multi-resource integration (5 turns)
# 5. Audit: Verify STM, LTM, and resource awareness
```

### 3.2 Metrics Collection
- Response latency per turn
- Token throughput
- Memory usage (STM summary length)
- LTM retrieval success rate
- Resource context hit rate

---

## Phase 4: Execution Steps

### Step 1: Clean Environment
```bash
cd backend/hanachan
rm -f hanachan.db

# Clear MongoDB test data
mongosh --eval 'db.resources.deleteMany({userId: {$in: ["test-user-alpha", "test-user-beta"]}})'

# Clear Redis
redis-cli FLUSHALL
```

### Step 2: Start Services
```bash
# Terminal 1: Start MongoDB
mongod --dbpath ./mongo_data --bind_ip_all --fork --logpath ./logs/mongo/mongo.log

# Terminal 2: Start Ollama
docker start ollama_fixed

# Terminal 3: Start NRS API
cd backend/resource-service
PYTHONPATH=. uv run python app.py

# Terminal 4: Start NRS Worker
cd backend/resource-service
PYTHONPATH=. uv run python worker.py

# Terminal 5: Start Hanachan Worker (for summarization)
cd backend/hanachan
uv run ./run_worker.sh
```

### Step 3: Execute Test
```bash
cd backend/hanachan
LTM_ENABLED=True uv run python scripts/long_run_multi_user.py
```

### Step 4: Audit Results
```bash
# Check conversation states
uv run python scripts/backdoor_debug.py chat <session_id_1>
uv run python scripts/backdoor_debug.py chat <session_id_2>

# Check resource ingestion
uv run python scripts/backdoor_debug.py nrs <resource_id>

# Check queue health
uv run python scripts/backdoor_debug.py health
```

---

## Phase 5: Success Criteria

### 5.1 Functional Requirements
- [ ] Both users complete 15+ turns without fatal errors
- [ ] Duplicate file upload returns existing resource ID
- [ ] Oversized file upload returns 413 error
- [ ] STM summaries are generated and injected into context
- [ ] LTM retrieves relevant past conversation snippets
- [ ] Resource context (RAG) returns relevant chunks

### 5.2 Performance Requirements
- [ ] Average response latency < 10 seconds per turn
- [ ] No OOM errors from Ollama
- [ ] No database connection pool exhaustion

### 5.3 Data Integrity
- [ ] All messages persisted to SQLite
- [ ] All resources persisted to MongoDB
- [ ] Vector embeddings stored in Qdrant

---

## Appendix: Error Handling Strategy

### Legacy Data Errors
```python
class LegacyDataError(Exception):
    """Raised when encountering incompatible legacy data."""
    pass

def handle_legacy_error(error, context):
    logger.error(f"Legacy data error in {context}: {error}")
    # Do not attempt recovery - skip and continue
    return None
```

### General Error Flow
1. Catch exception
2. Log with context
3. Skip current operation
4. Continue to next turn/user
5. Report in final audit
