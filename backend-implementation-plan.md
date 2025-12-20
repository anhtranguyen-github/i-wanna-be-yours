# Backend Implementation Plan: Strategic Learning Frameworks

## Overview

This plan implements the backend services to support the enhanced Study Plan Dashboard's strategic frameworks (OKR, PACT, SMART), diagnostic priority matrix, context tracking, and review cycles. The plan is structured to match the frontend phases.

---

## Architecture Overview

### Services & Files

| Service | Path | Purpose |
|---------|------|---------|
| Strategy Framework | `backend/flask/modules/strategy_framework.py` | SMART, OKR, PACT logic |
| Diagnostic Engine | `backend/flask/modules/diagnostic_engine.py` | Priority matrix, error analysis |
| Context Tracker | `backend/flask/modules/context_tracker.py` | Mood/energy tracking |
| Review Cycles | `backend/flask/modules/review_cycles.py` | Daily/weekly/phase reviews |

### Database Collections (MongoDB)

```
flaskStudyPlanDB
├── user_content_mastery   # ⭐ NEW: Personal progress per content item
├── content_interactions   # ⭐ NEW: Every practice/review event
├── quiz_attempts          # ⭐ NEW: Quiz/test results
├── study_sessions         # ⭐ NEW: Session-level tracking
├── smart_goals            # SMART goal definitions
├── okr_objectives         # OKR objectives & key results
├── pact_commitments       # Daily PACT configurations
├── pact_actions_log       # Action completion history
├── context_checkins       # User context snapshots
├── priority_queue         # RED/YELLOW/GREEN items
├── error_analysis         # Error type tracking
├── review_cycles          # Weekly/phase review records
└── (existing collections remain)
```

---

## Phase 0: Content Mastery Data Model (Foundation)

> **CRITICAL**: This is the foundational layer that ALL strategic frameworks read from. Every vocabulary, grammar point, kanji, and quiz must track personal mastery status.

### 0.1 New Collection: `user_content_mastery`

This is the **per-user, per-item** tracking system - the source of truth for what users have learned.

```javascript
{
  _id: ObjectId,
  user_id: String,
  
  // Content Reference
  content_type: String,                // "vocabulary", "grammar", "kanji", "reading", "listening"
  content_id: String,                  // Reference to the actual content
  content_source: String,              // "core_2k", "jlpt_n3", "user_added", etc.
  
  // Basic Info (denormalized for performance)
  title: String,                       // e.g., "食べる", "〜ている", "日"
  jlpt_level: String,                  // "N5", "N4", "N3", "N2", "N1"
  category: String,                    // "verb", "particle", "joyo", etc.
  
  // ===== MASTERY STATUS =====
  status: String,                      // "new", "learning", "reviewing", "mastered", "burned"
  mastery_level: Number,               // 0-100 (granular)
  mastery_stage: Number,               // 1-8 (SRS stage)
  
  // ===== SRS SCHEDULING =====
  srs: {
    ease_factor: Number,               // Default 2.5, adjusts based on performance
    interval_days: Number,             // Current review interval
    next_review_date: Date,
    review_count: Number,
    correct_streak: Number,            // Consecutive correct answers
    lapse_count: Number                // Times dropped from mastered
  },
  
  // ===== PERFORMANCE STATS =====
  stats: {
    total_reviews: Number,
    correct_count: Number,
    incorrect_count: Number,
    accuracy_percent: Number,
    avg_response_time_ms: Number,
    last_response_time_ms: Number,
    time_spent_total_seconds: Number
  },
  
  // ===== SKILL BREAKDOWN (for multi-aspect content) =====
  skills: {
    // Vocabulary
    reading: { known: Boolean, accuracy: Number },
    meaning: { known: Boolean, accuracy: Number },
    writing: { known: Boolean, accuracy: Number },
    listening: { known: Boolean, accuracy: Number },
    
    // Grammar
    recognition: { known: Boolean, accuracy: Number },
    production: { known: Boolean, accuracy: Number },
    context_usage: { known: Boolean, accuracy: Number }
  },
  
  // ===== LEARNING HISTORY =====
  first_seen_at: Date,
  learned_at: Date,                    // When status became "reviewing"
  mastered_at: Date,                   // When status became "mastered"
  last_reviewed_at: Date,
  
  // ===== PRIORITY & DIAGNOSTICS =====
  priority: String,                    // "red", "yellow", "green"
  last_error_type: String,             // "knowledge_gap", "process_error", "careless"
  needs_attention: Boolean,
  
  // ===== LINKED CONTENT =====
  related_content_ids: [String],       // Related vocab/grammar
  linked_to_milestone_id: ObjectId,
  
  created_at: Date,
  updated_at: Date
}
```

### 0.2 New Collection: `content_interactions`

Every single practice event is logged here for analytics.

```javascript
{
  _id: ObjectId,
  user_id: String,
  mastery_id: ObjectId,                // Links to user_content_mastery
  
  // What happened
  interaction_type: String,            // "flashcard_review", "quiz_question", "lesson_complete", "practice_sentence"
  session_id: ObjectId,                // Links to study_sessions
  
  // Content
  content_type: String,
  content_id: String,
  question_type: String,               // "meaning_to_reading", "audio_to_text", "fill_blank", etc.
  
  // Result
  is_correct: Boolean,
  user_answer: String,
  correct_answer: String,
  score: Number,                       // 0-100 for partial credit
  
  // Timing
  response_time_ms: Number,
  timestamp: Date,
  
  // Context
  context_checkin_id: ObjectId,        // Links to mood/energy at time
  difficulty_setting: String,          // "easy", "normal", "hard"
  hint_used: Boolean,
  
  // SRS Impact
  srs_change: {
    old_interval: Number,
    new_interval: Number,
    old_stage: Number,
    new_stage: Number
  }
}
```

