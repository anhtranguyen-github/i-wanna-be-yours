# 🤖 Hanachan - AI Language Learning Assistant

> A production-ready AI tutor with multi-tier memory, RAG capabilities, and Neural Swarm architecture.

## 🚀 Overview

Hanachan is an intelligent language learning assistant featuring:
- **Multi-Tier Memory System**: STM (PostgreSQL), LTM (Qdrant + Neo4j)
- **RAG Pipeline**: Resource upload, ingestion, and context retrieval
- **Neural Swarm**: Specialist sub-agents for different task types
- **Study Tools**: Goal tracking, progress auditing, flashcard generation

---

## 🏗 Architecture

| Component | Stack | Description |
| :--- | :--- | :--- |
| **Frontend** | Next.js / React | Modern chat interface with streaming |
| **Backend** | Python / Flask | RESTful API for chat, resources, and agent execution |
| **STM Database** | PostgreSQL (port 5433) | Conversations, messages, summaries |
| **LTM - Episodic** | Qdrant (port 6333) | Vectorized conversation memories |
| **LTM - Semantic** | Neo4j (port 7687) | Knowledge graph of user facts |
| **LLM Provider** | Ollama (qwen2.5:0.5b) | Primary with Groq/OpenAI fallback |
| **Embeddings** | nomic-embed-text (768-dim) | For Qdrant vector storage |
| **Queue** | Redis | Background task processing |
| **Package Mgr** | `uv` | Ultra-fast Python dependency management |

---

## 🧠 Memory System

### Short-Term Memory (STM)
- **Storage**: PostgreSQL
- **Tables**: `conversations`, `chat_messages`
- **Features**: 
  - Conversation summaries
  - Message attachments (resource IDs)
  - Sliding window with summarization

### Long-Term Memory (LTM)
- **Episodic** (Qdrant): Timestamped conversation summaries
- **Semantic** (Neo4j): User facts, goals, preferences as knowledge graph
- **Resource Vectors** (Qdrant): Uploaded document embeddings

```
┌─────────────────────────────────────────────────────────────────┐
│              MEMORY MANAGER (memory/manager.py)                 │
│                                                                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐        │
│  │  Episodic  │  │  Semantic  │  │      Study         │        │
│  │  (Qdrant)  │  │  (Neo4j)   │  │  (External API)    │        │
│  │  768-dim   │  │  Graph DB  │  │  Port 5500         │        │
│  └────────────┘  └────────────┘  └────────────────────┘        │
│                                                                 │
│  ┌────────────────────────────────────────────────────┐        │
│  │            Resource Memory (Qdrant)                │        │
│  │            Uploaded PDF/Doc vectors                │        │
│  └────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠 Setup & Installation

**Prerequisites:** Python 3.12+, Docker

### 1. Start Infrastructure
```bash
docker-compose up -d qdrant redis neo4j postgres ollama
```

### 2. Install Dependencies
```bash
cd backend/hanachan
uv sync
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your settings
```

### 4. Run Development Server
```bash
uv run python app.py
```

*Opens at `http://localhost:5000`*

---

## 📂 Project Structure

```text
├── agent/              # Agent logic (HanachanAgent, Neural Swarm)
│   ├── core_agent.py   # Main agent orchestrator
│   ├── neural_swarm.py # Specialist router
│   └── skills/         # Persona & capability definitions
├── memory/             # Memory system
│   ├── manager.py      # Unified memory interface
│   ├── episodic.py     # Qdrant vector storage
│   ├── semantic.py     # Neo4j knowledge graph
│   └── study.py        # Study plan integration
├── routes/             # API Endpoints
├── services/           # Business Logic layer
├── models/             # Database Models
├── schemas/            # Pydantic DTOs
├── tasks/              # Background workers (RQ)
│   ├── memory.py       # LTM processing
│   └── summarization.py # STM summarization
├── database/           # Database setup
├── scripts/            # Utility scripts
├── app.py              # Application Entry Point
└── pyproject.toml      # Dependency Config
```

---

## 🔧 Environment Variables

| Variable | Default | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | - | PostgreSQL connection string |
| `LLM_PROVIDER` | `ollama` | Primary LLM provider |
| `CHAT_MODEL` | `qwen2.5:0.5b` | Chat model name |
| `EMBEDDING_MODEL` | `nomic-embed-text` | Embedding model name |
| `EMBEDDING_DIMENSION` | `768` | Vector dimension |
| `QDRANT_HOST` | `localhost` | Qdrant host |
| `QDRANT_PORT` | `6333` | Qdrant port |
| `NEO4J_URI` | `bolt://localhost:7687` | Neo4j connection |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection |

---

## 📊 Database Migration

The system has been migrated from SQLite to PostgreSQL. See [DATABASE_MIGRATION.md](DATABASE_MIGRATION.md) for details.

---

## 📝 License
[MIT](LICENSE)
