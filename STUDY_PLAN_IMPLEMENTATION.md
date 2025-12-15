# Study Plan Implementation Plan

Based on: `schedule.md` (JLPT Exam Goal Planning Feature)

---

## Executive Summary

This plan implements a **personalized JLPT Study Planning system** that helps users:
1. Set a target JLPT level (N5-N1) and exam date
2. Follow milestone-based study plans
3. Receive chatbot-assisted guidance
4. Take integrated assessments
5. Get dynamically personalized learning materials

**Key Principle:** Public plan templates are accessible without login; personalized tracking requires authentication.

---

## Phase Overview

| Phase | Description | Duration | Dependencies |
|-------|-------------|----------|--------------|
| **Phase 1** | Data Models & Plan Templates | 1-2 days | MongoDB |
| **Phase 2** | Plan Generation Service | 2 days | Phase 1 |
| **Phase 3** | Frontend - Plan Setup & Overview | 2 days | Phase 2 |
| **Phase 4** | Milestone Tracking & Progress | 1-2 days | Phase 3, Quiz system |
| **Phase 5** | Daily/Weekly Task Generation | 1-2 days | Phase 4 |
| **Phase 6** | Chatbot Integration | 1-2 days | Phase 5, Hanachan |
| **Phase 7** | Assessment Scheduling | 1 day | Quiz system |
| **Phase 8** | Adaptive Plan Adjustment | 1-2 days | All previous |

**Total Estimated:** 10-15 days

---

## Implementation Progress

| Phase | Status | Completed Date | Notes |
|-------|--------|----------------|-------|
| **Phase 1** | ✅ Complete | 2025-12-14 | Backend models, templates, seeding |
| **Phase 2** | ✅ Complete | 2025-12-14 | Flask API endpoints, plan generation |
| **Phase 3** | ✅ Complete | 2025-12-14 | Landing, Setup wizard, Dashboard |
| **Phase 4** | ✅ Complete | 2025-12-14 | Milestones list/detail, Assessments page |
| **Phase 5** | ✅ Complete | 2025-12-14 | Daily tasks API, Settings page |
| **Phase 6** | ✅ Complete | 2025-12-14 | Chatbot context integration |
| **Phase 7** | ✅ Complete | 2025-12-14 | Assessment scheduling UI |
| **Phase 8** | ✅ Complete | 2025-12-14 | Adaptive adjustments |

### Files Created

**Backend (Flask):**
- `backend/flask/modules/study_plan.py` - Main module with models, API routes, adaptive adjustments
- `backend/flask/tests/test_study_plan.py` - Unit tests

**Backend (Hanachan Chatbot):**
- `backend/hanachan/services/study_plan_context.py` - Study plan context provider for AI
- `backend/hanachan/skills/chatbot-study-plan.md` - Skill card documentation
- `backend/hanachan/agent/mock_agent.py` - Updated with study plan awareness

**Frontend (Next.js):**
- `frontend-next/src/types/studyPlanTypes.ts` - TypeScript types
- `frontend-next/src/services/studyPlanService.ts` - API service with adaptive methods
- `frontend-next/src/app/study-plan/page.tsx` - Landing page
- `frontend-next/src/app/study-plan/layout.tsx` - Layout with SEO
- `frontend-next/src/app/study-plan/setup/page.tsx` - Setup wizard
- `frontend-next/src/app/study-plan/dashboard/page.tsx` - Dashboard
- `frontend-next/src/app/study-plan/milestones/page.tsx` - Milestones list
- `frontend-next/src/app/study-plan/milestones/[id]/page.tsx` - Milestone detail
- `frontend-next/src/app/study-plan/settings/page.tsx` - Plan settings
- `frontend-next/src/app/study-plan/assessments/page.tsx` - Assessments view

**Modified Files:**
- `backend/flask/server.py` - Registered StudyPlanModule
- `frontend-next/src/components/Sidebar.tsx` - Added Study Plan nav item
- `frontend-next/src/app/globals.css` - Added animations

---

## Phase 1: Data Models & Plan Templates

### 1.1 Study Plan Collection

**Purpose:** Store user's personalized study plan

