# Debugging Fixes & Configuration Notes (2026-01-02)

## 1. Resolved 500 Error / Server Hang
The `500 Internal Server Error` and server unresponsiveness were caused by two critical issues:

### A. invalid Import Path
- **File**: `backend/hanachan/services/memory.py`
- **Issue**: `from hanachan.memory.episodic import ...` caused `ModuleNotFoundError` because `hanachan` is not a package in that context.
- **Fix**: Changed to relative import `from memory.episodic import ...`.

### B. Startup Hang (Eager Initialization)
- **File**: `backend/hanachan/routes/memory.py`
- **Issue**: `memory_service = MemoryService()` was executing at **module level**.
    - This triggered `EpisodicMemory.__init__` -> `ModelFactory.create_embeddings()` -> `OllamaEmbeddings()`.
    - `OllamaEmbeddings` attempted to connect to Ollama immediately at startup.
    - If Ollama was slow, unavailable, or busy, the entire Flask app initialization hung during blueprint registration.
- **Fix**: Implemented **Lazy Loading** for `MemoryService` using a `get_memory_service()` helper function. It now initializes only when a request hits the endpoint, preventing startup blocks.

## 2. Server Stability
- **File**: `backend/hanachan/app.py`
- **Change**: binding to `host='0.0.0.0'` and `debug=False`.
- **Reason**: The Flask debug reloader was causing process management issues (zombie processes/port conflicts) when running via `start_local_services.sh`. Binding to `0.0.0.0` ensures the server is accessible even if `localhost` resolution is flaky (IPv6/IPv4 mismatch).

## 3. LLM Configuration (Fail-Fast Chain)
- **Primary**: `ollama` with `tinyllama:latest` (Memory-efficient).
- **Fallbacks**: `groq` -> `openai`.
- **Optimization**: Set `max_retries=0` for all providers to ensure immediate switching if an error (Rate Limit, OOM, Quota) occurs.
- **Error Handling**: Added runtime detection for:
    - Ollama OOM (Out Of Memory)
    - Groq/OpenAI Rate Limits (429)
    - "Does not support tools" errors (for smaller models like TinyLlama).

## 4. Performance Tips (Frontend)
- **Fast Refresh Logs**: The `[Fast Refresh] rebuilding` logs in the console are normal React DevTools behavior in development (`npm run dev`). They do not appear in production (`npm run build && npm run start`).
- **Optimization**: To improve load speed, use `dynamic()` imports for heavy components and Next.js Image optimization.