### 0.3 New Collection: `quiz_attempts`

Quiz and test results with detailed breakdown.

```javascript
{
  _id: ObjectId,
  user_id: String,
  
  // Quiz Info
  quiz_type: String,                   // "practice", "milestone_test", "jlpt_mock", "custom"
  quiz_id: ObjectId,
  session_id: ObjectId,
  
  // Results
  score_percent: Number,
  correct_count: Number,
  total_questions: Number,
  time_taken_seconds: Number,
  
  // Section Breakdown
  sections: [{
    section_type: String,              // "vocabulary", "grammar", "reading", "listening"
    score_percent: Number,
    correct_count: Number,
    total_questions: Number
  }],
  
  // Question Details
  questions: [{
    question_id: String,
    content_id: String,
    content_type: String,
    is_correct: Boolean,
    user_answer: String,
    correct_answer: String,
    time_spent_seconds: Number,
    error_type: String                 // If incorrect
  }],
  
  // Impact
  items_affected: [{
    mastery_id: ObjectId,
    old_status: String,
    new_status: String,
    priority_change: String            // "promoted", "demoted", "unchanged"
  }],
  
  timestamp: Date,
  context_checkin_id: ObjectId
}
```

### 0.4 New Collection: `study_sessions`

Session-level tracking for time and focus.

```javascript
{
  _id: ObjectId,
  user_id: String,
  plan_id: ObjectId,
  
  // Session Details
  session_type: String,                // "flashcard", "quiz", "lesson", "reading", "listening", "mixed"
  started_at: Date,
  ended_at: Date,
  duration_minutes: Number,
  
  // What was studied
  focus_area: String,                  // "vocabulary", "grammar", "kanji", "mixed"
  jlpt_level: String,
  milestone_id: ObjectId,
  
  // Results
  items_reviewed: Number,
  items_learned: Number,
  items_mastered: Number,
  accuracy_percent: Number,
  
  // Streaks
  contributes_to_streak: Boolean,
  streak_day_number: Number,
  
  // Context
  context_checkin_id: ObjectId,
  ai_recommended: Boolean,             // Was this session AI-suggested?
  
  // Device/Environment
  device_type: String,                 // "web", "mobile", "tablet"
  
  created_at: Date
}
```

### 0.5 API Endpoints for Content Mastery

```python
# backend/flask/modules/content_mastery.py

# ===== READ OPERATIONS =====

@mastery_bp.route('/mastery', methods=['GET'])
def get_user_mastery():
    """Get all mastery records for user with filters"""
    # Query: ?user_id=X&content_type=vocabulary&status=learning&jlpt_level=N3
    # Returns: Paginated list of mastery records
    pass

@mastery_bp.route('/mastery/<content_type>/<content_id>', methods=['GET'])
def get_item_mastery(content_type, content_id):
    """Get mastery status for a specific item"""
    # Returns: Full mastery record with history
    pass

@mastery_bp.route('/mastery/stats', methods=['GET'])
def get_mastery_stats():
    """Get aggregated mastery statistics"""
    # Query: ?user_id=X&jlpt_level=N3
    # Returns: { total: 500, mastered: 120, learning: 200, new: 180 }
    pass

@mastery_bp.route('/mastery/due', methods=['GET'])
def get_due_items():
    """Get items due for review"""
    # Query: ?user_id=X&limit=50
    # Returns: List of items where next_review_date <= now, sorted by priority
    pass

# ===== WRITE OPERATIONS =====

@mastery_bp.route('/mastery/<content_type>/<content_id>/start', methods=['POST'])
def start_learning(content_type, content_id):
    """Mark an item as started (new → learning)"""
    pass

@mastery_bp.route('/mastery/<mastery_id>/review', methods=['POST'])
def log_review(mastery_id):
    """Log a review result and update SRS"""
    # Body: { is_correct, response_time_ms, question_type, user_answer }
    # Updates: srs intervals, stats, status if threshold met
    pass

@mastery_bp.route('/mastery/<mastery_id>/reset', methods=['POST'])
def reset_item(mastery_id):
    """Reset an item to 'new' status"""
    pass

# ===== BULK OPERATIONS =====

@mastery_bp.route('/mastery/bulk-status', methods=['POST'])
def get_bulk_status():
    """Get mastery status for multiple items"""
    # Body: { content_ids: ["id1", "id2", ...] }
    # Returns: { "id1": { status: "mastered", ... }, "id2": { ... } }
    pass

@mastery_bp.route('/mastery/bulk-start', methods=['POST'])
def bulk_start_learning():
    """Start learning multiple items at once"""
    # Body: { content_ids: ["id1", "id2", ...], content_type: "vocabulary" }
    pass
```

### 0.6 Mastery Status Transition Logic

