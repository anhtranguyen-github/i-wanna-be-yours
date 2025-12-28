# Error Report: Async Memory Architecture Implementation

This document tracks all errors, bugs, and failures encountered during the implementation of the Asynchronous Memory Architecture.

## Systemic & Environment Failures

### 1. PYTHONPATH & Module Resolution
- **Error**: `ModuleNotFoundError: No module named 'app'` or `tasks`.
- **Cause**: The local virtual environment and the Docker container's working directory weren't properly added to the Python search path.
- **Solution**: 
  - Local: Prepended commands with `PYTHONPATH=.`.
  - Docker: Set `PYTHONPATH=/app` and `WORKDIR /app` in `docker-compose.yml` and `Dockerfile`.

### 2. Dependency Management
- **Error**: Missing `redis`, `rq`, `python-magic`, `langchain-openai`.
- **Solution**: Updated `requirements.txt`.
- **Optimization**: Switched from `pip` to `uv` for significantly faster and more reliable package installation in the Dockerfile.

### 3. Missing System Libraries
- **Error**: `ImportError: failed to find libmagic. Check your installation.`
- **Cause**: `python-magic` wrapper requires the `libmagic1` system library.
- **Solution**: Updated `Dockerfile` to `apt-get install -y libmagic1`.

### 4. Docker Networking & DNS
- **Error**: `ConnectionRefusedError: [Errno 111]` when connecting to Redis/Qdrant from within containers.
- **Cause**: Hardcoded `localhost` in service initialization.
- **Solution**: Mapped URLs and hosts to Docker service names (e.g., `redis`, `qdrant`).
- **Edge Case**: `Qdrant` intermittent `Connection Refused` despite correct hostname.
- **Solution**: Implemented explicit IP resolution using `socket.gethostbyname(qdrant_host)` to bypass potential IPv6/DNS lookup issues in Docker and forced `prefer_grpc=False`.

### 5. Docker Port Exposure & Race Conditions
- **Error**: `ConnectionResetError: [Errno 104] Connection reset by peer` on `localhost:5400`.
- **Cause**: Testing scripts hitting the Hanachan API before the Flask development server was fully "Up" or while it was still binding to `0.0.0.0`.
- **Solution**: Added `sleep 10` or `sleep 30` in CI/CD-style test commands to allow containers to settle.

## Code & Logic Errors

### 6. Indentation & Formatting
- **Error**: `IndentationError: unexpected unindent` in `memory/manager.py`.
- **Cause**: AI code editing tools occasionally misalign blocks during multi-chunk replacements.
- **Solution**: Performed full file overwrites for critical components to ensure formatting integrity.

### 7. Missing Imports & NameErrors
- **Error**: `NameError: name 'validate_resource_access' is not defined`.
- **Cause**: Manual refactoring of `routes/agent.py` accidentally stripped utility and service imports.
- **Solution**: Restored missing imports for `AgentService`, `AgentRequest`, and security logic.

### 8. LangChain Prompt Template Conflicts
- **Error**: `ValueError: Input to ChatPromptTemplate is missing variables`
- **Cause**: Prompt templates use `{}` for variables. Raw JSON strings in the "system" prompt (e.g., `{"relationships": []}`) were parsed as empty variable lookups.
- **Solution**: Escaped JSON braces as `{{` and `}}`.

### 9. LLM Parameter Mismatches
- **Error**: `INVALID_PROMPT_INPUT` or connection failures when switching to OpenAI.
- **Cause**: 
  1. `EpisodicMemory` was hardcoded to `OllamaEmbeddings`.
  2. Embedding dimensions mismatched (768 for nomic-embed-text vs 1536 for text-embedding-3-small).
- **Solution**: 
  1. Refactored `ModelFactory` to provide `create_embeddings()` supporting both OpenAI and Ollama.
  2. Standardized `EMBEDDING_DIMENSION=1536` in `docker-compose.yml` for OpenAI mode.

### 10. Background Task Worker Failures
- **Error**: `ValueError: Invalid attribute name: tasks.memory.process_interaction`.
- **Cause**: The `RQ` worker was unable to Resolve the task function because of relative vs absolute import mismatch.
- **Solution**: Enforced absolute imports in `save_interaction` and set `PYTHONPATH=/app`.

## Pending / Unresolved Items
- **Intermittent Mongo Connection Refused**: During startup, Mongo index initialization might fail if Mongo isn't ready. This is "soft-failed" with a warning for now.
- **Rate Limit Blueprint Access**: Still verifying if `current_app.limiter` is reactive enough for all blueprint routes in high-load scenarios.
- **Optimization**: Enforced usage of `uv` for all package management in Dockerfile and future scripts to ensure deterministic and high-speed builds.
- **Fix**: Resolved `EpisodicMemory` connection block by forcing `prefer_grpc=False` and manually resolving the Qdrant hostname to an IP address before initializing the client.
## 11. Persistent Qdrant Worker Connection Refused
- **Error**: `Errno 111 Connection refused` specifically when the worker calls `QdrantVectorStore`.
- **Observation**: Handled by manually resolving the hostname in `EpisodicMemory` but still occasionally fails. Likely a race condition or an issues with `httpx`/gRPC defaults in the `langchain-qdrant` library.
- **Action**: Forcing `prefer_grpc=False` and adding heartheat checks.
