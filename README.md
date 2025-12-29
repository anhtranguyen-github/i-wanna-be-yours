# 🌸 Hanabira.org - AI-Powered Japanese Learning Platform

> **Full-stack, production-grade Japanese language learning platform featuring an autonomous AI tutor, memory-driven adaptive learning, real-time streaming chat, and comprehensive study management.**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python)](https://python.org/)
[![LangChain](https://img.shields.io/badge/LangChain-Agentic_AI-green)](https://langchain.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?logo=mongodb)](https://mongodb.com/)

---

## 🎯 Project Overview

Hanabira is a comprehensive Japanese language learning platform built as a microservices architecture with 5+ backend services. The platform combines traditional learning methods (flashcards, spaced repetition, quizzes) with cutting-edge AI capabilities including an **autonomous LLM-powered tutor** that can analyze user progress, generate personalized content, and proactively adjust study priorities.

### 🏆 Key Technical Achievements

- **Autonomous AI Agent**: LangChain-based agent with 7+ custom tools for study management, progress auditing, and content generation
- **Real-time Streaming**: Server-sent events (SSE) for live AI response streaming with artifact extraction
- **Memory Architecture**: Hybrid memory system combining episodic (Qdrant vectors), semantic (Neo4j graph), and study context
- **Microservices**: 5 independent backend services with service-to-service authentication
- **Type-Safe Full Stack**: End-to-end TypeScript with strict typing, Zod validation, and comprehensive interfaces

---

## 🚀 Technical Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **Next.js 14** | React framework with App Router, Server Components, and API routes |
| **TypeScript** | Static typing with strict configuration |
| **SWR** | Data fetching with caching and revalidation |
| **Tailwind CSS** | Utility-first styling with custom design system |
| **Lucide React** | Icon library |

### Backend Services
| Service | Stack | Purpose |
|---------|-------|---------|
| **Express API** | Node.js, Express, MongoDB | Core API: auth (JWT), flashcards, practice, quoot game, records |
| **Flask Resources** | Python, Flask, MongoDB | Document processing, RAG indexing, ingestion pipeline |
| **Hanachan Agent** | Python, LangChain, SQLite | AI chat agent with streaming, tools, and multi-memory |
| **Study Plan Service** | Python, Flask, MongoDB | SMART goals, OKRs, milestones, performance tracking |
| **Dictionary Service** | Python, MeCab, SudachiPy | Japanese text tokenization and analysis |

### AI & Machine Learning
| Technology | Purpose |
|------------|---------|
| **LangChain** | Agent framework with tool binding and message management |
| **OpenAI GPT-4o** | Primary LLM for chat and reasoning |
| **Qdrant** | Vector database for episodic memory and RAG |
| **Neo4j** | Graph database for semantic knowledge relationships |
| **text-embedding-3-small** | 1536-dimension embeddings for similarity search |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| **MongoDB** | Primary document store (4 databases) |
| **Redis** | Background job queue (RQ workers) |
| **Docker Compose** | Multi-container orchestration |
| **JWT** | Stateless authentication across services |

---

## 🧠 AI Agent Architecture

The **Hanachan AI Tutor** is the crown jewel of this project - an autonomous agent that goes beyond simple Q&A.

### Agent Capabilities

```
┌─────────────────────────────────────────────────────────────────┐
│                    Hanachan Agent                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  Chat Persona │  │  Tool Binding │  │  Memory Mgr  │          │
│  │  (Markdown)   │  │  (7+ Tools)   │  │  (Hybrid)    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                  │
│  Tools:                                                          │
│  • generate_suggested_goals   • audit_study_progress             │
│  • prepare_milestone_exam     • perform_detailed_audit           │
│  • update_goal_progress       • query_learning_records           │
│  • recalibrate_study_priorities (autonomous goal updates)        │
│                                                                  │
│  Memory:                                                         │
│  • Episodic: Recent interactions (Qdrant)                        │
│  • Semantic: Knowledge gaps & relationships (Neo4j)              │
│  • Study: Active plans, goals, performance trends                │
└─────────────────────────────────────────────────────────────────┘
```

### Proactive Recalibration

The agent can **autonomously detect and fix** misaligned study priorities:

1. **Trend Analysis**: Analyzes 30-day performance audits for recurring struggles
2. **Goal Matching**: Maps identified struggles to existing SMART goals
3. **Priority Update**: Elevates goal priorities via batch API calls
4. **User Notification**: Informs user of changes in natural conversation

---

## 📊 Features

### 🎓 Core Learning
- **Knowledge Base**: Complete JLPT N1-N5 grammar, vocabulary, and kanji database
- **Flashcards**: SRS-powered spaced repetition with custom decks
- **Quoot**: High-stakes vocabulary battle game with real-time scoring
- **Practice Hub**: Structured drills, simulated JLPT exams
- **Reading Practice**: Japanese texts with furigana and translations

### 💬 AI Tutor (Hanachan)
- **Streaming Chat**: Real-time SSE response streaming
- **Context-Aware**: Retrieves relevant memories and study context per message
- **Artifact Generation**: Creates flashcard decks, summaries, quizzes on demand
- **Ingestion Awareness**: Detects pending resource processing, notifies user
- **Tool Invocation**: Proactively updates goals based on conversation

### 📈 Study Management
- **SMART Goals**: Measurable objectives with priority levels
- **OKR Framework**: Objective-Key Result tracking
- **Milestone Timeline**: Long-term learning objectives
- **Performance Trends**: AI-identified knowledge gaps visualization
- **Recalibration UI**: One-click agent-driven priority adjustments

### 🔐 Authentication & Security
- **JWT Authentication**: Stateless tokens with refresh mechanism
- **Role-Based Access**: User, admin, and ingestion_worker roles
- **Service-to-Service Auth**: Internal tokens for backend communication
- **Resource Ownership**: Strict user-based access control

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js :3000)                          │
│  • Server Components  • SWR Caching  • Auth Middleware              │
└───────────────┬─────────────┬─────────────┬─────────────┬───────────┘
                │             │             │             │
    ┌───────────┴───────────┐ │             │             │
    │ /e-api/*              │ │ /f-api/*    │ /h-api/*    │ /s-api/*
    ▼                       ▼ │             ▼             ▼
┌──────────┐          ┌──────▼─────┐  ┌──────────┐  ┌──────────┐
│ Express  │          │   Flask    │  │ Hanachan │  │Study-Plan│
│  :8000   │          │   :5100    │  │  :5400   │  │  :5500   │
│ Auth/API │          │ Resources  │  │ AI Agent │  │ Goals    │
└────┬─────┘          └──────┬─────┘  └────┬─────┘  └────┬─────┘
     │                       │             │             │
     └───────────┬───────────┴──────┬──────┴─────────────┘
                 │                  │
         ┌───────▼───────┐  ┌───────▼───────┐
         │   MongoDB     │  │    Qdrant     │
         │   :27017      │  │    :6333      │
         └───────────────┘  └───────────────┘
```

---

## 🧪 Testing

### System Tests
The project includes comprehensive end-to-end tests:

```bash
# Run full system test suite
cd backend/hanachan
.venv/bin/python test/run_full_system.py
```

**Test Workflows:**
- `workflow_comprehensive_chat.py` - Full chat flow with resource upload, streaming, artifacts
- `workflow_autonomous_study_recalibration.py` - Agent tool invocation and goal updates
- `workflow_memory_recalibration.py` - Semantic memory and struggle detection

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+ with `uv` package manager
- MongoDB 7.0+
- Docker (for Qdrant, Neo4j)

### Run Locally
```bash
# Clone and setup
git clone https://github.com/your-username/hanabira.org.git
cd hanabira.org

# Start all services (handles dependencies automatically)
./start_local_services.sh

# Stop services
./start_local_services.sh stop
```

### Environment Variables
```bash
# Required for AI features
OPENAI_API_KEY=sk-...

# Database connections
MONGO_URI=mongodb://localhost:27017
QDRANT_HOST=localhost
NEO4J_URI=bolt://localhost:7687

# JWT
JWT_SECRET=your-secret-key
```

---

## 📁 Project Structure

```
hanabira.org/
├── frontend-next/              # Next.js 14 App Router
│   ├── src/app/               # Pages and API routes
│   ├── src/components/        # 100+ reusable React components
│   ├── src/services/          # API clients with full typing
│   ├── src/hooks/             # Custom hooks (useChatStream, etc.)
│   └── src/context/           # Global state management
│
├── backend/
│   ├── express/               # Node.js core API
│   ├── flask/                 # Python resource service
│   ├── hanachan/              # AI Agent service
│   │   ├── agent/             # LangChain agent, tools, skills
│   │   ├── memory/            # Episodic, semantic, study memory
│   │   ├── services/          # External service clients
│   │   └── test/workflows/    # System test suite
│   ├── study-plan-service/    # Goals and tracking
│   └── python-dictionary/     # NLP processing
│
├── start_local_services.sh    # One-command startup
└── docker-compose.yml         # Full containerization
```

---

## 🎨 Screenshots

*Study Plan Dashboard with Smart Goals and Performance Trends*

*AI Chat with Resource Upload and Streaming*

*Flashcard Study with SRS Algorithm*

---

## 📝 License

MIT License - see [LICENSE](./LICENSE) for details.

---

**Hanabira.org** - 🌸 Your intelligent path to Japanese fluency

*Built with ❤️ as a full-stack portfolio project demonstrating microservices architecture, AI agent development, and modern React patterns.*
