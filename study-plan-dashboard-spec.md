# Study Plan Dashboard Specification

## Overview

The **Strategic Learning Hub** (`/study-plan/dashboard`) is a comprehensive dashboard for JLPT study plan management. It integrates three strategic frameworks (OKR, PACT, SMART) to provide users with a goal-oriented, data-rich learning experience.

---

## Architecture

### Frontend
- **Route**: `/study-plan/dashboard`
- **File**: `frontend-next/src/app/study-plan/dashboard/page.tsx`
- **Framework**: Next.js 14 (App Router) with React 18
- **Charts**: Recharts (AreaChart, RadarChart, LineChart)
- **Icons**: Lucide React
- **Auth**: GlobalAuthContext for guest handling

### Backend Services
- **Flask API**: `localhost:5100` → proxied via `/f-api`
- **Express API**: `localhost:8000` → proxied via `/e-api`
- **Database**: MongoDB (`flaskStudyPlanDB`)

---

## Data Models

### 1. StudyPlanDetail (Frontend Type)
```typescript
interface StudyPlanDetail {
  id: string;
  user_id: string;
  target_level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  exam_date: string;              // ISO date string
  start_date: string;
  status: 'active' | 'completed' | 'paused' | 'abandoned';
  total_days: number;
  days_remaining: number;
  overall_progress_percent: number;
  daily_study_minutes: number;
  study_days_per_week: number;
  preferred_focus: string[];
  current_milestone_id?: string;
  milestones: Milestone[];
  framework_stats?: FrameworkStats; // Strategic framework data
}
```

### 2. Milestone
```typescript
interface Milestone {
  id: string;
  plan_id: string;
  milestone_number: number;
  title: string;
  description: string;
  category: 'vocabulary' | 'grammar' | 'kanji' | 'reading' | 'listening' | 'mixed';
  status: 'pending' | 'in_progress' | 'completed';
  progress_percent: number;
  target_start_date: string;
  target_end_date: string;
  criteria: MilestoneCriterion[];
}
```

### 3. DailyTask
```typescript
interface DailyTask {
  id: string;
  plan_id: string;
  milestone_id: string;
  user_id: string;
  date: string;
  task_type: 'flashcard' | 'quiz' | 'lesson' | 'reading' | 'listening';
  title: string;
  description: string;
  content_ref: { type: string; id: string | null };
  estimated_minutes: number;
  status: 'pending' | 'completed' | 'skipped';
  completed_at?: string;
  score?: number;
}
```

### 4. Strategic Framework Types (New)

#### OKRGoal (Objectives & Key Results)
```typescript
interface OKRGoal {
  objective: string;
  keyResults: Array<{
    title: string;
    current: number;
    target: number;
    unit: string;
  }>;
  progress: number;
}
```

#### PACTStat (Purpose, Actions, Continuous, Trackable)
```typescript
interface PACTStat {
  purpose: string;
  actions: string[];
  continuous: boolean;
  trackable: boolean;
  streakDays: number;
}
```

#### SMARTGoal
```typescript
interface SMARTGoal {
  id: string;
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timeBound: string;
  deadline: string;
  progress: number;
  status: 'active' | 'completed' | 'overdue';
}
```

#### FrameworkStats (Aggregated)
```typescript
interface FrameworkStats {
  okr: OKRGoal[];
  pact: PACTStat;
  smart: SMARTGoal[];
}
```

---

## MongoDB Collections

### `study_plans` Collection
```javascript
{
  _id: ObjectId,
  user_id: String,
  target_level: String,           // "N5", "N4", "N3", "N2", "N1"
  exam_date: Date,
  created_at: Date,
  updated_at: Date,
  status: String,                 // "active", "completed", "paused", "abandoned"
  start_date: Date,
  total_days: Number,
  days_remaining: Number,
  current_milestone_id: ObjectId,
  overall_progress_percent: Number,
  daily_study_minutes: Number,
  study_days_per_week: Number,
  preferred_focus: [String],
  template_id: ObjectId
}
```

### `milestones` Collection
```javascript
{
  _id: ObjectId,
  plan_id: ObjectId,
  milestone_number: Number,
  title: String,
  description: String,
  category: String,
  status: String,                 // "pending", "in_progress", "completed"
  progress_percent: Number,
  target_start_date: Date,
  target_end_date: Date,
  actual_start_date: Date,
  actual_end_date: Date,
  criteria: [{
    type: String,                 // "vocab_count", "quiz_score", etc.
    target_value: Number,
    current_value: Number,
    unit: String
  }]
}
```

### `daily_tasks` Collection
```javascript
{
  _id: ObjectId,
  plan_id: ObjectId,
  milestone_id: ObjectId,
  user_id: String,
  date: Date,
  task_type: String,
  title: String,
  description: String,
  content_ref: { type: String, id: ObjectId },
  estimated_minutes: Number,
  status: String,
  completed_at: Date,
  score: Number
}
```

