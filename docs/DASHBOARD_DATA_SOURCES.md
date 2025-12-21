# 🛠️ Dashboard Data Source Technical Report

This document details the exact data pipelines, backend modules, and database collections powering every component on the `study-plan/dashboard` page.

> **Status Legend**
> *   🟢 **Live Real Data**: Fetched directly from user activity in MongoDB.
> *   🟡 **Hybrid**: Real data structure, but relies on some default values/calculations.
> *   🔴 **Mock/Static**: Currently hardcoded logic.

---

## 1. Global Header Statistics

| Metric | Source Collection | Backend Module | Calculation Logic | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Days Remaining** | `study_plans` | `study_plan.py` | `(target_exam_date - now).days` | 🟢 Live |
| **Overall Progress** | `smart_goals`, `okr_objectives` | `study_plan.py` | Weighted average of all active goals | 🟡 Hybrid |
| **Study Streak** | `pact_commitments` | `pact.py` | `streak_current` field (incremented by daily activity) | 🟢 Live |
| **Vocab Mastered** | `user_content_mastery` | `content_mastery.py` | Count documents where `status="mastered"` | 🟢 Live |

---

## 2. PACT Daily Card

This component manages daily habits and consistency tracking.

*   **Primary Data Source**: `pact_commitments` (MongoDB Collection)
*   **Secondary Source**: `pact_daily_status` (Tracks today's checkboxes)

### Fields Breakdown
*   **Daily Purpose** (`purpose`):
    *   *Source*: User-defined string in `pact_commitments`.
    *   *Status*: 🟢 Live (User editable via API).
*   **Streak Flame** (`streak_current`):
    *   *Source*: Numeric integer in `pact_commitments`.
    *   *Logic*: Updated nightly via `cron` job or first login check.
*   **Context Check-in** (`last_context`):
    *   *Source*: `context_logs` collection.
    *   *Interaction*: Clicking buttons writes a new document to `context_logs`.
*   **Today's Actions** (`actions[]`):
    *   *Source*: `pact_commitments.actions` (The template) + `pact_daily_status` (The completion state).
    *   *Status*: 🟢 Live. Toggles persist instantly to DB.

---

## 3. OKR (Objectives & Key Results) Card

This component tracks high-level strategic goals.

*   **Backend Module**: `modules/okr.py`

### Fields Breakdown
*   **Objective Title**:
    *   *Source*: `okr_objectives.title`.
    *   *Status*: 🟢 Live.
*   **Progress Bar** (`progress_percent`):
    *   *Source*: Calculated aggregate of all child Key Results.
*   **Key Results** (e.g., "Master 3000 Words"):
    *   *Source*: `okr_objectives.key_results`.
    *   *Logic*: The backend actually analyzes the **Content Mastery** database.
    *   *Query*: `db.user_content_mastery.count({ status: "mastered", type: "vocabulary" })`.
    *   *Status*: 🟢 Live (Real-time count).
*   **Velocity/Trend**:
    *   *Source*: Calculated by comparing today's count vs. 7 days ago.

---

## 4. Priority Matrix Card (Diagnostics)

This component visualizes the urgency of review for different skills.

*   **Backend Module**: `modules/priority.py`
*   **Collection**: `priority_queue`

### Fields Breakdown
*   **Red/Yellow/Green Categorization**:
    *   *Source*: `content_interactions` (Last 7 days).
    *   *Logic*:
        *   **Red**: Error rate > 40% OR Worsening Trend.
        *   **Yellow**: Error rate 10-40% OR Stale Review.
        *   **Green**: High accuracy + Recent review.
    *   *Status*: 🟢 Live (Recalculated on demand).
*   **Skill Breakdown**:
    *   *Source*: Aggregation of `content_interactions` grouped by `skill_tag`.
*   **Time Allocation Bar**:
    *   *Logic*: Algorithmically generated split based on the count of items in Red vs. Yellow queues.

---

## 5. Daily Task List (Tactical)

*   **Backend Module**: `modules/study_plan.py` -> `get_daily_tasks()`

### Fields Breakdown
*   **Status Toggles**:
    *   *Source*: `daily_tasks` collection.
    *   *Status*: 🟢 Live.
*   **Task Generation**:
    *   *Logic*:
        1.  Check `mastery.due` endpoint -> Create "SRS Review" task.
        2.  Check `plan.velocity` settings -> Create "New Cards" task.
        3.  Check `pact.energy` -> If energy low, remove hard tasks (Adaptive).

---

## 6. Activity & Performance Charts

*   **Backend Module**: `modules/learner_progress.py`

### Fields Breakdown
*   **Activity Vault** (List):
    *   *Source*: `content_interactions` collection.
    *   *Status*: 🟢 Live (Reverse chronological log).
*   **Mastery Radar** (Spider Chart):
    *   *Source*: Currently simulated in Frontend.
    *   *Status*: 🔴 **Mock/Placeholder**. The aggregation query exists in backend (`get_skill_distribution`) but is not yet fully wired to this visualization.
*   **Retention Graph**:
    *   *Source*: `quiz_attempts` history.
    *   *Status*: 🟡 Hybrid (Curve is projected, data points are real).