```python
def calculate_new_status(mastery: dict, is_correct: bool) -> str:
    """
    Determine new status based on review result.
    
    Status Flow:
    new → learning → reviewing → mastered → burned
    
    Transitions:
    - new → learning: First interaction
    - learning → reviewing: 3+ correct in row OR 80% accuracy over 5+ reviews
    - reviewing → mastered: SRS interval >= 21 days AND 90% accuracy
    - mastered → burned: SRS interval >= 120 days (4 months)
    - ANY → learning: Lapse (incorrect after mastered)
    """
    current_status = mastery['status']
    srs = mastery['srs']
    stats = mastery['stats']
    
    # Handle lapse
    if not is_correct and current_status in ['mastered', 'burned']:
        srs['lapse_count'] += 1
        return 'learning'
    
    # Update streak
    if is_correct:
        srs['correct_streak'] += 1
    else:
        srs['correct_streak'] = 0
    
    # Determine new status
    if current_status == 'new':
        return 'learning'
    
    elif current_status == 'learning':
        if srs['correct_streak'] >= 3 or (stats['total_reviews'] >= 5 and stats['accuracy_percent'] >= 80):
            return 'reviewing'
        return 'learning'
    
    elif current_status == 'reviewing':
        if srs['interval_days'] >= 21 and stats['accuracy_percent'] >= 90:
            return 'mastered'
        return 'reviewing'
    
    elif current_status == 'mastered':
        if srs['interval_days'] >= 120:
            return 'burned'
        return 'mastered'
    
    return current_status


def calculate_new_interval(mastery: dict, is_correct: bool, quality: int) -> int:
    """
    Calculate new SRS interval using SM-2 algorithm variant.
    
    Quality: 0-5 (0-2 = fail, 3-5 = pass with varying confidence)
    """
    srs = mastery['srs']
    
    if quality < 3:  # Failed
        srs['correct_streak'] = 0
        return 1  # Reset to 1 day
    
    # Adjust ease factor
    srs['ease_factor'] = max(1.3, srs['ease_factor'] + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))
    
    if srs['review_count'] == 0:
        return 1
    elif srs['review_count'] == 1:
        return 3
    else:
        return round(srs['interval_days'] * srs['ease_factor'])
```

### 0.7 Integration Points

The strategic frameworks read from this data:

| Framework | Reads From | Purpose |
|-----------|------------|---------|
| SMART Goals | `user_content_mastery.stats` | Calculate "Master 500 words" progress |
| OKR Key Results | `content_interactions` + `user_content_mastery` | Track velocity, project completion |
| PACT Actions | `study_sessions` | Verify daily action completion |
| Priority Matrix | `user_content_mastery.priority` | RED/YELLOW/GREEN classification |
| Review Cycles | All collections | Generate weekly summaries |

---

## Phase 1: SMART Goals Backend (Days 1-2)

### 1.1 New Collection: `smart_goals`

```javascript
{
  _id: ObjectId,
  user_id: String,
  plan_id: ObjectId,                   // Links to study_plan
  
  // SMART Dimensions
  title: String,
  specific: String,                    // Clear goal statement
  measurable_metric: String,           // "vocabulary_count", "quiz_score", etc.
  measurable_target: Number,           // Target value
  measurable_baseline: Number,         // Starting value
  achievable_confidence: Number,       // 0-100 AI-assessed
  relevant_jlpt_section: String,       // "vocabulary", "grammar", "reading", etc.
  time_bound_deadline: Date,
  
  // Success Criteria
  success_criteria: [{
    id: ObjectId,
    description: String,
    metric_type: String,               // "count", "percentage", "time"
    target_value: Number,
    current_value: Number,
    completed: Boolean,
    completed_at: Date
  }],
  
  // Linked OKRs
  linked_okr_ids: [ObjectId],
  
  // Status & Progress
  status: String,                      // "active", "completed", "overdue", "paused"
  progress_percent: Number,
  
  // AI Insights
  ai_confidence_score: Number,         // Hanachan's assessment
  ai_recommendations: [String],
  last_ai_analysis: Date,
  
  // Metadata
  created_at: Date,
  updated_at: Date,
  completed_at: Date
}
```

### 1.2 API Endpoints

```python
# backend/flask/modules/strategy_framework.py

@strategy_bp.route('/smart-goals', methods=['POST'])
def create_smart_goal():
    """Create a new SMART goal"""
    # Body: { plan_id, title, specific, measurable_*, time_bound_deadline, success_criteria }
    # Returns: Created SMART goal with ID
    pass

@strategy_bp.route('/smart-goals/<goal_id>', methods=['GET'])
def get_smart_goal(goal_id):
    """Get SMART goal with computed progress"""
    # Computes current progress from real data
    # Returns: Full goal with linked OKRs, AI insights
    pass

@strategy_bp.route('/smart-goals', methods=['GET'])
def list_smart_goals():
    """List all SMART goals for user/plan"""
    # Query: ?user_id=X or ?plan_id=X
    # Returns: List with summary data
    pass

@strategy_bp.route('/smart-goals/<goal_id>', methods=['PATCH'])
def update_smart_goal(goal_id):
    """Update SMART goal"""
    # Body: Partial update fields
    pass

@strategy_bp.route('/smart-goals/<goal_id>/progress', methods=['GET'])
def get_smart_progress(goal_id):
    """Calculate real-time progress from linked data"""
    # Aggregates from flashcard reviews, quiz scores, etc.
    pass

@strategy_bp.route('/smart-goals/<goal_id>/criteria/<criteria_id>/toggle', methods=['POST'])
def toggle_criterion(goal_id, criteria_id):
    """Toggle success criterion completion"""
    pass

@strategy_bp.route('/smart-goals/<goal_id>/ai-analyze', methods=['POST'])
def analyze_smart_goal(goal_id):
    """Run AI analysis on goal achievability"""
    # Returns: confidence score, recommendations, projected completion
    pass
```

### 1.3 Progress Calculation Logic

