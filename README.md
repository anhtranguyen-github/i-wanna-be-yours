# Hanabira.org - Japanese Learning Platform

A comprehensive Japanese language learning platform with AI-powered tutoring, adaptive learning, flashcards, quizzes, and personalized study plans.

## 🌸 Features

### 📚 Core Learning
- **Knowledge Base**: JLPT N1-N5 grammar, vocabulary, and kanji
- **Flashcards**: SRS-based spaced repetition system
- **Quizzes**: Adaptive difficulty quizzes for all levels
- **Reading Practice**: Japanese text with furigana and translations

### 🤖 AI Tutor (Hanachan)
- Natural conversation practice
- Grammar explanations and corrections
- Study recommendations based on progress
- Artifact generation (flashcards, summaries, quizzes)

### 📊 Comprehensive Planning
- **Study Plans**: JLPT exam-focused personalized study plans
- **Learner Tracking**: Track vocabulary, kanji, grammar mastery
- **Adaptive Learning**: Recommendations based on performance
- **Achievements**: Badges and streak tracking for motivation
- **Learning Dashboard**: Unified view of all progress metrics

### 🎯 Daily Learning
- Daily task generation
- Weekly goals tracking
- Study streak tracking
- Progress analytics

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js :3000)                          │
└───────────────┬─────────────┬─────────────┬─────────────┬───────────┘
                │             │             │             │
                ▼             ▼             ▼             ▼
         ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
         │ Express  │  │  Flask   │  │Dictionary│  │ Hanachan │
         │  :8000   │  │  :5100   │  │  :5200   │  │  :5400   │
         └──────────┘  └──────────┘  └──────────┘  └──────────┘
              │             │             │             │
              └─────────────┴─────────────┴─────────────┘
                                  │
                                  ▼
                      ┌──────────────────────┐
                      │  MongoDB :27017       │
                      └──────────────────────┘
```

### Services

| Service | Port | Purpose |
|---------|------|---------|
| **frontend-next** | 3000 | Next.js web application |
| **express** | 8000 | Static curriculum content (grammar, vocab, kanji) |
| **flask** | 5100 | User data (flashcards, progress, study plans) |
| **dictionary** | 5200 | Japanese text processing (MeCab, dictionaries) |
| **hanachan** | 5400 | AI chat agent (LangChain, Ollama) |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB
- Docker (for Ollama)

### Running Locally

```bash
# Start all services
./start_local_services.sh

# Stop all services
./start_local_services.sh stop
```

### Individual Services

```bash
# Frontend (Next.js)
cd frontend-next
npm run dev

# Flask API
cd backend/flask
source .venv/bin/activate
gunicorn -w 4 -b 0.0.0.0:5100 server:app

# Express API
cd backend/express
PORT=8000 node my_server.js

# Dictionary API
cd backend/dictionary
PORT=5200 node main_server.js

# Hanachan AI
cd backend/hanachan
source .venv/bin/activate
python3 app.py
```

## 📁 Project Structure

```
hanabira.org/
├── frontend-next/          # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js App Router pages
│   │   ├── components/    # Reusable React components
│   │   ├── services/      # API service clients
│   │   ├── types/         # TypeScript definitions
│   │   └── context/       # React contexts
│   └── content/           # Static content (grammar, etc.)
│
├── backend/
│   ├── express/           # Static content API
│   ├── flask/             # User data & learning API
│   │   └── modules/
│   │       ├── flashcards.py
│   │       ├── quiz.py
│   │       ├── study_plan.py
│   │       ├── learner_progress.py  # NEW: Progress tracking
│   │       └── adaptive_learning.py # NEW: Recommendations
│   ├── dictionary/        # Text processing API
│   └── hanachan/          # AI chat agent
│       └── services/
│           └── study_plan_context.py # Chat-planning integration
│
├── plans/                 # Implementation plans
├── logs/                  # Service logs
└── start_local_services.sh # Service orchestration script
```

## 🔗 API Endpoints

### Learner Progress (`/f-api/v1/learner/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/progress/{user_id}` | GET | Get progress summary |
| `/activity` | POST | Log learning activity |
| `/stats/{user_id}` | GET | Get detailed statistics |
| `/achievements/{user_id}` | GET | Get user achievements |
| `/session/start` | POST | Start study session |
| `/session/{id}/end` | POST | End study session |

### Adaptive Learning (`/f-api/v1/adaptive/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/recommendations/{user_id}` | GET | Get personalized recommendations |
| `/performance/{user_id}` | GET | Analyze learning performance |
| `/difficulty/{user_id}` | GET | Get difficulty settings |
| `/difficulty/{user_id}/adjust` | POST | Adjust difficulty |
| `/optimal-time/{user_id}` | GET | Get optimal study times |

### Study Plans (`/f-api/v1/study-plan/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/plans` | GET/POST | List/create study plans |
| `/plans/{id}` | GET/PATCH/DELETE | Manage specific plan |
| `/daily-tasks` | GET | Get today's tasks |
| `/jlpt-info` | GET | Get JLPT requirements |

## 🎨 Frontend Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/learning-dashboard` | **NEW**: Unified learning dashboard |
| `/flashcards` | Flashcard decks and study |
| `/quiz` | Quiz system |
| `/study-plan` | Study plan management |
| `/chat` | AI tutor (Hanachan) |
| `/knowledge-base` | Grammar, vocabulary, kanji |
| `/user-dashboard` | User profile and settings |

## 🆕 Recent Features

### Comprehensive Planning System (v2.0)

1. **Learner Progress Tracking**
   - Vocabulary, kanji, grammar mastery counts
   - Study streaks with longest streak record
   - Weekly goals (flashcards, quizzes, study time)
   - Activity logging for all learning actions

2. **Adaptive Learning Engine**
   - Performance analysis by category
   - Personalized recommendations
   - Automatic difficulty adjustment
   - Optimal study time suggestions

3. **Achievement System**
   - 13+ achievements (streaks, milestones, perfect scores)
   - Visual badges in dashboard and chat

4. **Unified Dashboard**
   - Progress rings and stat cards
   - Weekly goal progress bars
   - Achievement display
   - Recent activity feed
   - Quick action buttons

5. **Chat Integration**
   - Progress artifacts in chat
   - Recommendation artifacts
   - Intent detection for study queries
   - Context-aware AI responses

## 🔧 Configuration

### Environment Variables

```bash
# Flask
FLASK_PORT=5100
FLASK_API_URL=http://localhost:5100

# Frontend
NEXT_PUBLIC_FLASK_API_URL=http://localhost:5100
NEXT_PUBLIC_HANACHAN_API_URL=http://localhost:5400
```

## 📝 License

MIT License - see LICENSE file for details.

---

**Hanabira.org** - 🌸 Your path to Japanese fluency
