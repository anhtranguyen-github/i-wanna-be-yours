# Study Plan Service Migration

**Completed: 2025-12-20**

## New Service: `backend/study-plan-service/` (Port 5500)

### Structure
```
backend/study-plan-service/
├── server.py              # Flask app entry point
├── requirements.txt       # Python dependencies
├── .env.example          # Environment template
└── modules/
    ├── __init__.py
    ├── study_plan.py      # Study plans, milestones, tasks
    ├── learner_progress.py # Progress tracking, achievements
    └── adaptive_learning.py # AI recommendations, difficulty
```

### API Prefix
- **Frontend**: `/s-api/*`
- **Backend**: `http://localhost:5500/*`

---

## Changes Made

### Files Moved
| From | To |
|------|----|
| `backend/flask/modules/study_plan.py` | `backend/study-plan-service/modules/` |
| `backend/flask/modules/learner_progress.py` | `backend/study-plan-service/modules/` |
| `backend/flask/modules/adaptive_learning.py` | `backend/study-plan-service/modules/` |

### Files Deprecated (moved to `backend/flask/modules/deprecated/`)
- `login_streak.py` - Duplicate of learner_progress streak feature
- `vocabulary_mining.py` - Not used by frontend
- `sentence_mining.py` - Not used by frontend

### Config Updates
| File | Change |
|------|--------|
| `frontend-next/next.config.js` | Added `/s-api` proxy to port 5500 |
| `frontend-next/.env.local` | Added `STUDY_PLAN_API_URL=http://localhost:5500` |
| `start_local_services.sh` | Added study-plan-service startup |

### Frontend Service Updates
| Service | Change |
|---------|--------|
| `studyPlanService.ts` | `/f-api` → `/s-api` |
| `learnerProgressService.ts` | `/f-api` → `/s-api` |
| `adaptiveLearningService.ts` | `/f-api` → `/s-api` |

---

## Service Architecture (Updated)

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Port 3000)                     │
│                      frontend-next                           │
└─────────────────────────────────────────────────────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
    /e-api/*       /f-api/*       /s-api/*       /h-api/*
         │              │              │              │
         ▼              ▼              ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  Express DB │ │ Flask Core  │ │ Study Plan  │ │  Hanachan   │
│  Port 8000  │ │  Port 5100  │ │  Port 5500  │ │  Port 5400  │
├─────────────┤ ├─────────────┤ ├─────────────┤ ├─────────────┤
│ - Grammar   │ │ - Flashcards│ │ - Study Plan│ │ - AI Tutor  │
│ - Vocab     │ │ - Quiz      │ │ - Progress  │ │ - Chat      │
│ - Kanji     │ │ - Decks     │ │ - Adaptive  │ │             │
│ - JLPT Exams│ │ - Library   │ │ - (Future)  │ │             │
│             │ │ - Resources │ │   Strategy  │ │             │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
         │              │              │              │
         └──────────────┴──────────────┴──────────────┘
                                │
                      ┌─────────▼─────────┐
                      │     MongoDB       │
                      │   Port 27017      │
                      └───────────────────┘
```

---

## Next Steps

1. **Test the new service**:
   ```bash
   cd backend/study-plan-service
   python3 -m venv .venv
   . .venv/bin/activate
   pip install -r requirements.txt
   python server.py
   ```

2. **Add new strategic framework modules** (Phase 0-6):
   - `content_mastery.py`
   - `strategy_framework.py`
   - `context_tracker.py`
   - `priority_matrix.py`
   - `review_cycles.py`

3. **Run full startup**:
   ```bash
   ./start_local_services.sh
   ```