```python
def calculate_smart_progress(goal: dict) -> dict:
    """
    Calculate real progress for a SMART goal.
    
    Strategy:
    1. Identify metric type (vocab count, quiz score, etc.)
    2. Query actual user data from relevant collections
    3. Compare current vs baseline vs target
    4. Return progress percentage and trajectory
    """
    metric_handlers = {
        'vocabulary_count': get_vocab_count,
        'kanji_count': get_kanji_count,
        'grammar_points': get_grammar_count,
        'quiz_average': get_quiz_average,
        'flashcard_reviews': get_flashcard_count,
        'study_minutes': get_total_study_time,
    }
    
    handler = metric_handlers.get(goal['measurable_metric'])
    current_value = handler(goal['user_id'], goal['created_at'])
    
    baseline = goal['measurable_baseline']
    target = goal['measurable_target']
    
    progress = ((current_value - baseline) / (target - baseline)) * 100
    return {
        'current': current_value,
        'baseline': baseline,
        'target': target,
        'progress_percent': min(max(progress, 0), 100),
        'trajectory': calculate_trajectory(goal, current_value)
    }
```

---

## Phase 2: OKR System Backend (Days 2-3)

### 2.1 New Collection: `okr_objectives`

```javascript
{
  _id: ObjectId,
  user_id: String,
  plan_id: ObjectId,
  parent_smart_goal_id: ObjectId,      // Optional link to SMART goal
  
  // Objective
  objective: String,
  description: String,
  category: String,                    // "vocabulary", "grammar", "reading", etc.
  
  // Key Results
  key_results: [{
    id: ObjectId,
    title: String,
    metric_type: String,               // "count", "percentage", "time"
    current: Number,
    target: Number,
    unit: String,
    
    // Tracking
    trend: String,                     // "improving", "stable", "declining"
    velocity: Number,                  // units per day
    confidence: Number,                // 0-100
    projected_completion: Date,
    
    // Data source
    data_source: String,               // "flashcards", "quizzes", "study_sessions"
    contributing_task_types: [String],
    
    // History
    history: [{
      date: Date,
      value: Number
    }]
  }],
  
  // Aggregated
  progress_percent: Number,
  risk_level: String,                  // "low", "medium", "high"
  on_track: Boolean,
  blockers: [String],
  
  // Timeline
  deadline: Date,
  created_at: Date,
  updated_at: Date,
  completed_at: Date
}
```

### 2.2 API Endpoints

```python
@strategy_bp.route('/okr/objectives', methods=['POST'])
def create_okr():
    """Create OKR objective with key results"""
    pass

@strategy_bp.route('/okr/objectives/<okr_id>', methods=['GET'])
def get_okr(okr_id):
    """Get OKR with real-time KR values"""
    pass

@strategy_bp.route('/okr/objectives', methods=['GET'])
def list_okrs():
    """List OKRs for user/plan"""
    pass

@strategy_bp.route('/okr/objectives/<okr_id>/key-results/<kr_id>/update', methods=['POST'])
def update_key_result(okr_id, kr_id):
    """Manually update a key result value"""
    pass

@strategy_bp.route('/okr/objectives/<okr_id>/refresh', methods=['POST'])
def refresh_okr(okr_id):
    """Recalculate all KRs from live data"""
    pass

@strategy_bp.route('/okr/objectives/<okr_id>/health', methods=['GET'])
def get_okr_health(okr_id):
    """Get health assessment with blockers"""
    pass
```

### 2.3 Key Result Calculation

```python
def calculate_key_result_progress(kr: dict, user_id: str) -> dict:
    """
    Calculate real-time progress for a Key Result.
    
    Data Sources:
    - flashcards: Count of mastered cards
    - quizzes: Average score on recent quizzes
    - study_sessions: Total study time
    - vocabulary: SRS mastered count
    - grammar: Points learned
    - kanji: Characters mastered
    """
    source_handlers = {
        'flashcards': get_flashcard_mastery_count,
        'quizzes': get_quiz_score_average,
        'vocabulary': get_vocabulary_mastered,
        'grammar': get_grammar_learned,
        'kanji': get_kanji_mastered,
        'study_time': get_total_study_minutes,
    }
    
    current = source_handlers[kr['data_source']](user_id)
    
    # Calculate velocity (units per day)
    history = kr.get('history', [])
    if len(history) >= 2:
        days_diff = (history[-1]['date'] - history[0]['date']).days or 1
        value_diff = history[-1]['value'] - history[0]['value']
        velocity = value_diff / days_diff
    else:
        velocity = 0
    
    # Project completion
    remaining = kr['target'] - current
    if velocity > 0:
        days_to_complete = remaining / velocity
        projected = datetime.now() + timedelta(days=days_to_complete)
    else:
        projected = None
    
    # Determine trend
    if len(history) >= 3:
        recent_velocity = calculate_recent_velocity(history[-3:])
        if recent_velocity > velocity * 1.1:
            trend = 'improving'
        elif recent_velocity < velocity * 0.9:
            trend = 'declining'
        else:
            trend = 'stable'
    else:
        trend = 'stable'
    
    return {
        'current': current,
        'velocity': round(velocity, 2),
        'trend': trend,
        'projected_completion': projected,
        'progress_percent': (current / kr['target']) * 100 if kr['target'] else 0
    }
```

---

## Phase 3: PACT Commitment Backend (Days 3-4)

### 3.1 New Collections

