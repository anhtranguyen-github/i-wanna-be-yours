# JLPT Features Implementation Plan

**Created:** 2025-12-19  
**Status:** Planning  
**Scope:** `/jlpt` page enhancements - Create New Exam, Personal Collections, Timer

---

## Overview

This plan covers the implementation of four key features for the JLPT practice page:

1. **Create New Exam Button & Modal** - A new button to open a creation panel with configuration options and integrated chat
2. **Personal Collections** - Store exam results and user-created items 
3. **Timer Functionality** - Ensure the clock/timer is fully functional

---

## Table of Contents

1. [Feature 1: Create New Exam Button & Modal](#feature-1-create-new-exam-button--modal)
2. [Feature 2: Personal Collections](#feature-2-personal-collections)
3. [Feature 3: Timer Fixes](#feature-3-timer-fixes)
4. [File Structure](#file-structure)
5. [Implementation Phases](#implementation-phases)
6. [Type Definitions](#type-definitions)
7. [Backend API Endpoints](#backend-api-endpoints)

---

## Feature 1: Create New Exam Button & Modal

### 1.1 UI Requirements

**Location:** Add a "Create New Exam" button to the `/jlpt` page header, next to the stats badge.

**Modal/Panel Design:**
- Full-screen slide-in panel (from right, similar to chat sidebar pattern)
- Two-column layout:
  - **Left Column:** Configuration form
  - **Right Column:** AI Chat assistant for exam creation

### 1.2 Configuration Options

Based on existing `ExamConfig` type in `/frontend-next/src/types/practice.ts`:

```typescript
interface NewExamFormState {
  title: string;
  description: string;
  mode: 'QUIZ' | 'SINGLE_EXAM' | 'FULL_EXAM';
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  skills: SkillType[];  // 'VOCABULARY' | 'GRAMMAR' | 'READING' | 'LISTENING'
  questionCount: number;
  timerMode: 'UNLIMITED' | 'JLPT_STANDARD' | 'CUSTOM';
  timeLimitMinutes?: number;
}
```

**Form Fields:**
1. **Title** (text input, required)
2. **Description** (textarea, optional)
3. **Mode Selector** (radio group: Quiz, Single Exam, Full Exam)
4. **JLPT Level** (dropdown: N5-N1)
5. **Skills** (multi-select checkboxes)
6. **Question Count** (number input, 5-100)
7. **Timer Mode** (radio: No limit, JLPT Standard, Custom)
8. **Time Limit** (conditional, shows when Custom selected)

### 1.3 Integrated Chat Bar

**Purpose:** Allow users to create exams via natural language

**Chat Integration Pattern (from `ChatMainArea.tsx`):**
- Reuse `aiTutorService` for AI interactions
- Message input with send button
- Streaming response display
- Quick prompts examples:
  - "Create a 20-question N3 grammar quiz"
  - "Make a full JLPT N2 practice exam"
  - "Generate a vocabulary quiz for N4 level"

**Chat → Form Sync:**
- AI responses can populate form fields
- AI can generate question content
- Preview generated exam before saving

### 1.4 Component Structure

```
/components/jlpt/
├── CreateExamModal.tsx          # Main modal container
├── ExamConfigForm.tsx           # Left panel - configuration form
├── ExamChatAssistant.tsx        # Right panel - AI chat
├── ExamPreview.tsx              # Preview generated exam
└── index.ts                     # Exports
```

### 1.5 Implementation Details

**CreateExamModal.tsx:**
```typescript
interface CreateExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExamCreated: (examId: string) => void;
}

// States:
// - Form state (config values)
// - Chat messages
// - Preview mode
// - Saving state
// - Generated questions
```

**Integration with Page:**
```typescript
// In /app/jlpt/page.tsx
const [showCreateModal, setShowCreateModal] = useState(false);

// Add button next to stats badge
<button onClick={() => setShowCreateModal(true)} className="btnPrimary">
  <Plus /> Create New Exam
</button>

<CreateExamModal 
  isOpen={showCreateModal}
  onClose={() => setShowCreateModal(false)}
  onExamCreated={(id) => router.push(`/jlpt/${id}`)}
/>
```

---

## Feature 2: Personal Collections

### 2.1 Data Structure

**Exam Results Collection:**
```typescript
interface ExamAttempt {
  id: string;
  examId: string;
  examTitle: string;
  level: JLPTLevel;
  mode: PracticeMode;
  completedAt: Date;
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  timeTakenSeconds: number;
  skillBreakdown: SkillBreakdown[];
  answers: UserAnswer[];  // For review
  passed: boolean;
}
```

**User-Created Items Collection:**
```typescript
interface UserExam {
  id: string;
  userId: string;
  config: ExamConfig;
  questions: Question[];
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  origin: 'manual' | 'chatbot';
}
```

### 2.2 UI Components

**Personal Collections Tab on /jlpt page:**

Add a tabbed interface or collapsible section:

```
┌──────────────────────────────────────────────────────────────┐
│ JLPT Practice                                    [Create Exam]│
├──────────────────────────────────────────────────────────────┤
│ [All Exams] [My Results] [My Exams]                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Mode Selector | Filter Bar                                  │
│                                                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                        │
│  │ Exam 1  │ │ Exam 2  │ │ Exam 3  │  ...                   │
│  └─────────┘ └─────────┘ └─────────┘                        │
└──────────────────────────────────────────────────────────────┘
```

**My Results Section:**
- List of completed attempts with:
  - Score percentage (color coded)
  - Date completed
  - Time taken
  - Level badge
  - "Review" button to revisit answers
  - "Retake" button

**My Exams Section:**
- User-created exams with:
  - Title & description
  - Question count
  - Edit/Delete actions
  - Share toggle (public/private)
  - Start button

### 2.3 Component Structure

```
/components/jlpt/
├── ...existing...
├── PersonalCollections.tsx      # Tabs container
├── MyResultsList.tsx            # Exam results history
├── MyExamsList.tsx              # User-created exams
├── ResultCard.tsx               # Single result display
├── UserExamCard.tsx             # Single user exam display
└── index.ts
```

### 2.4 State Management

**LocalStorage for guests:**
```typescript
// Key: 'hanabira_jlpt_results'
interface LocalResults {
  attempts: ExamAttempt[];
  lastUpdated: string;
}
```

**API for authenticated users:**
```
GET  /f-api/v1/jlpt/attempts          - List user's attempts
GET  /f-api/v1/jlpt/attempts/:id      - Get specific attempt
POST /f-api/v1/jlpt/attempts          - Save attempt result

GET  /f-api/v1/jlpt/exams             - List user's custom exams
GET  /f-api/v1/jlpt/exams/:id         - Get specific exam
POST /f-api/v1/jlpt/exams             - Create custom exam
PUT  /f-api/v1/jlpt/exams/:id         - Update exam
DEL  /f-api/v1/jlpt/exams/:id         - Delete exam
```

---

## Feature 3: Timer Fixes

### 3.1 Current Implementation Analysis

Current timer in `/app/jlpt/[examId]/page.tsx` (lines 58-81):

**Current Logic:**
```typescript
// Initialize timer
useEffect(() => {
  if (examConfig?.timerMode !== "UNLIMITED" && examConfig?.timeLimitMinutes) {
    setTimeRemaining(examConfig.timeLimitMinutes * 60);
  }
}, [examConfig]);

// Timer countdown
useEffect(() => {
  if (isSubmitted || !timeRemaining || examConfig?.timerMode === "UNLIMITED") return;
  
  const interval = setInterval(() => {
    setTimeRemaining((prev) => {
      if (prev <= 1) {
        clearInterval(interval);
        handleSubmit();
        return 0;
      }
      return prev - 1;
    });
  }, 1000);
  
  return () => clearInterval(interval);
}, [isSubmitted, examConfig?.timerMode]); // ⚠️ Missing timeRemaining dependency
```

### 3.2 Issues to Fix

1. **Missing dependency:** `timeRemaining` not in dependency array (but this is intentional to avoid restart)
2. **Timer not persisting:** Refreshing page resets timer
3. **No pause capability:** Cannot pause during exam
4. **handleSubmit reference:** Could be stale in closure

### 3.3 Improved Timer Implementation

```typescript
// Use useRef for timer to avoid closure issues
const timerRef = useRef<NodeJS.Timeout | null>(null);
const handleSubmitRef = useRef(handleSubmit);
handleSubmitRef.current = handleSubmit;

// Persist timer state to sessionStorage
useEffect(() => {
  if (examId && timeRemaining > 0) {
    sessionStorage.setItem(
      `jlpt_timer_${examId}`,
      JSON.stringify({ timeRemaining, startedAt: Date.now() })
    );
  }
}, [examId, timeRemaining]);

// Load persisted timer on mount
useEffect(() => {
  const saved = sessionStorage.getItem(`jlpt_timer_${examId}`);
  if (saved) {
    const { timeRemaining: savedTime, startedAt } = JSON.parse(saved);
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    const remaining = Math.max(0, savedTime - elapsed);
    setTimeRemaining(remaining);
  } else if (examConfig?.timerMode !== "UNLIMITED" && examConfig?.timeLimitMinutes) {
    setTimeRemaining(examConfig.timeLimitMinutes * 60);
  }
}, [examId, examConfig]);

// Timer with useCallback for stable reference
const tick = useCallback(() => {
  setTimeRemaining((prev) => {
    if (prev <= 1) {
      handleSubmitRef.current();
      return 0;
    }
    return prev - 1;
  });
}, []);

useEffect(() => {
  if (isSubmitted || examConfig?.timerMode === "UNLIMITED") {
    if (timerRef.current) clearInterval(timerRef.current);
    return;
  }
  
  timerRef.current = setInterval(tick, 1000);
  
  return () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };
}, [isSubmitted, examConfig?.timerMode, tick]);
```

### 3.4 Timer Display Enhancements

**Visual indicators:**
- Green: > 10 minutes remaining
- Yellow: 5-10 minutes (warning)
- Orange/Pulse: 1-5 minutes (urgent)
- Red/Flash: < 1 minute (critical)

```typescript
const getTimerStyles = (seconds: number) => {
  if (seconds > 600) return "bg-emerald-100 text-emerald-700";
  if (seconds > 300) return "bg-amber-100 text-amber-700";
  if (seconds > 60) return "bg-orange-100 text-orange-700 animate-pulse";
  return "bg-red-100 text-red-600 animate-bounce";
};
```

---

## File Structure

### New Files to Create

```
frontend-next/src/
├── app/jlpt/
│   └── page.tsx                      # UPDATE: Add create button, tabs
│
├── components/jlpt/
│   ├── index.ts                      # NEW
│   ├── CreateExamModal.tsx           # NEW
│   ├── ExamConfigForm.tsx            # NEW
│   ├── ExamChatAssistant.tsx         # NEW
│   ├── ExamPreview.tsx               # NEW
│   ├── PersonalCollections.tsx       # NEW
│   ├── MyResultsList.tsx             # NEW
│   ├── MyExamsList.tsx               # NEW
│   ├── ResultCard.tsx                # NEW
│   └── UserExamCard.tsx              # NEW
│
├── services/
│   └── jlptService.ts                # NEW: API client for JLPT endpoints
│
├── types/
│   └── practice.ts                   # UPDATE: Add new types
│
└── hooks/
    └── useExamTimer.ts               # NEW: Custom timer hook
```

### Files to Modify

1. `/app/jlpt/page.tsx` - Add create button, personal collections
2. `/app/jlpt/[examId]/page.tsx` - Fix timer implementation
3. `/types/practice.ts` - Add new type definitions
4. `/data/mockPractice.ts` - Support user-created exams

---

## Implementation Phases

### Phase 1: Timer Fixes (Priority: High)
**Estimated:** 2-3 hours

1. Create `useExamTimer.ts` hook
2. Update `/app/jlpt/[examId]/page.tsx` with fixed timer
3. Add session persistence
4. Improve timer visual feedback
5. Test edge cases (refresh, browser close, etc.)

### Phase 2: Create Exam Modal (Priority: High)
**Estimated:** 6-8 hours

1. Create component structure in `/components/jlpt/`
2. Build `ExamConfigForm.tsx` with all options
3. Build `ExamChatAssistant.tsx` with AI integration
4. Create `CreateExamModal.tsx` combining both
5. Build `ExamPreview.tsx` for generated exam preview
6. Integrate modal with `/app/jlpt/page.tsx`
7. Add form validation
8. Connect to backend (or mock for now)

### Phase 3: Personal Collections - Results (Priority: Medium)
**Estimated:** 4-5 hours

1. Create `jlptService.ts` with API client
2. Build `MyResultsList.tsx` component
3. Build `ResultCard.tsx` component
4. Add localStorage support for guests
5. Modify exam submit to save results
6. Add results tab to main page

### Phase 4: Personal Collections - User Exams (Priority: Medium)
**Estimated:** 4-5 hours

1. Build `MyExamsList.tsx` component
2. Build `UserExamCard.tsx` component
3. Connect create flow to save user exams
4. Add edit/delete functionality
5. Add share/visibility toggle
6. Integrate with existing exam flow

### Phase 5: Polish & Testing (Priority: High)
**Estimated:** 3-4 hours

1. Responsive design testing
2. Error handling improvements
3. Loading states
4. Empty states
5. Guest vs authenticated behavior
6. Accessibility

---

## Type Definitions

### Updates to `/types/practice.ts`

```typescript
// Add to existing file:

// ============= User Collections =============

export interface ExamAttempt {
  id: string;
  userId?: string;
  examId: string;
  examTitle: string;
  examMode: Exclude<PracticeMode, 'ALL'>;
  level: JLPTLevel;
  
  // Results
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  scorePercentage: number;
  passed: boolean;
  
  // Timing
  startedAt: Date | string;
  completedAt: Date | string;
  timeTakenSeconds: number;
  
  // Details
  skillBreakdown: SkillBreakdown[];
  answers: Record<string, UserAnswer>;
  
  // Metadata
  isStored: boolean;  // true if saved to backend
}

export interface UserCreatedExam {
  id: string;
  userId: string;
  
  // Config (extends ExamConfig)
  config: ExamConfig;
  questions: Question[];
  
  // Metadata
  origin: 'manual' | 'chatbot';
  createdAt: Date | string;
  updatedAt: Date | string;
  
  // Visibility
  isPublic: boolean;
  shareUrl?: string;
  
  // Stats
  timesAttempted: number;
  averageScore?: number;
}

// ============= Creation Form State =============

export interface CreateExamFormState {
  title: string;
  description: string;
  mode: Exclude<PracticeMode, 'ALL'>;
  level: JLPTLevel;
  skills: SkillType[];
  questionCount: number;
  timerMode: TimerMode;
  timeLimitMinutes: number | null;
  isPublic: boolean;
}

// ============= Chat Assistant =============

export interface ExamChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  
  // If message contains structured data
  examData?: Partial<CreateExamFormState>;
  generatedQuestions?: Question[];
}

// ============= API Types =============

export interface CreateExamRequest {
  config: Omit<ExamConfig, 'id'>;
  questions: Omit<Question, 'id'>[];
  origin: 'manual' | 'chatbot';
  isPublic: boolean;
}

export interface SaveAttemptRequest {
  examId: string;
  answers: Record<string, UserAnswer>;
  startedAt: string;
  completedAt: string;
}
```

---

## Backend API Endpoints

### Required Endpoints (Express Backend)

```typescript
// /backend/express/routes/jlpt.ts

// === Exam Attempts ===

// List user attempts
// GET /f-api/v1/jlpt/attempts?limit=20&offset=0
router.get('/attempts', authMiddleware, async (req, res) => {
  // Returns paginated list of user's exam attempts
});

// Get specific attempt
// GET /f-api/v1/jlpt/attempts/:attemptId
router.get('/attempts/:attemptId', authMiddleware, async (req, res) => {
  // Returns full attempt including answers for review
});

// Save new attempt
// POST /f-api/v1/jlpt/attempts
router.post('/attempts', authMiddleware, async (req, res) => {
  // Saves exam attempt results
});


// === User-Created Exams ===

// List user's exams
// GET /f-api/v1/jlpt/exams?limit=20&offset=0
router.get('/exams', authMiddleware, async (req, res) => {
  // Returns paginated list of user's created exams
});

// Get public exam (for sharing)
// GET /f-api/v1/jlpt/exams/:examId/public
router.get('/exams/:examId/public', async (req, res) => {
  // Returns exam if public, 404 if not
});

// Get user's exam
// GET /f-api/v1/jlpt/exams/:examId
router.get('/exams/:examId', authMiddleware, async (req, res) => {
  // Returns full exam with questions
});

// Create new exam
// POST /f-api/v1/jlpt/exams
router.post('/exams', authMiddleware, async (req, res) => {
  // Creates new exam from provided config and questions
});

// Update exam
// PUT /f-api/v1/jlpt/exams/:examId
router.put('/exams/:examId', authMiddleware, async (req, res) => {
  // Updates exam (only if user owns it)
});

// Delete exam
// DELETE /f-api/v1/jlpt/exams/:examId
router.delete('/exams/:examId', authMiddleware, async (req, res) => {
  // Deletes exam (only if user owns it)
});


// === AI Generation ===

// Generate exam via AI
// POST /f-api/v1/jlpt/generate
router.post('/generate', authMiddleware, async (req, res) => {
  // Uses AI to generate questions based on config/prompt
  // Returns generated questions for preview
});
```

### Database Schema (PostgreSQL)

```sql
-- Exam Attempts Table
CREATE TABLE jlpt_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  exam_id VARCHAR(255) NOT NULL,
  exam_title VARCHAR(255) NOT NULL,
  exam_mode VARCHAR(50) NOT NULL,
  level VARCHAR(10) NOT NULL,
  
  total_questions INT NOT NULL,
  correct_answers INT NOT NULL,
  incorrect_answers INT NOT NULL,
  unanswered_questions INT NOT NULL,
  score_percentage DECIMAL(5,2) NOT NULL,
  passed BOOLEAN NOT NULL,
  
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  time_taken_seconds INT NOT NULL,
  
  skill_breakdown JSONB,
  answers JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jlpt_attempts_user ON jlpt_attempts(user_id);
CREATE INDEX idx_jlpt_attempts_exam ON jlpt_attempts(exam_id);

-- User Created Exams Table
CREATE TABLE jlpt_user_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  mode VARCHAR(50) NOT NULL,
  level VARCHAR(10) NOT NULL,
  skills VARCHAR(50)[] NOT NULL,
  question_count INT NOT NULL,
  timer_mode VARCHAR(50) NOT NULL,
  time_limit_minutes INT,
  
  questions JSONB NOT NULL,
  origin VARCHAR(50) DEFAULT 'manual',
  
  is_public BOOLEAN DEFAULT FALSE,
  share_url VARCHAR(255),
  
  times_attempted INT DEFAULT 0,
  average_score DECIMAL(5,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jlpt_user_exams_user ON jlpt_user_exams(user_id);
CREATE INDEX idx_jlpt_user_exams_public ON jlpt_user_exams(is_public) WHERE is_public = TRUE;
```

---

## UI/UX Design Notes

### Create Exam Modal Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ← Create New Exam                                              [Save]  │
├─────────────────────────────────────────────────────────────────────────┤
│                         │                                               │
│   ┌─ Configuration ─┐   │   ┌─ AI Assistant ─────────────────────────┐ │
│   │                 │   │   │                                        │ │
│   │  Title: ____    │   │   │  💬 "Help me create an N3 grammar      │ │
│   │                 │   │   │      quiz with 15 questions"           │ │
│   │  Description:   │   │   │                                        │ │
│   │  ____________   │   │   │  🤖 "I'll create an N3 grammar quiz    │ │
│   │                 │   │   │      for you. Let me generate..."      │ │
│   │  Mode: ○ Quiz   │   │   │                                        │ │
│   │        ○ Single │   │   │  [Message history scrollable area]     │ │
│   │        ○ Full   │   │   │                                        │ │
│   │                 │   │   │                                        │ │
│   │  Level: [N3 ▼]  │   │   │                                        │ │
│   │                 │   │   │                                        │ │
│   │  Skills:        │   │   │                                        │ │
│   │  ☑ Vocabulary   │   │   │                                        │ │
│   │  ☑ Grammar      │   │   │                                        │ │
│   │  ☐ Reading      │   │   ├────────────────────────────────────────┤ │
│   │  ☐ Listening    │   │   │  [Type message...              ] [Send]│ │
│   │                 │   │   └────────────────────────────────────────┘ │
│   │  Questions: 20  │   │                                               │
│   │                 │   │   💡 Quick prompts:                          │
│   │  Timer: ○ None  │   │   • "Generate N4 vocab quiz"                 │
│   │         ○ JLPT  │   │   • "Create grammar practice"                │
│   │         ● Custom│   │   • "Make a listening test"                  │
│   │                 │   │                                               │
│   │  Time: 30 min   │   │                                               │
│   │                 │   │                                               │
│   └─────────────────┘   │                                               │
│                         │                                               │
└─────────────────────────────────────────────────────────────────────────┘
```

### Personal Collections Tabs

```
┌──────────────────────────────────────────────────────────────────────────┐
│ JLPT Practice                                           [+ Create Exam]  │
├──────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────┬──────────────┬────────────┐                              │
│ │ All Exams   │ My Results   │ My Exams   │                              │
│ └─────────────┴──────────────┴────────────┘                              │
├──────────────────────────────────────────────────────────────────────────┤
│ [If "My Results" tab selected]                                           │
│                                                                          │
│  📊 Your Exam History                           Filter: [Level ▼] [Date]│
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  N3 Grammar Exam              85%  ████████░░  Dec 18, 2024       │  │
│  │  15/18 correct · 12 min      [Review] [Retake]                    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  N4 Vocabulary Quiz           72%  ███████░░░  Dec 15, 2024       │  │
│  │  18/25 correct · 8 min       [Review] [Retake]                    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Testing Checklist

### Timer Tests
- [ ] Timer starts correctly on exam start
- [ ] Timer counts down accurately
- [ ] Timer persists on page refresh
- [ ] Timer auto-submits at 0
- [ ] UNLIMITED mode hides timer
- [ ] Visual warnings at 5min, 1min thresholds

### Create Exam Tests
- [ ] Modal opens/closes correctly
- [ ] Form validation works
- [ ] All configuration options work
- [ ] Chat sends/receives messages
- [ ] AI generates valid questions
- [ ] Preview shows generated exam
- [ ] Save creates exam successfully
- [ ] Guest user sees appropriate messaging

### Personal Collections Tests
- [ ] Results save after exam completion
- [ ] Results list loads correctly
- [ ] Results persist for authenticated users
- [ ] LocalStorage works for guests
- [ ] Review mode loads saved answers
- [ ] Retake starts fresh attempt
- [ ] User exams list loads correctly
- [ ] Edit/delete works on user exams
- [ ] Public/private toggle works

---

## Dependencies

### NPM Packages (Already Available)
- `lucide-react` - Icons
- `next/navigation` - Router
- React hooks for state management

### No New Dependencies Required
The implementation uses existing patterns from the codebase.

---

## Notes

1. **Priority Order:** Timer fixes → Create Modal → Results → User Exams
2. **Guest Experience:** All features should have graceful fallbacks for guests
3. **Existing Patterns:** Follow conventions from `/quiz/create` and `/chat` components
4. **Mobile Responsive:** All new components must be mobile-friendly
5. **Accessibility:** Include proper ARIA labels and keyboard navigation