```javascript
// Collection: study_plans
{
  _id: ObjectId,
  user_id: String,                    // Required for personalized plans
  
  // Target Configuration
  target_level: "N5" | "N4" | "N3" | "N2" | "N1",
  exam_date: Date,
  created_at: Date,
  updated_at: Date,
  
  // Plan Status
  status: "active" | "paused" | "completed" | "abandoned",
  start_date: Date,
  
  // Calculated Fields
  total_days: Number,
  days_remaining: Number,
  
  // Current Progress
  current_milestone_id: String,
  overall_progress_percent: Number,
  
  // Settings
  daily_study_minutes: Number,        // User's target (e.g., 30, 60, 90)
  study_days_per_week: Number,        // 5, 6, 7
  preferred_focus: ["vocabulary", "grammar", "kanji", "reading", "listening"],
}
```

### 1.2 Milestone Collection

**Purpose:** Define milestones within each plan

```javascript
// Collection: milestones
{
  _id: ObjectId,
  plan_id: ObjectId,                  // Reference to study_plan
  
  // Milestone Definition
  milestone_number: Number,           // 1, 2, 3...
  title: String,                      // "Master N5 Vocabulary Basics"
  description: String,
  category: "vocabulary" | "grammar" | "kanji" | "reading" | "listening" | "mixed",
  
  // Timeline
  target_start_date: Date,
  target_end_date: Date,
  actual_start_date: Date | null,
  actual_end_date: Date | null,
  
  // Criteria
  criteria: [{
    type: "vocab_count" | "kanji_count" | "grammar_points" | "quiz_score" | "reading_speed",
    target_value: Number,
    current_value: Number,
    unit: String,                     // "words", "characters", "patterns", "%", "wpm"
  }],
  
  // Status
  status: "pending" | "in_progress" | "completed" | "overdue",
  progress_percent: Number,
  
  // Linked Activities
  linked_quiz_ids: [ObjectId],
  linked_flashcard_decks: [String],
}
```

### 1.3 Daily Task Collection

**Purpose:** Store generated daily/weekly tasks

```javascript
// Collection: daily_tasks
{
  _id: ObjectId,
  plan_id: ObjectId,
  milestone_id: ObjectId,
  user_id: String,
  
  // Task Definition
  date: Date,
  task_type: "flashcard" | "quiz" | "reading" | "grammar_lesson" | "assessment",
  title: String,
  description: String,
  
  // Task Content
  content_ref: {
    type: "flashcard_deck" | "quiz" | "reading_passage" | "grammar_point",
    id: String,
  },
  estimated_minutes: Number,
  
  // Completion
  status: "pending" | "completed" | "skipped",
  completed_at: Date | null,
  score: Number | null,               // For quizzes/assessments
}
```

### 1.4 Plan Template Collection (Public)

**Purpose:** Pre-defined plan templates accessible without login

```javascript
// Collection: plan_templates
{
  _id: ObjectId,
  target_level: String,
  duration_weeks: Number,             // 12, 24, 36, 52
  title: String,                      // "3-Month N5 Intensive"
  description: String,
  
  // Template milestones (embedded, not requiring MongoDB refs)
  milestones: [{
    week_start: Number,
    week_end: Number,
    title: String,
    category: String,
    criteria: [{...}],
  }],
  
  // Requirements/Recommendations
  daily_minutes_recommended: Number,
  is_public: Boolean,
}
```

### 1.5 Tasks

- [ ] Create MongoDB collections and indexes
- [ ] Define TypeScript/Python types
- [ ] Create plan templates for all JLPT levels (N5-N1)
- [ ] Seed 3 template durations per level (3-month, 6-month, 1-year)

---

## Phase 2: Plan Generation Service (Flask)

### 2.1 API Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/f-api/v1/plan-templates` | No | List public templates |
| `GET` | `/f-api/v1/plan-templates/:id` | No | Get template details |
| `POST` | `/f-api/v1/study-plans` | Yes | Create personalized plan |
| `GET` | `/f-api/v1/study-plans` | Yes | Get user's plans |
| `GET` | `/f-api/v1/study-plans/:id` | Yes | Get plan details |
| `PATCH` | `/f-api/v1/study-plans/:id` | Yes | Update plan settings |
| `DELETE` | `/f-api/v1/study-plans/:id` | Yes | Abandon plan |

