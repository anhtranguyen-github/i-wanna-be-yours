# Quiz & Exercise Implementation Plan

Based on: `quizz.md` (UC3.4 – Extended)

---

## Executive Summary

This plan implements a **unified Quiz & Exercise system** supporting three quiz origins:
1. **System-defined quizzes** (static JLPT content)
2. **AI-generated quizzes** (from Hanachan chatbot)
3. **User-created quizzes** (teachers/advanced users)

The system integrates with existing **SRS (Spaced Repetition)** and **AI Feedback** systems.

---

## Phase Overview

| Phase | Description | Duration |
|-------|-------------|----------|
| **Phase 1** | Data Models & Database Schema | 1-2 days |
| **Phase 2** | Core Backend Services (Flask) | 2-3 days |
| **Phase 3** | Frontend Quiz Player UI | 2-3 days |
| **Phase 4** | SRS Integration | 1 day |
| **Phase 5** | AI Feedback Integration | 1 day |
| **Phase 6** | Quiz Authoring UI (Optional) | 2-3 days |

**Total Estimated:** 9-13 days

---

## Phase 1: Data Models & Database Schema

### 1.1 Quiz Definition Collection

**Purpose:** Store quiz metadata and questions

```javascript
// Collection: quizzes
{
  _id: ObjectId,
  title: String,
  description: String,
  origin: "system" | "chatbot" | "manual",
  
  // Origin-specific metadata
  author_id: String | null,        // For manual quizzes
  session_id: String | null,       // For chatbot-generated
  
  // Quiz configuration
  jlpt_level: "N5" | "N4" | "N3" | "N2" | "N1" | "mixed",
  category: "grammar" | "vocabulary" | "kanji" | "reading" | "mixed",
  time_limit_seconds: Number | null,
  
  // Questions array
  questions: [QuestionSchema],
  
  // Lifecycle
  is_public: Boolean,
  is_active: Boolean,
  created_at: Date,
  expires_at: Date | null,        // For temporary AI quizzes
}
```

### 1.2 Question Schema (Embedded)

```javascript
// Embedded in Quiz document
{
  question_id: String,            // UUID for tracking
  question_type: String,          // See supported types below
  content: {
    prompt: String,               // Main question text
    passage: String | null,       // For reading comprehension
    options: [String] | null,     // For multiple choice
    correct_answer: Mixed,        // Type depends on question_type
    scoring_rule: "binary" | "partial",
  },
  
  // SRS Integration
  linked_flashcard_ids: [String], // References to SRS flashcards
  learning_points: [String],      // Grammar points, vocab items
  
  points: Number,                 // Max score for this question
}
```

### 1.3 Supported Question Types

| Type Key | Description | Scoring |
|----------|-------------|---------|
| `grammar_fill_blank` | Fill in the blank | Binary |
| `grammar_sentence_order` | Sentence assembly | Partial (order matters) |
| `vocab_reading` | Select correct reading | Binary |
| `vocab_synonym` | Select synonym | Binary |
| `kanji_reading` | Kanji to reading | Binary |
| `kanji_meaning` | Kanji to meaning | Binary |
| `reading_comprehension` | Passage-based MCQ | Binary |

### 1.4 Quiz Attempt Collection

**Purpose:** Store user submissions and results

```javascript
// Collection: quiz_attempts
{
  _id: ObjectId,
  user_id: String,
  quiz_id: ObjectId | null,       // null for embedded quizzes
  quiz_origin: "system" | "chatbot" | "manual",
  
  // Timing
  started_at: Date,
  completed_at: Date,
  time_spent_seconds: Number,
  
  // Scoring
  total_score: Number,
  max_score: Number,
  percentage: Number,
  
  // Per-question breakdown
  answers: [{
    question_id: String,
    user_answer: Mixed,
    is_correct: Boolean,
    points_earned: Number,
    points_possible: Number,
  }],
  
  // Weak areas for SRS/AI
  weak_items: [{
    flashcard_id: String | null,
    learning_point: String,
    question_type: String,
  }],
  
  // Feedback
  ai_feedback_requested: Boolean,
  ai_feedback_id: String | null,
}
```

### 1.5 Tasks

- [ ] Create MongoDB schema definitions
- [ ] Add indexes for efficient queries
- [ ] Create seed data for system quizzes (1 per category/level)

