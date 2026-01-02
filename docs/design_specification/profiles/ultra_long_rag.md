# System Profile: Ultra-Long RAG Focus

## 🎯 Configuration
- **LTM (Long-Term Memory)**: **DISABLED** (`LTM_ENABLED=False`)
- **STM (Short-Term Memory)**: **ACTIVE** (Recursive Summarization + Resource-Aware History)
- **RAG (Neural Resource Service)**: **ACTIVE** (Asynchronous Microservice + Qdrant)
- **Model**: **Qwen-2.5** (via Ollama on Docker)
- **Scope**: Single-session deep-dive Intelligence.

## 🧠 Reasoning
The goal is to eliminate "noise" from the global platform (Knowledge Graph and disparate past conversations) to provide a high-precision tutoring experience centered strictly on the current conversation's flow and the attached technical documents.

## 🌉 The "Resource-Aware STM" Bridge
To maintain intelligence over a "very very long" conversation, the system follows this mapping:
1.  **Persistence**: `ChatMessage.attachments` stores JSON `[{id, title}]` directly in SQLite.
2.  **Compression**: The `summarization_task` uses these JSON objects to generate summaries that explicitly mention the files (e.g., *"We analyzed ArXiv Section 2..."*).
3.  **Grounding**: The `MemoryManager` performs NRS searches using the `id` from the active attachments list for every turn.

## 🛰️ Access Points
- **Knowledge Input**: `POST /e-api/v1/r/upload` (Express Gateway -> NRS)
- **Inference Input**: `POST /api/agent/stream` (Hanachan Core)
- **Monitoring**: `backend/hanachan/scripts/backdoor_debug.py`

## 🧪 Simulation Profile
Validated via `scripts/simulate_long_chat.py` which pushes a single session through 50+ turns across multiple documents with forced background summarization.
