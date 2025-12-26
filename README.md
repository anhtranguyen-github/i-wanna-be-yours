# hanachan.org - Japanese Learning Platform

A comprehensive Japanese language learning platform with AI-powered tutoring, adaptive learning, premium unified UI, and personalized study plans.

## 🌸 Features

### 📚 Core Learning
- **Knowledge Base**: JLPT N1-N5 grammar, vocabulary, and kanji
- **Flashcards**: SRS-based spaced repetition system with deck-based study
- **Quoot**: High-stakes vocabulary battle game
- **Practice Hub**: Structured drills and simulated exams
- **Reading Practice**: Japanese text with furigana and translations
- **JLPT Exams**: Full-length exam simulations with sticky navigation and scroll mode

### 🤖 AI Tutor (Hanachan)
- Natural conversation practice
- Grammar explanations and corrections
- Study recommendations based on progress
- Artifact generation (flashcards, summaries, quizzes)

### 📊 Progress Tracking & History
- **Session Recording**: Track practice, flashcard, and game session results
- **History Panel**: View recent activity across all learning modes
- **Learner Tracking**: Track vocabulary, kanji, grammar mastery
- **Adaptive Learning**: Recommendations based on performance
- **Achievements**: Badges and streak tracking for motivation

### 🎯 Study Planning
- **Study Plans**: JLPT exam-focused personalized study plans
- **Daily Tasks**: AI-generated daily learning activities
- **Weekly Goals**: Progress tracking against custom goals
- **Milestones**: Long-term learning objectives

### 🔗 Social & Sharing
- **Add by ID**: Import shared flashcard sets, practice protocols, or quoot arenas by ID
- **Visibility Filters**: Browse public, official, or personal content
- **Collection Management**: Organize followed items in personal collections

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js :3000)                          │
└───────────────┬─────────────┬─────────────┬─────────────┬───────────┘
                │             │             │             │           │
                ▼             ▼             ▼             ▼           ▼
         ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
         │ Express  │  │  Flask   │  │Dictionary│  │ Hanachan │  │Study-Plan│
         │  :8000   │  │  :5100   │  │  :5200   │  │  :5400   │  │  :5500   │
         └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘
               │             │             │             │             │
               └─────────────┴─────────────┴─────┬───────┴─────────────┘
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
| **express** | 8000 | Core API (auth, flashcards, practice, quoot, records) |
| **flask** | 5100 | User data (progress, learner tracking) |
| **python-dictionary** | 5200 | Japanese text processing (MeCab, sudachipy) |
| **hanachan** | 5400 | AI chat agent (LangChain, Ollama) |
| **study-plan-service** | 5500 | Strategy, OKRs, PACT, and SMART goal management |

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

## 📁 Project Structure

```
hanachan.org/
├── frontend-next/          # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js App Router pages
│   │   ├── components/    # Reusable React components
│   │   ├── services/      # API service clients
│   │   ├── types/         # TypeScript definitions
│   │   └── context/       # React context providers
│
├── backend/
│   ├── express/           # Core API server
│   │   ├── models/        # MongoDB schemas
│   │   ├── routes/        # API route handlers
│   │   └── seeding_scripts/ # Database seeders
│   ├── flask/             # User data & learning API
│   ├── study-plan-service/# Strategy and goals API
│   ├── python-dictionary/ # Text processing API
│   └── hanachan/          # AI chat agent
│
├── start_local_services.sh # Service orchestration script
└── docker-compose.yml      # Container orchestration
```

## 🎨 Frontend Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/chat` | AI Tutor (Hanachan) |
| `/activity` | Activity Hub (Games, Practice, Flashcards) |
| `/flashcards` | Flashcard deck browser and study |
| `/flashcards/study` | SRS study session |
| `/practice` | Practice Hub (Drills, Quizzes) |
| `/quoot` | Quoot game arena browser |
| `/quoot/[id]` | Quoot game session |
| `/tools` | Linguistic Laboratory (Vocab/Kanji maps, Text Parser) |
| `/library` | Learning Library (Podcasts, Reading, Mnemonics) |
| `/dictionary` | Integrated Japanese Dictionary |
| `/study-plan` | Strategy Center (Goals, Milestones) |
| `/dashboard` | User Profile & Progress Overview |
| `/settings` | Account and UI Settings |

## 🆕 Recent Updates

### Activity History & Records (v1.4)
- **Session Recording**: All practice, flashcard, and quoot sessions now save results
- **HistoryPanel**: View recent activity with scores and timestamps
- **HistoryModal**: Quick access to history from any hub page

### Add by ID Feature (v1.4)
- **RetrievalModal**: Add shared content to your collection by ID
- **Follow System**: Track followed items across flashcards, practice, and quoot

### Unified Access Filtering (v1.4)
- **Visibility Filters**: Filter by Official, Public, or Personal content
- **Sticky Headers**: Search and filters remain visible while scrolling
- **Consistent UI**: Same filtering experience across all hub pages

### UI Enhancements
- **Link2 Icon**: Better icon for "Add by ID" functionality
- **History Button**: Quick access to session history from hub pages
- **Premium Matcha Aesthetic**: Consistent design language throughout

## 🔧 Configuration

### Environment Variables

```bash
# Frontend (.env.local)
NEXT_PUBLIC_EXPRESS_API_URL=http://localhost:8000

# Backend (.env)
EXPRESS_API_URL=http://localhost:8000
FLASK_API_URL=http://localhost:5100
STUDY_PLAN_API_URL=http://localhost:5500
DICTIONARY_API_URL=http://localhost:5200
HANACHAN_API_URL=http://localhost:5400
MONGO_URI=mongodb://localhost:27017/hanachan
JWT_SECRET=your-secret-key
```

## 🔌 API Endpoints

### Express API (Port 8000)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/e-api/v1/auth/*` | POST | Authentication (login, register, refresh) |
| `/e-api/v1/flashcards/*` | GET/POST | Flashcard sets and cards |
| `/e-api/v1/practice/*` | GET/POST | Practice nodes and sessions |
| `/e-api/v1/quoot/*` | GET/POST | Quoot arenas and games |
| `/e-api/v1/records/*` | GET/POST | Session history records |
| `/e-api/v1/user/*` | GET/POST | User preferences and follows |

## 📝 License

MIT License - see [LICENSE](./LICENSE) file for details.

---

**hanachan.org** - 🌸 Your premium path to Japanese fluency