#### `pact_commitments`
```javascript
{
  _id: ObjectId,
  user_id: String,
  plan_id: ObjectId,
  
  // PACT Components
  purpose: String,                     // User's "why"
  purpose_alignment_score: Number,     // How well actions align to purpose
  
  // Actions Template
  actions: [{
    id: ObjectId,
    description: String,
    action_type: String,               // "study", "review", "practice", "test"
    target_minutes: Number,
    best_time_of_day: String,          // "morning", "afternoon", "evening", "night"
    completion_rate: Number,           // Historical completion %
    is_active: Boolean
  }],
  
  // Streak
  streak_current: Number,
  streak_target: Number,               // Goal streak length
  streak_longest: Number,
  streak_history: [{
    start_date: Date,
    end_date: Date,
    length: Number,
    broken_reason: String
  }],
  
  // Context Preferences
  preferred_session_length: Number,
  low_energy_fallback: String,         // What to do on low energy days
  
  created_at: Date,
  updated_at: Date
}
```

#### `pact_actions_log`
```javascript
{
  _id: ObjectId,
  user_id: String,
  commitment_id: ObjectId,
  action_id: ObjectId,
  
  date: Date,                          // Date of action
  completed: Boolean,
  completed_at: Date,
  
  // Context at time of completion
  context_snapshot: {
    energy_level: Number,
    mood: String,
    actual_minutes: Number
  }
}
```

### 3.2 API Endpoints

```python
@strategy_bp.route('/pact/commitment', methods=['POST'])
def create_pact():
    """Create or update PACT commitment"""
    pass

@strategy_bp.route('/pact/commitment', methods=['GET'])
def get_pact():
    """Get current PACT commitment with today's status"""
    pass

@strategy_bp.route('/pact/actions/<action_id>/complete', methods=['POST'])
def complete_pact_action(action_id):
    """Mark action as completed for today"""
    # Body: { context_snapshot }
    pass

@strategy_bp.route('/pact/streak', methods=['GET'])
def get_streak():
    """Get streak status and history"""
    pass

@strategy_bp.route('/pact/daily-status', methods=['GET'])
def get_daily_status():
    """Get today's action completion status"""
    pass

@strategy_bp.route('/pact/analytics', methods=['GET'])
def get_pact_analytics():
    """Get PACT performance analytics"""
    # Best times, completion rates, streaks
    pass
```

### 3.3 Streak Management

```python
def update_streak(user_id: str):
    """
    Update streak based on daily action completion.
    Called at end of day or on first action of new day.
    """
    commitment = get_pact_commitment(user_id)
    yesterday = datetime.now().date() - timedelta(days=1)
    
    # Check if yesterday had all required actions completed
    yesterday_log = get_actions_for_date(user_id, yesterday)
    required_actions = [a for a in commitment['actions'] if a['is_active']]
    completed_actions = [l for l in yesterday_log if l['completed']]
    
    completion_rate = len(completed_actions) / len(required_actions) if required_actions else 0
    
    if completion_rate >= 0.8:  # Allow 80% completion to maintain streak
        commitment['streak_current'] += 1
        commitment['streak_longest'] = max(
            commitment['streak_longest'], 
            commitment['streak_current']
        )
    else:
        # Streak broken
        if commitment['streak_current'] > 0:
            save_streak_to_history(commitment, 'incomplete_actions')
        commitment['streak_current'] = 0
    
    save_commitment(commitment)
```

---

## Phase 4: Context Tracking Backend (Days 4-5)

### 4.1 New Collection: `context_checkins`

```javascript
{
  _id: ObjectId,
  user_id: String,
  
  timestamp: Date,
  
  // Check-in Data
  sleep_quality: String,               // "poor", "fair", "good", "excellent"
  energy_level: Number,                // 1-10
  mood: String,                        // "unmotivated", "neutral", "focused", "energized"
  stress_level: String,                // "low", "medium", "high"
  focus_notes: String,                 // Optional free text
  
  // AI Recommendations (generated at check-in)
  ai_session_recommendation: {
    session_type: String,              // "review", "new_content", "practice", "break"
    suggested_duration: Number,
    reasoning: String,
    suggested_activity: String
  },
  
  // Session that followed (linked later)
  session_id: ObjectId,
  session_outcome: {
    actual_duration: Number,
    completion_rate: Number,
    performance_score: Number
  }
}
```

### 4.2 API Endpoints

```python
@context_bp.route('/checkin', methods=['POST'])
def submit_checkin():
    """Submit context check-in"""
    # Body: { sleep_quality, energy_level, mood, stress_level, focus_notes }
    # Returns: AI session recommendation
    pass

@context_bp.route('/checkin/latest', methods=['GET'])
def get_latest_checkin():
    """Get most recent check-in for today"""
    pass

@context_bp.route('/checkin/<checkin_id>/link-session', methods=['POST'])
def link_session(checkin_id):
    """Link a study session to a check-in"""
    # Body: { session_id, actual_duration, completion_rate, performance_score }
    pass

@context_bp.route('/context/analytics', methods=['GET'])
def get_context_analytics():
    """Get context vs performance correlation"""
    # Returns: Best energy levels, mood impact on performance
    pass

@context_bp.route('/context/recommendations', methods=['GET'])
def get_context_recommendations():
    """Get personalized recommendations based on context history"""
    pass
```

### 4.3 AI Session Recommendation Logic