### `learner_progress` Collection
```javascript
{
  _id: ObjectId,
  user_id: String,
  vocabulary_mastered: Number,
  kanji_mastered: Number,
  grammar_points_learned: Number,
  total_study_time_minutes: Number,
  current_streak: Number,
  longest_streak: Number,
  level_scores: {
    N5: { vocabulary: Number, kanji: Number, grammar: Number },
    N4: { ... },
    // etc.
  },
  weekly_goals: {
    flashcard_reviews: { target: Number, current: Number },
    quizzes_completed: { target: Number, current: Number },
    study_minutes: { target: Number, current: Number }
  },
  last_activity_date: Date,
  created_at: Date,
  updated_at: Date
}
```

---

## API Endpoints

### Study Plan Service (`/f-api/v1/study-plan/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/jlpt-info` | Get JLPT level requirements |
| GET | `/templates` | List available plan templates |
| GET | `/templates/:id` | Get template details |
| POST | `/plans` | Create new study plan |
| GET | `/plans?user_id=...` | List user's plans |
| GET | `/plans/:id` | Get plan details with milestones |
| PATCH | `/plans/:id` | Update plan settings |
| DELETE | `/plans/:id` | Abandon plan (soft delete) |
| GET | `/plans/:id/health` | Get plan health diagnostics |
| POST | `/plans/:id/recalculate` | Recalculate milestone timelines |
| GET | `/milestones/:id` | Get milestone details |
| PATCH | `/milestones/:id/complete` | Mark milestone complete |
| GET | `/daily-tasks?user_id=...` | Get today's tasks |
| PATCH | `/daily-tasks/:id/complete` | Mark task complete |
| GET | `/progress/:planId` | Get progress report |

### Learner Progress Service (`/f-api/v1/learner/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/progress/:userId` | Get comprehensive progress summary |
| POST | `/activity` | Log a learning activity |
| GET | `/stats/:userId` | Get detailed learning statistics |
| GET | `/achievements/:userId` | Get user's achievements |
| POST | `/session/start` | Start a study session |
| POST | `/session/:id/end` | End a study session |

### Adaptive Learning Service (`/f-api/v1/adaptive/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/recommendations/:userId` | Get personalized recommendations |
| GET | `/performance/:userId` | Analyze learning performance |
| GET | `/difficulty/:userId` | Get difficulty settings |
| POST | `/difficulty/:userId/adjust` | Adjust difficulty |
| GET | `/optimal-time/:userId` | Get optimal study time |

---

## Dashboard UI Components

### Tab Structure
1. **STRATEGY** - OKR objectives and PACT commitment tracking
2. **TASKS** - Today's tasks and milestone completion
3. **PERFORMANCE** - Charts, history, and SMART goals

### Visual Elements
- **Glassmorphic cards** with backdrop blur
- **Progress rings** for milestone visualization
- **Radar charts** for skill breakdown (vocabulary, grammar, kanji, reading, listening)
- **Area charts** for performance trends over time
- **Line charts** for weekly activity patterns

### Guest Experience
- Shows "Choose Your Path" view with framework previews
- Uses `GlobalAuthModal` with `flowType: 'STUDY_PLAN'` for contextual signup

---

## Current Implementation Status

### Implemented ✅
- Plan creation with JLPT templates
- Milestone-based progress tracking
- Daily task generation
- Plan health diagnostics
- Timezone-aware datetime handling
- API prefix standardization (`/f-api`, `/e-api`)

### Mock Data (Pending Backend Integration)
- OKR framework calculation
- PACT habit tracking
- SMART goal creation and management
- Hanachan AI strategy insights

### Future Enhancements
- Real-time progress sync with flashcard/quiz systems
- AI-generated personalized OKR recommendations
- SMART goal wizard with AI assistance
- Performance prediction algorithms

---

## File References

| Component | Path |
|-----------|------|
| Dashboard Page | `frontend-next/src/app/study-plan/dashboard/page.tsx` |
| Types | `frontend-next/src/types/studyPlanTypes.ts` |
| Service | `frontend-next/src/services/studyPlanService.ts` |
| Backend Module | `backend/flask/modules/study_plan.py` |
| Learner Progress | `backend/flask/modules/learner_progress.py` |
| Adaptive Learning | `backend/flask/modules/adaptive_learning.py` |

---

## Evaluation Criteria

For research agent evaluation, consider:

1. **Data Model Completeness** - Are all necessary fields captured?
2. **API Design** - RESTful, consistent naming, proper HTTP methods?
3. **Progress Tracking** - Accurate milestone and task completion logic?
4. **Framework Integration** - OKR/PACT/SMART properly structured?
5. **User Experience** - Clear visual hierarchy, actionable insights?
6. **Scalability** - Can handle multiple active plans per user?
7. **Error Handling** - Graceful degradation for missing data?