---

## Phase 2: Core Backend Services (Flask)

### 2.1 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/f-api/v1/quizzes` | List available quizzes (filtered) |
| `GET` | `/f-api/v1/quizzes/:id` | Get quiz for taking |
| `POST` | `/f-api/v1/quizzes` | Create custom quiz |
| `POST` | `/f-api/v1/quizzes/:id/submit` | Submit quiz attempt |
| `GET` | `/f-api/v1/quiz-attempts` | User's attempt history |
| `GET` | `/f-api/v1/quiz-attempts/:id` | Specific attempt details |

### 2.2 Quiz Submission Flow

```
POST /f-api/v1/quizzes/:id/submit
  ↓
1. Validate submission structure
  ↓
2. Load quiz definition (or embedded content)
  ↓
3. Score each answer
  ↓
4. Calculate totals
  ↓
5. Identify weak items
  ↓
6. Save attempt record
  ↓
7. Trigger SRS updates (async)
  ↓
8. Trigger AI feedback (async, optional)
  ↓
9. Return result summary
```

### 2.3 Scoring Engine

```python
# Pseudocode for scoring service

def score_submission(quiz, user_answers):
    results = []
    weak_items = []
    
    for question in quiz.questions:
        answer = find_user_answer(user_answers, question.question_id)
        
        scorer = get_scorer(question.question_type)
        result = scorer.score(question, answer)
        
        results.append({
            "question_id": question.question_id,
            "user_answer": answer,
            "is_correct": result.is_correct,
            "points_earned": result.points,
            "points_possible": question.points,
        })
        
        if not result.is_correct:
            weak_items.extend(extract_weak_items(question))
    
    return {
        "answers": results,
        "weak_items": weak_items,
        "total_score": sum(r.points_earned for r in results),
        "max_score": sum(q.points for q in quiz.questions),
    }
```

### 2.4 Scorer Implementations

Each question type needs a scorer:

| Scorer | Logic |
|--------|-------|
| `BinaryScorer` | Exact match → full points or zero |
| `PartialOrderScorer` | Ordered items → partial credit for correct subsequences |
| `MultiSelectScorer` | Multiple correct answers → partial for each correct |

### 2.5 Tasks

- [ ] Create `quiz_service.py` module in Flask
- [ ] Implement quiz CRUD endpoints
- [ ] Implement submission endpoint with validation
- [ ] Create scoring engine with pluggable scorers
- [ ] Add error handling and logging
- [ ] Write unit tests for scorers

---

## Phase 3: Frontend Quiz Player UI

### 3.1 Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/practice` | `PracticePage` | Landing (already created) |
| `/practice/quiz` | `QuizListPage` | Browse available quizzes |
| `/practice/quiz/:id` | `QuizPlayerPage` | Take a quiz |
| `/practice/quiz/:id/result` | `QuizResultPage` | View results |

### 3.2 Quiz Player Component

Features:
- Question navigation (next/prev/jump)
- Timer (optional per quiz)
- Progress indicator
- Answer input based on question type
- Submit confirmation
- Auto-save draft answers

### 3.3 Question Type Renderers

| Type | UI Component |
|------|--------------|
| Multiple Choice | Radio buttons |
| Fill-in-blank | Text input with sentence context |
| Sentence Order | Drag-and-drop ordering |
| Reading | Passage display + MCQ |

### 3.4 Result View

- Score summary
- Per-question review (show correct answers)
- Weak areas breakdown
- "Study weak items" CTA (link to flashcards)
- AI feedback display (if available)

### 3.5 Tasks

- [ ] Create `/practice/quiz/page.tsx` (quiz list)
- [ ] Create `/practice/quiz/[id]/page.tsx` (quiz player)
- [ ] Create `/practice/quiz/[id]/result/page.tsx` (results)
- [ ] Build question type renderers
- [ ] Implement quiz state management (useReducer or context)
- [ ] Add timer functionality
- [ ] Style with existing design system

---

## Phase 4: SRS Integration

### 4.1 Integration Point

After quiz submission, update flashcard learning state.

### 4.2 SRS Update Logic