```python
def generate_session_recommendation(checkin: dict) -> dict:
    """
    Generate AI recommendation based on context.
    
    Decision Matrix:
    - Low energy + Poor sleep → Short review only
    - High energy + Good sleep → New content learning
    - Medium energy + High stress → Gamified practice
    - High energy + Focused mood → Challenge/test mode
    """
    energy = checkin['energy_level']
    sleep = checkin['sleep_quality']
    mood = checkin['mood']
    stress = checkin['stress_level']
    
    # Calculate session intensity
    intensity_score = (
        energy * 0.4 +
        {'poor': 2, 'fair': 5, 'good': 8, 'excellent': 10}[sleep] * 0.3 +
        {'unmotivated': 2, 'neutral': 5, 'focused': 8, 'energized': 10}[mood] * 0.2 +
        {'high': 3, 'medium': 6, 'low': 10}[stress] * 0.1
    )
    
    if intensity_score < 4:
        return {
            'session_type': 'review',
            'suggested_duration': 10,
            'reasoning': 'Low energy detected. Focus on light review to maintain streak.',
            'suggested_activity': 'flashcard_review'
        }
    elif intensity_score < 6:
        return {
            'session_type': 'practice',
            'suggested_duration': 20,
            'reasoning': 'Moderate energy. Good for practice and reinforcement.',
            'suggested_activity': 'quiz_practice'
        }
    elif intensity_score < 8:
        return {
            'session_type': 'new_content',
            'suggested_duration': 30,
            'reasoning': 'Good energy for learning new material.',
            'suggested_activity': 'grammar_lesson'
        }
    else:
        return {
            'session_type': 'challenge',
            'suggested_duration': 45,
            'reasoning': 'Optimal state for challenging content!',
            'suggested_activity': 'jlpt_mock_test'
        }
```

---

## Phase 5: Priority Matrix Backend (Days 5-6)

### 5.1 New Collection: `priority_queue`

```javascript
{
  _id: ObjectId,
  user_id: String,
  plan_id: ObjectId,
  
  // Items by priority
  items: [{
    content_id: String,                // Reference to vocab/grammar/kanji
    content_type: String,              // "vocabulary", "grammar", "kanji"
    title: String,
    
    priority: String,                  // "red", "yellow", "green"
    priority_score: Number,            // 0-100 for sorting within tier
    
    // Diagnostic data
    error_count_last_7_days: Number,
    correct_count_last_7_days: Number,
    last_review_date: Date,
    last_error_type: String,           // "knowledge_gap", "process_error", "careless"
    
    // Recommendations
    recommended_action: String,
    estimated_recovery_sessions: Number,
    
    // Movement tracking
    priority_history: [{
      date: Date,
      from: String,
      to: String,
      reason: String
    }]
  }],
  
  // Time allocation
  recommended_time_allocation: {
    red: Number,                       // % of study time
    yellow: Number,
    green: Number
  },
  
  last_calculated: Date
}
```

### 5.2 New Collection: `error_analysis`

```javascript
{
  _id: ObjectId,
  user_id: String,
  
  // Error instance
  timestamp: Date,
  content_id: String,
  content_type: String,
  question_type: String,               // "multiple_choice", "fill_blank", etc.
  
  // Classification
  error_type: String,                  // "knowledge_gap", "process_error", "careless"
  error_subtype: String,               // More specific
  
  // Context
  user_answer: String,
  correct_answer: String,
  time_spent_seconds: Number,
  context_checkin_id: ObjectId,        // Link to user state at time
  
  // Analysis
  ai_diagnosis: String,
  suggested_remediation: String
}
```

### 5.3 API Endpoints

```python
@diagnostic_bp.route('/priority-matrix', methods=['GET'])
def get_priority_matrix():
    """Get current priority matrix"""
    # Query: ?user_id=X or ?plan_id=X
    pass

@diagnostic_bp.route('/priority-matrix/recalculate', methods=['POST'])
def recalculate_matrix():
    """Force recalculation of priority matrix"""
    pass

@diagnostic_bp.route('/priority-matrix/item/<item_id>/move', methods=['POST'])
def move_priority_item(item_id):
    """Manually move an item between priorities"""
    # Body: { new_priority, reason }
    pass

@diagnostic_bp.route('/errors', methods=['POST'])
def log_error():
    """Log a learning error for analysis"""
    # Body: { content_id, user_answer, correct_answer, ... }
    pass

@diagnostic_bp.route('/errors/analysis', methods=['GET'])
def get_error_analysis():
    """Get error type breakdown"""
    # Returns: { knowledge_gap: 45%, process_error: 35%, careless: 20% }
    pass

@diagnostic_bp.route('/errors/content/<content_id>', methods=['GET'])
def get_content_errors(content_id):
    """Get all errors for a specific content item"""
    pass
```

### 5.4 Priority Calculation Algorithm

```python
def calculate_priority(user_id: str, content_id: str) -> dict:
    """
    Calculate priority level for a content item.
    
    Factors:
    1. Error rate in last 7 days
    2. Recency of last successful review
    3. Pattern of errors (improving vs worsening)
    4. SRS interval status
    5. Relevance to upcoming milestone
    """
    errors = get_recent_errors(user_id, content_id, days=7)
    correct = get_recent_correct(user_id, content_id, days=7)
    total = len(errors) + len(correct)
    
    if total == 0:
        return {'priority': 'yellow', 'score': 50, 'reason': 'No recent data'}
    
    error_rate = len(errors) / total
    
    # Calculate trend
    if len(errors) >= 2:
        recent_errors = errors[-3:] if len(errors) >= 3 else errors
        old_errors = errors[:3] if len(errors) >= 3 else []
        trend = 'worsening' if len(recent_errors) > len(old_errors) else 'improving'
    else:
        trend = 'stable'
    
    # Determine priority
    if error_rate > 0.6 or (error_rate > 0.4 and trend == 'worsening'):
        priority = 'red'
        action = 'deep_teaching'
    elif error_rate > 0.3 or trend == 'worsening':
        priority = 'yellow'
        action = 'drill_practice'
    else:
        priority = 'green'
        action = 'maintain_review'
    
    return {
        'priority': priority,
        'score': int((1 - error_rate) * 100),
        'trend': trend,
        'recommended_action': action,
        'error_rate': round(error_rate * 100, 1)
    }
```