### 2.2 Plan Generation Logic

```python
def generate_plan(user_id, target_level, exam_date, settings):
    """
    Generate a personalized study plan.
    
    1. Calculate total days until exam
    2. Select appropriate template
    3. Scale milestones to fit timeline
    4. Create milestone documents
    5. Return plan overview
    """
    
    total_days = (exam_date - today).days
    
    # Select base template
    template = select_template(target_level, total_days)
    
    # Generate milestones
    milestones = []
    for template_milestone in template.milestones:
        milestone = scale_milestone(template_milestone, total_days)
        milestones.append(milestone)
    
    # Create plan document
    plan = {
        "user_id": user_id,
        "target_level": target_level,
        "exam_date": exam_date,
        "total_days": total_days,
        "milestones": milestones,
        ...
    }
    
    return plan
```

### 2.3 JLPT Level Requirements (Reference Data)

| Level | Vocabulary | Kanji | Grammar Points |
|-------|------------|-------|----------------|
| N5 | 800 | 100 | 80 |
| N4 | 1,500 | 300 | 165 |
| N3 | 3,000 | 600 | 200 |
| N2 | 6,000 | 1,000 | 200 |
| N1 | 10,000 | 2,000 | 250 |

### 2.4 Tasks

- [ ] Create `study_plan.py` module in Flask
- [ ] Implement plan generation algorithm
- [ ] Create template seeding script
- [ ] Write unit tests for plan generation

---

## Phase 3: Frontend - Plan Setup & Overview

### 3.1 Routes

| Route | Component | Auth | Purpose |
|-------|-----------|------|---------|
| `/study-plan` | `StudyPlanLanding` | No | Feature intro + templates |
| `/study-plan/setup` | `PlanSetup` | Yes | Create new plan |
| `/study-plan/dashboard` | `PlanDashboard` | Yes | Active plan overview |
| `/study-plan/milestones` | `MilestoneList` | Yes | All milestones |
| `/study-plan/today` | `TodaysTasks` | Yes | Daily tasks |

### 3.2 Landing Page (Public)

**Components:**
- Hero section explaining the feature
- Template previews (N5-N1)
- "Get Started" CTA (redirects to login if needed)
- Sample milestone timeline visualization

### 3.3 Plan Setup Flow

1. **Select Target Level** (N5-N1 cards)
2. **Select Exam Date** (Date picker with JLPT exam dates highlighted)
3. **Configure Preferences**
   - Daily study time (15/30/60/90 min)
   - Days per week (5/6/7)
   - Focus areas (optional)
4. **Review & Confirm**
   - Show generated milestones preview
   - Estimated daily workload
   - Start date

### 3.4 Dashboard UI

**Layout:**
- Progress ring (overall %)
- Days until exam countdown
- Current milestone card
- Today's tasks preview
- Weekly activity heatmap
- Quick actions (Start Quiz, Review Flashcards)

### 3.5 Tasks

- [ ] Create `frontend-next/src/app/study-plan/` route folder
- [ ] Implement landing page with templates
- [ ] Build plan setup wizard
- [ ] Create dashboard with progress visualization
- [ ] Add sidebar navigation item

---

## Phase 4: Milestone Tracking & Progress

### 4.1 Progress Calculation

```python
def calculate_milestone_progress(milestone):
    """Calculate progress based on criteria."""
    criteria_scores = []
    
    for criterion in milestone.criteria:
        if criterion.target_value > 0:
            progress = (criterion.current_value / criterion.target_value) * 100
            criteria_scores.append(min(progress, 100))
    
    return sum(criteria_scores) / len(criteria_scores) if criteria_scores else 0
```

### 4.2 Criteria Types

| Type | Source | Calculation |
|------|--------|-------------|
| `vocab_count` | SRS flashcard states | Count of "easy" rated vocab |
| `kanji_count` | SRS flashcard states | Count of "easy" rated kanji |
| `grammar_points` | Lesson completion | Completed grammar lessons |
| `quiz_score` | Quiz attempts | Average score on linked quizzes |
| `reading_speed` | Reading exercises | Words per minute |