```python
def update_srs_from_quiz(user_id, weak_items, quiz_origin):
    for item in weak_items:
        if item.flashcard_id:
            # Load current SRS state
            flashcard = load_flashcard(user_id, item.flashcard_id)
            
            # Apply penalty based on quiz origin
            weight = get_penalty_weight(quiz_origin)
            
            # Update ease factor and next review
            new_state = apply_srs_algorithm(
                flashcard,
                is_correct=False,
                weight=weight
            )
            
            save_flashcard_state(flashcard, new_state)
```

### 4.3 Quiz Origin Weighting

| Origin | Weight | Rationale |
|--------|--------|-----------|
| `system` | 1.0 | Full impact (formal test) |
| `manual` | 0.8 | High impact (teacher test) |
| `chatbot` | 0.5 | Moderate impact (practice) |

### 4.4 Tasks

- [ ] Extend existing SRS service with quiz integration
- [ ] Add batch update support
- [ ] Implement weighted penalty system
- [ ] Test with existing flashcard data

---

## Phase 5: AI Feedback Integration

### 5.1 Feedback Request Format

After quiz completion, send to AI system:

```json
{
  "user_id": "...",
  "quiz_id": "...",
  "quiz_origin": "system",
  "jlpt_level": "N3",
  "score_percentage": 75,
  "weak_areas": [
    {
      "type": "grammar",
      "learning_points": ["てform", "conditional"],
      "question_count": 3,
      "incorrect_count": 2
    }
  ],
  "request_type": "post_quiz_feedback"
}
```

### 5.2 AI Response Usage

- Display personalized feedback in result page
- Suggest specific flashcard decks
- Recommend grammar/vocab lessons

### 5.3 Tasks

- [ ] Define feedback request schema
- [ ] Add endpoint to Hanachan service
- [ ] Integrate feedback display in result page
- [ ] Handle async feedback generation (polling or websocket)

---

## Phase 6: Quiz Authoring UI (Optional)

### 6.1 Features

- Create custom quizzes
- Select questions from question bank
- Set metadata (title, level, time limit)
- Preview quiz
- Share quiz (generate link)

### 6.2 Target Users

- Teachers (create class quizzes)
- Advanced learners (self-test)

### 6.3 Tasks

- [ ] Create `/practice/quiz/create/page.tsx`
- [ ] Build question editor component
- [ ] Implement question bank search
- [ ] Add preview mode
- [ ] Generate shareable links

---

## Implementation Order (Recommended)

```
Week 1:
├── Day 1-2: Phase 1 (Data Models)
├── Day 3-4: Phase 2 (Backend Services)
└── Day 5: Phase 4 (SRS Integration)

Week 2:
├── Day 1-3: Phase 3 (Frontend UI)
├── Day 4: Phase 5 (AI Feedback)
└── Day 5: Testing & Polish

Week 3 (Optional):
└── Phase 6 (Quiz Authoring)
```

---

## Success Criteria

### Functional
- [ ] User can take system-defined quizzes
- [ ] Quiz is scored correctly for all question types
- [ ] Results are persisted and viewable
- [ ] Incorrect answers update SRS flashcards
- [ ] AI feedback is generated (optional feature)

### Non-Functional
- [ ] Quiz player loads in < 2 seconds
- [ ] Submission completes in < 1 second
- [ ] Mobile-responsive UI
- [ ] Graceful error handling

### Quality
- [ ] Unit tests for scoring engine
- [ ] Integration tests for submission flow
- [ ] E2E test for complete quiz flow

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Flask Backend | ✅ Ready | Add new module |
| MongoDB | ✅ Ready | New collections |
| SRS System | ✅ Ready | Extend existing |
| Hanachan AI | ✅ Ready | New endpoint |
| Frontend-Next | ✅ Ready | New pages |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Complex scoring logic | Start with binary scoring, add partial later |
| AI quiz generation timing | Store generated quizzes immediately |
| SRS update conflicts | Use atomic operations, queue heavy updates |
| Large quiz payloads | Paginate questions, lazy load passages |

---

## Getting Started

**Immediate Next Steps:**

1. Create MongoDB collections with indexes
2. Seed 5 sample quizzes (1 per JLPT level)
3. Implement basic `GET /quizzes` endpoint
4. Build minimal quiz player UI
5. Add submit endpoint with binary scoring

---

**End of Plan**