---

## Phase 6: Review Cycles Backend (Days 6-7)

### 6.1 New Collection: `review_cycles`

```javascript
{
  _id: ObjectId,
  user_id: String,
  plan_id: ObjectId,
  
  // Review type
  cycle_type: String,                  // "daily", "weekly", "phase"
  period_start: Date,
  period_end: Date,
  
  // Metrics
  metrics: {
    total_study_minutes: Number,
    tasks_completed: Number,
    tasks_total: Number,
    avg_daily_minutes: Number,
    completion_rate: Number,
    
    // Performance
    avg_accuracy: Number,
    accuracy_trend: String,            // "improving", "stable", "declining"
    
    // Priority movement
    red_items_count: Number,
    yellow_items_count: Number,
    green_items_count: Number,
    items_promoted: Number,            // RED→YELLOW or YELLOW→GREEN
    items_demoted: Number,
    
    // Streak
    streak_maintained: Boolean,
    days_studied: Number,
    days_in_period: Number
  },
  
  // AI Analysis
  wins: [String],                      // Things that went well
  challenges: [String],                // Areas needing attention
  ai_insights: String,                 // Generated narrative
  
  // Next period
  next_cycle_goals: [String],
  adjustments_made: [{
    type: String,
    description: String,
    reason: String
  }],
  
  created_at: Date
}
```

### 6.2 API Endpoints

```python
@review_bp.route('/reviews/generate', methods=['POST'])
def generate_review():
    """Generate a new review for period"""
    # Body: { user_id, plan_id, cycle_type, period_start, period_end }
    pass

@review_bp.route('/reviews/latest', methods=['GET'])
def get_latest_review():
    """Get most recent review"""
    # Query: ?user_id=X&cycle_type=weekly
    pass

@review_bp.route('/reviews', methods=['GET'])
def list_reviews():
    """List reviews with pagination"""
    # Query: ?user_id=X&limit=10&offset=0
    pass

@review_bp.route('/reviews/<review_id>', methods=['GET'])
def get_review(review_id):
    """Get full review details"""
    pass

@review_bp.route('/reviews/<review_id>/apply-adjustments', methods=['POST'])
def apply_adjustments(review_id):
    """Apply recommended adjustments to plan"""
    pass

@review_bp.route('/reviews/schedule', methods=['GET'])
def get_review_schedule():
    """Get upcoming review schedule"""
    pass
```

### 6.3 Review Generation Logic

```python
def generate_weekly_review(user_id: str, plan_id: str) -> dict:
    """
    Generate weekly review report.
    
    Steps:
    1. Aggregate metrics from past 7 days
    2. Compare to previous week
    3. Identify wins and challenges
    4. Generate AI insights
    5. Suggest next week goals
    """
    week_start = get_week_start(datetime.now())
    week_end = week_start + timedelta(days=7)
    prev_week_start = week_start - timedelta(days=7)
    
    # Gather metrics
    current_metrics = calculate_period_metrics(user_id, week_start, week_end)
    prev_metrics = calculate_period_metrics(user_id, prev_week_start, week_start)
    
    # Identify wins
    wins = []
    if current_metrics['completion_rate'] > prev_metrics['completion_rate']:
        wins.append(f"Completion rate improved by {(current_metrics['completion_rate'] - prev_metrics['completion_rate']):.0f}%")
    if current_metrics['streak_maintained']:
        wins.append(f"Maintained study streak!")
    if current_metrics['items_promoted'] > 0:
        wins.append(f"{current_metrics['items_promoted']} items moved to higher mastery level")
    
    # Identify challenges
    challenges = []
    if current_metrics['avg_accuracy'] < prev_metrics['avg_accuracy']:
        challenges.append("Accuracy dipped - consider slowing down on new content")
    if current_metrics['red_items_count'] > prev_metrics.get('red_items_count', 0):
        challenges.append("RED priority items increased - more focused review needed")
    if current_metrics['avg_daily_minutes'] < current_metrics['total_study_minutes'] / 7 * 0.7:
        challenges.append("Study time inconsistent - try to maintain daily routine")
    
    # Generate AI narrative
    ai_insights = generate_ai_review_narrative(current_metrics, prev_metrics, wins, challenges)
    
    # Suggest next week goals
    next_goals = generate_next_week_goals(current_metrics, challenges)
    
    return {
        'cycle_type': 'weekly',
        'period_start': week_start,
        'period_end': week_end,
        'metrics': current_metrics,
        'wins': wins,
        'challenges': challenges,
        'ai_insights': ai_insights,
        'next_cycle_goals': next_goals
    }
```

---

## Phase 7: Integration & Testing (Days 7-8)

### 7.1 Service Registration

