# hanabira.org - Japanese Learning Platform

A comprehensive Japanese language learning platform with AI-powered tutoring, adaptive learning, premium unified UI, and personalized study plans.

## 🌸 Features

### 📚 Core Learning
- **Knowledge Base**: JLPT N1-N5 grammar, vocabulary, and kanji
- **Flashcards**: SRS-based spaced repetition system
- **Quizzes**: Adaptive difficulty quizzes for all levels (Premium Unified UI)
- **Reading Practice**: Japanese text with furigana and translations
- **JLPT Exams**: Full-length exam simulations with sticky navigation and scroll mode

### 🤖 AI Tutor (Hanachan)
- Natural conversation practice
- Grammar explanations and corrections
- Study recommendations based on progress
- Artifact generation (flashcards, summaries, quizzes)

### 📊 Comprehensive Planning & Strategy
- **Study Plans**: JLPT exam-focused personalized study plans (Strategy Center)
- **Learner Tracking**: Track vocabulary, kanji, grammar mastery
- **Adaptive Learning**: Recommendations based on performance
- **Achievements**: Badges and streak tracking for motivation
- **Dashboard**: Unified view of all progress metrics and personal stats

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
| **express** | 8000 | Static curriculum content (grammar, vocab, kanji) |
| **flask** | 5100 | User data (flashcards, progress, learner tracking) |
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
hanabira.org/
├── frontend-next/          # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js App Router pages
│   │   ├── components/    # Reusable React components
│   │   ├── services/      # API service clients
│   │   ├── types/         # TypeScript definitions
│   │   └── config/        # Navigation and system config
│
├── backend/
│   ├── express/           # Static content API
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
| `/tools` | Linguistic Laboratory (Vocab/Kanji maps, Text Parser) |
| `/game` | Hanachan's Arcade (Learning games) |
| `/library` | Learning Library (Podcasts, Reading, Mnemonics) |
| `/dictionary` | Integrated Japanese Dictionary |
| `/study-plan` | Strategy Center (OKRs, PACT, SMART Goals) |
| `/practice` | Practice Hub (Daily tasks, streaks) |
| `/jlpt` | Exam Center (JLPT Simulators) |
| `/quiz` | Practice Center (Custom Quizzes) |
| `/dashboard` | User Profile & Command Center |
| `/settings` | Account and UI Settings |

## 🆕 Recent Updates

### UI Unification (Premium Matcha)
- Unified Card Architecture for Quizzes and JLPT Exams.
- Consistent typography (Black weights, non-italicized headers).
- Premium "Matcha" aesthetic with glassmorphism and claymorphism elements.

### Advanced Planning System
- **Strategy Center**: Implementation of OKRs, PACT commitments, and SMART goals.
- **Progress Tracking**: Holistic view of vocabulary, kanji, and grammar mastery.
- **Activity Logging**: Semantic activity logs for performance analysis.

### Performance & Text Processing
- Migrated dictionary service to Python for better Japanese NLP support.
- Implemented robust text parsing with furigana and context-aware translations.

## 🔧 Configuration

### Environment Variables

```bash
# Frontend (next.config.js handles proxying)
EXPRESS_API_URL=http://localhost:8000
FLASK_API_URL=http://localhost:5100
STUDY_PLAN_API_URL=http://localhost:5500
DICTIONARY_API_URL=http://localhost:5200
HANACHAN_API_URL=http://localhost:5400
```

## 📝 License

MIT License - see [LICENSE](./LICENSE) file for details.

---

**hanabira.org** - 🌸 Your premium path to Japanese fluency