### 4.3 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/f-api/v1/milestones/:id` | Get milestone details |
| `PATCH` | `/f-api/v1/milestones/:id/complete` | Manually mark complete |
| `GET` | `/f-api/v1/study-plans/:id/progress` | Get full progress report |

### 4.4 Tasks

- [ ] Implement progress calculation logic
- [ ] Connect to existing SRS/Quiz data
- [ ] Build milestone detail page
- [ ] Add progress update triggers

---

## Phase 5: Daily/Weekly Task Generation

### 5.1 Task Generation Algorithm

```python
def generate_daily_tasks(plan, date):
    """
    Generate tasks for a specific date.
    
    Balance:
    - Milestone requirements
    - User's daily time budget
    - Previous performance
    - Spaced repetition due cards
    """
    
    tasks = []
    remaining_minutes = plan.daily_study_minutes
    current_milestone = get_current_milestone(plan)
    
    # Priority 1: SRS due cards (always include)
    due_cards = get_due_flashcards(plan.user_id)
    if due_cards:
        tasks.append({
            "type": "flashcard",
            "title": f"Review {len(due_cards)} due cards",
            "estimated_minutes": min(len(due_cards) * 0.5, 15),
        })
        remaining_minutes -= tasks[-1]["estimated_minutes"]
    
    # Priority 2: Milestone-specific tasks
    for criterion in current_milestone.criteria:
        if criterion.current_value < criterion.target_value:
            task = generate_task_for_criterion(criterion, remaining_minutes)
            if task:
                tasks.append(task)
                remaining_minutes -= task["estimated_minutes"]
    
    return tasks
```

### 5.2 Task Types

| Type | Content | Duration |
|------|---------|----------|
| `flashcard_review` | Due SRS cards | 5-15 min |
| `new_vocab` | Learn new vocabulary | 10-20 min |
| `grammar_lesson` | Study grammar point | 15-30 min |
| `quiz` | Take practice quiz | 10-20 min |
| `reading` | Reading exercise | 15-30 min |
| `assessment` | Periodic test | 30-60 min |

### 5.3 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/f-api/v1/daily-tasks` | Get today's tasks |
| `GET` | `/f-api/v1/daily-tasks?date=YYYY-MM-DD` | Get tasks for date |
| `PATCH` | `/f-api/v1/daily-tasks/:id/complete` | Mark task complete |
| `POST` | `/f-api/v1/daily-tasks/regenerate` | Regenerate today's tasks |

### 5.4 Tasks

- [ ] Implement task generation algorithm
- [ ] Connect to SRS for due cards
- [ ] Build "Today's Tasks" UI
- [ ] Add task completion tracking

---

## Phase 6: Chatbot Integration

### 6.1 Study Plan Context for Hanachan

Add study plan context to chatbot conversations:

```python
def get_study_context(user_id):
    """Get user's study context for chatbot."""
    plan = get_active_plan(user_id)
    if not plan:
        return None
    
    return {
        "target_level": plan.target_level,
        "days_until_exam": plan.days_remaining,
        "current_milestone": get_current_milestone(plan),
        "recent_performance": get_recent_quiz_scores(user_id),
        "weak_areas": get_weak_areas(user_id),
        "todays_tasks": get_daily_tasks(user_id),
    }
```

### 6.2 Chatbot Capabilities

| Intent | Response |
|--------|----------|
| "What should I study?" | Recommend based on today's tasks |
| "I'm struggling with X" | Suggest extra practice, adjust focus |
| "Show my progress" | Summary of milestone progress |
| "Change my study time" | Update plan settings |
| "I missed yesterday" | Offer catch-up plan |

### 6.3 Tasks

- [ ] Add study context endpoint
- [ ] Update Hanachan to fetch study context
- [ ] Implement study-aware responses
- [ ] Add plan adjustment via chat

---

## Phase 7: Assessment Scheduling

### 7.1 Assessment Types

| Type | Frequency | Purpose |
|------|-----------|---------|
| Diagnostic | At plan start | Baseline measurement |
| Milestone Check | End of each milestone | Verify mastery |
| Weekly Review | Weekly | Track progress |
| Mock Exam | Monthly | Full JLPT simulation |

### 7.2 Scheduling Logic

