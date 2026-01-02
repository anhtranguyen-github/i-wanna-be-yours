# Plan: Neural Resource Service (NRS) Implementation

This document outlines the refactoring of the Resource management system into a standalone microservice to unify storage, ingestion, and neural processing.

## 🏗️ Architecture Overview
- **Service Name**: Neural Resource Service (NRS)
- **Port**: **5300**
- **Primary Data Store**: MongoDB (Metadata), Qdrant (Vectors), Local Filesystem (Physical storage)
- **Base URL**: `http://localhost:5300/r-api/v1`

---

## 🎯 Core Responsibilities
1.  **Unified Storage**: Handle all file uploads, security validation, and disk persistence.
2.  **Autonomous Ingestion**: Automatically trigger vector embedding (RAG) and summarization upon upload.
3.  **Neural Metadata**: Manage "AI-Ready" status, summaries, and extraction results in MongoDB.
4.  **RAG Provider**: Act as the search interface for other services (like the AI Agent) to query file contents.

---

## 🛠️ Step-by-Step Implementation Phase

### Phase 1: Service Scaffolding & Migration
- [ ] Create `backend/resource-service/` directory with a new Flask/Python app.
- [ ] Set up `Port 5300` and `uv` project management.
- [ ] Migrate the `ResourcesModule` from `backend/flask/modules/resources.py` to the new service.
- [ ] Migrate `ResourceProcessor`, `SummarizerService`, and `Resource` tasks from `backend/hanachan`.

### Phase 2: Single Source of Truth (MongoDB)
- [ ] Centralize all resource metadata in a shared MongoDB collection.
- [ ] **Data Migration**: Ensure existing records in Hanachan's SQLite and Flask's MongoDB are merged/standardized.
- [ ] Implement strict `userId` Row-Level Security (RLS) within the new service logic.

### Phase 3: Ingestion Logic & Controls
- [ ] Implement `auto_ingest` toggle in the Upload API.
- [ ] **Multi-Strategy Chunking**: Implement both Recursive Character and **Semantic Chunking** strategies.
- [ ] Set up dedicated Redis Queue (`nrs_ingestion`) for background processing.
- [ ] Implement "Recursive Summarization" within the ingestion pipeline for long documents.
- [ ] Add `POST /r-api/v1/resources/{id}/reindex` for manual processing.

### Phase 4: System Integration (Express & Agent)
- [ ] **Express Gateway**: Update `my_server.js` to proxy `/r-api` requests to `http://localhost:5300`.
- [ ] **AI Agent Update**: Refactor `HanachanAgent` to call the NRS (5300) for retrieval instead of using internal memory classes.
- [ ] **Frontend Update**: Update `resourceService.ts` and `aiTutorService.ts` to point to the new unified API base.

### Phase 5: Cleanup & Deletion
- [ ] Remove resource routes/models from `backend/flask`.
- [ ] Remove resource routes/models/tasks from `backend/hanachan`.
- [ ] Delete `backend/hanachan/models/resource.py`.

---

## 🔄 The New Request Flow (RAG)
1.  **Upload**: User uploads file via Next.js ➡️ Express ➡️ **NRS (5300)**.
2.  **Ingest**: NRS saves to disk, updates Mongo (status: `pending`), and enqueues a `vectorize` task.
3.  **Worker**: Worker (NRS context) reads file, embeds to Qdrant, updates Mongo (status: `completed`).
4.  **Query**: User asks question ➡️ **Agent (5400)** ➡️ **NRS (5300)** (Search Qdrant) ➡️ Context returned to Agent ➡️ Answer generated.

---

## 🛡️ Security & Privacy
- **Sanitization**: All incoming files undergo magic-byte verification and filename sanitization.
- **Isolation**: Every Qdrant and MongoDB query is strictly filtered by `userId`.
- **Least Privilege**: The service uses a dedicated MongoDB user with permissions restricted to the `resources` and `resource_vectors` collections.