```python
# backend/flask/server.py

from modules.strategy_framework import strategy_bp
from modules.diagnostic_engine import diagnostic_bp
from modules.context_tracker import context_bp
from modules.review_cycles import review_bp

# Register blueprints
app.register_blueprint(strategy_bp, url_prefix='/api/v1/strategy')
app.register_blueprint(diagnostic_bp, url_prefix='/api/v1/diagnostic')
app.register_blueprint(context_bp, url_prefix='/api/v1/context')
app.register_blueprint(review_bp, url_prefix='/api/v1/review')
```

### 7.2 Frontend Service Updates

```typescript
// frontend-next/src/services/strategyService.ts

const STRATEGY_API = '/f-api/v1/strategy';
const DIAGNOSTIC_API = '/f-api/v1/diagnostic';
const CONTEXT_API = '/f-api/v1/context';
const REVIEW_API = '/f-api/v1/review';

export const strategyService = {
  // SMART Goals
  createSMARTGoal: (data) => fetch(`${STRATEGY_API}/smart-goals`, { method: 'POST', body: JSON.stringify(data) }),
  getSMARTGoals: (planId) => fetch(`${STRATEGY_API}/smart-goals?plan_id=${planId}`),
  getSMARTGoal: (id) => fetch(`${STRATEGY_API}/smart-goals/${id}`),
  
  // OKRs
  getOKRs: (planId) => fetch(`${STRATEGY_API}/okr/objectives?plan_id=${planId}`),
  refreshOKR: (id) => fetch(`${STRATEGY_API}/okr/objectives/${id}/refresh`, { method: 'POST' }),
  
  // PACT
  getPACT: () => fetch(`${STRATEGY_API}/pact/commitment`),
  completePACTAction: (actionId, context) => fetch(`${STRATEGY_API}/pact/actions/${actionId}/complete`, { method: 'POST', body: JSON.stringify(context) }),
  
  // Context
  submitCheckin: (data) => fetch(`${CONTEXT_API}/checkin`, { method: 'POST', body: JSON.stringify(data) }),
  getLatestCheckin: () => fetch(`${CONTEXT_API}/checkin/latest`),
  
  // Diagnostics
  getPriorityMatrix: (planId) => fetch(`${DIAGNOSTIC_API}/priority-matrix?plan_id=${planId}`),
  getErrorAnalysis: () => fetch(`${DIAGNOSTIC_API}/errors/analysis`),
  
  // Reviews
  generateReview: (data) => fetch(`${REVIEW_API}/reviews/generate`, { method: 'POST', body: JSON.stringify(data) }),
  getLatestReview: (type) => fetch(`${REVIEW_API}/reviews/latest?cycle_type=${type}`),
};
```

### 7.3 Database Indexes

```python
# Create indexes for performance
db.smart_goals.create_index([('user_id', 1), ('status', 1)])
db.smart_goals.create_index([('plan_id', 1)])

db.okr_objectives.create_index([('user_id', 1), ('plan_id', 1)])
db.okr_objectives.create_index([('parent_smart_goal_id', 1)])

db.pact_actions_log.create_index([('user_id', 1), ('date', -1)])
db.pact_actions_log.create_index([('commitment_id', 1), ('date', -1)])

db.context_checkins.create_index([('user_id', 1), ('timestamp', -1)])

db.priority_queue.create_index([('user_id', 1), ('plan_id', 1)])
db.error_analysis.create_index([('user_id', 1), ('content_id', 1)])
db.error_analysis.create_index([('user_id', 1), ('timestamp', -1)])

db.review_cycles.create_index([('user_id', 1), ('cycle_type', 1), ('period_end', -1)])
```

---

## Implementation Checklist

### Week 1

- [ ] **Day 1**: SMART Goals collection, CRUD endpoints
- [ ] **Day 2**: SMART progress calculation, AI analysis
- [ ] **Day 3**: OKR collection, CRUD endpoints, KR calculations
- [ ] **Day 4**: PACT commitment, actions log, streak logic
- [ ] **Day 5**: Context check-ins, AI recommendations
- [ ] **Day 6**: Priority matrix, error classification
- [ ] **Day 7**: Review cycles generation
- [ ] **Day 8**: Integration testing, frontend service updates

### Quality Gates

- [ ] All endpoints have proper error handling
- [ ] All calculations have unit tests
- [ ] API responses match frontend type definitions
- [ ] Database indexes created
- [ ] Rate limiting on POST endpoints
- [ ] Input validation on all endpoints

---

## Testing Strategy

### Unit Tests

```python
# tests/test_strategy_framework.py

def test_smart_progress_calculation():
    """Test SMART goal progress is calculated correctly"""
    pass

def test_okr_velocity_calculation():
    """Test OKR key result velocity is accurate"""
    pass

def test_streak_broken_detection():
    """Test streak is properly reset when actions missed"""
    pass

def test_priority_classification():
    """Test items are correctly classified as RED/YELLOW/GREEN"""
    pass
```

### Integration Tests

```python
# tests/test_strategy_integration.py

def test_smart_to_okr_linking():
    """Test SMART goals correctly link to OKRs"""
    pass

def test_context_affects_recommendations():
    """Test AI recommendations change with context"""
    pass

def test_review_generation_accuracy():
    """Test weekly review metrics are accurate"""
    pass
```

---

## Success Criteria

| Metric | Target |
|--------|--------|
| API response time | < 200ms for GET, < 500ms for POST |
| Progress calculation accuracy | 99% match with raw data |
| Streak calculation accuracy | 100% correct |
| Priority classification accuracy | > 90% agreement with manual review |
| Review generation time | < 2s for weekly review |
| Test coverage | > 80% |