```python
def schedule_assessments(plan):
    """Auto-schedule assessments based on plan."""
    assessments = []
    
    # Diagnostic test at start
    assessments.append({
        "type": "diagnostic",
        "date": plan.start_date,
        "level": plan.target_level,
    })
    
    # Milestone checks
    for milestone in plan.milestones:
        assessments.append({
            "type": "milestone_check",
            "date": milestone.target_end_date,
            "milestone_id": milestone._id,
        })
    
    # Mock exams (monthly)
    ...
    
    return assessments
```

### 7.3 Integration with Quiz System

- Use existing Quiz infrastructure
- Create specific quiz types: `diagnostic`, `milestone_check`, `mock_exam`
- Results update milestone criteria

### 7.4 Tasks

- [ ] Add assessment scheduling to plan generation
- [ ] Create diagnostic quiz generation
- [ ] Connect assessment results to milestones
- [ ] Build assessment calendar UI

---

## Phase 8: Adaptive Plan Adjustment

### 8.1 Adjustment Triggers

| Trigger | Action |
|---------|--------|
| Milestone overdue | Extend deadline, add extra tasks |
| High quiz scores | Accelerate to next milestone |
| Low quiz scores | Add review tasks, slow pace |
| Missed days | Redistribute tasks |
| Exam date change | Recalculate all milestones |

### 8.2 Rebalancing Algorithm

```python
def rebalance_plan(plan, trigger):
    """Adjust plan based on performance."""
    
    if trigger == "overdue_milestone":
        # Option 1: Extend current, compress future
        # Option 2: Mark as incomplete, move on
        pass
    
    elif trigger == "ahead_of_schedule":
        # Accelerate milestones
        # Add enrichment content
        pass
    
    elif trigger == "exam_date_changed":
        # Recalculate all milestone dates
        # Adjust daily workload
        pass
    
    return updated_plan
```

### 8.3 Tasks

- [ ] Implement rebalancing triggers
- [ ] Add plan adjustment API
- [ ] Create adjustment notification system
- [ ] Build "Plan Updated" UI feedback

---

## Implementation Order

```
Week 1:
├── Day 1-2: Phase 1 (Data Models + Templates)
├── Day 3-4: Phase 2 (Plan Generation Service)
└── Day 5: Phase 3 Start (Landing Page)

Week 2:
├── Day 1-2: Phase 3 (Setup + Dashboard)
├── Day 3: Phase 4 (Milestone Tracking)
├── Day 4-5: Phase 5 (Daily Tasks)

Week 3:
├── Day 1-2: Phase 6 (Chatbot Integration)
├── Day 3: Phase 7 (Assessments)
├── Day 4-5: Phase 8 (Adaptive Adjustment)
```

---

## Success Criteria

### Functional
- [ ] User can browse plan templates without login
- [ ] User can create personalized plan
- [ ] Milestones are generated with correct dates
- [ ] Daily tasks reflect current milestone
- [ ] Progress updates from SRS/Quiz activity
- [ ] Chatbot answers study-related questions

### Non-Functional
- [ ] Plan generation < 2 seconds
- [ ] Dashboard loads < 1 second
- [ ] Mobile-responsive UI
- [ ] Works offline (cached plan data)

### Quality
- [ ] Unit tests for plan generation
- [ ] Integration tests for progress calculation
- [ ] E2E test for complete plan creation flow

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| MongoDB | ✅ Ready | New collections |
| Flask Backend | ✅ Ready | New module |
| Quiz System | ✅ Ready | Assessment integration |
| SRS/Flashcards | ✅ Ready | Progress tracking |
| Hanachan AI | ✅ Ready | Context endpoint |
| Frontend-Next | ✅ Ready | New pages |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Complex plan generation | Start with simple linear plans |
| Inaccurate progress tracking | Use conservative estimates |
| Chatbot confusion | Fallback to generic responses |
| User abandonment | Send reminder notifications |

---

## Getting Started

**Immediate Next Steps:**

1. Create plan template data for all JLPT levels
2. Implement basic plan generation endpoint
3. Build plan setup wizard UI
4. Add "Study Plan" to sidebar navigation
5. Create simple dashboard with countdown

---

**End of Plan**
