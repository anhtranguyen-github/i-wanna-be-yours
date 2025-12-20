# Frontend Implementation Plan: Enhanced Study Plan Dashboard

## Overview

This plan implements the enhanced strategy framework **frontend-first** with mock data, focusing on rich UI/UX components including help tooltips, expandable details, and interactive visualizations.

---

## Phase 1: Foundation Components (Day 1-2)

### 1.1 Create Reusable UI Components

#### InfoTooltip Component
A "?" icon that shows explanatory text on hover/click.

```tsx
// src/components/ui/InfoTooltip.tsx
interface InfoTooltipProps {
  title: string;
  content: string;
  learnMoreUrl?: string;
}
```

**Features:**
- Small "?" icon (16px) in muted color
- Hover shows tooltip with title + explanation
- Optional "Learn more" link
- Mobile: tap to toggle

**Usage locations:**
- Next to every stat label (vocabulary, streak, accuracy, etc.)
- Framework headers (OKR, PACT, SMART)
- Priority matrix colors (RED, YELLOW, GREEN)

---

#### StatCard Component (Enhanced)
Clickable stat cards that expand to show details.

```tsx
// src/components/ui/StatCard.tsx
interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  helpText: string;
  onClick?: () => void;
  expandedContent?: React.ReactNode;
}
```

**Features:**
- Main stat display with icon
- Trend indicator (arrow up/down + percentage)
- "?" tooltip for explanation
- Click to expand details panel or open modal
- Glassmorphic styling

---

#### ExpandableSection Component
Collapsible sections with smooth animations.

```tsx
// src/components/ui/ExpandableSection.tsx
interface ExpandableSectionProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  defaultOpen?: boolean;
  badge?: string | number;
  helpText?: string;
  children: React.ReactNode;
}
```

**Features:**
- Chevron rotation animation
- Smooth height transition
- Badge for counts/alerts
- Integrated help tooltip

---

#### DetailModal Component
Full-screen or slide-over modal for detailed views.

```tsx
// src/components/ui/DetailModal.tsx
interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
  children: React.ReactNode;
}
```

**Features:**
- Backdrop blur
- Slide-in animation
- Close on escape/backdrop click
- Responsive (full-screen on mobile)

---

### 1.2 Create Mock Data Store

```tsx
// src/mocks/strategyMockData.ts

export const mockSMARTGoals: SMARTGoalEnhanced[] = [...]
export const mockOKRs: OKRGoalEnhanced[] = [...]
export const mockPACT: PACTStatEnhanced = {...}
export const mockPriorityMatrix: PriorityMatrix = {...}
export const mockReviewCycles: ReviewCycle[] = [...]
export const mockTeachingSessions: TeachingSession[] = [...]
```

---

## Phase 2: SMART Goals Section (Day 2-3)

### 2.1 SMARTGoalCard Component

```tsx
// src/components/strategy/SMARTGoalCard.tsx
```

**Display:**
- Goal title with status badge (active/completed/overdue)
- Progress ring showing overall completion
- 5 SMART dimensions as mini cards (S-M-A-R-T)
- Success criteria checklist
- Days remaining countdown

**Interactions:**
- Click card → Open SMARTGoalDetailModal
- Click "?" → Explains each SMART dimension
- Click criterion → Toggle completion (mock)

### 2.2 SMARTGoalDetailModal

**Sections:**
1. **Header**: Title, status, deadline with countdown
2. **SMART Breakdown**: Each dimension expanded with full text
3. **Success Criteria**: Table with metric, target, current, progress bar
4. **Linked OKRs**: List of child OKRs with progress
5. **AI Insights**: Confidence score, recommended adjustments
6. **History**: Timeline of progress updates

**Help Tooltips:**
- "Success Criteria" → "Measurable outcomes that define goal completion"
- "AI Confidence" → "Hanachan's assessment of achievability based on your pace"
- "Baseline" → "Your starting point when this goal was created"

---

## Phase 3: OKR Section (Day 3-4)

### 3.1 OKRObjectiveCard Component

```tsx
// src/components/strategy/OKRObjectiveCard.tsx
```

**Display:**
- Objective title
- Progress bar (aggregate of key results)
- Key results list (3-5 items) with individual progress
- Risk indicator (low/medium/high)
- Time remaining

**Interactions:**
- Click key result → Expands inline with trend chart
- Click objective → Open OKRDetailModal
- Hover risk indicator → Shows blockers

### 3.2 KeyResultRow Component

**Display:**
- Title, current/target, unit
- Mini progress bar
- Trend arrow (improving/stable/declining)
- Velocity indicator ("3 words/day")
- Projected completion date

**Interactions:**
- Click → Expand to show:
  - 7-day trend mini-chart
  - Contributing activities
  - Adjustment suggestions

### 3.3 OKRDetailModal

**Sections:**
1. **Objective Overview**: Full description, parent SMART goal link
2. **Key Results Deep Dive**: Each KR with full chart
3. **Health Dashboard**: Risk level, blockers, recommendations
4. **Activity Log**: Recent contributions to this OKR
5. **Weekly Review Status**: Last review date, notes

**Help Tooltips:**
- "Key Result" → "Measurable outcome that indicates objective progress"
- "Velocity" → "Average daily progress rate"
- "Projected Completion" → "Estimated date based on current pace"

---

## Phase 4: PACT Section (Day 4-5)

### 4.1 PACTDailyCard Component

```tsx
// src/components/strategy/PACTDailyCard.tsx
```

**Display:**
- Purpose statement (motivational text)
- Today's actions checklist
- Streak flame with count
- Context indicator (last check-in mood/energy)
- Completion percentage for today

**Interactions:**
- Check action → Mark complete with animation
- Click streak → View streak history
- Click context → Open context check-in modal

### 4.2 ContextCheckInModal

**Quick check-in form:**
- Sleep quality (4 options with emojis)
- Energy level (1-10 slider)
- Mood (5 emojis)
- Stress level (low/medium/high)
- "How focused do you feel?" (free text optional)

**After submission:**
- AI suggests optimal session type based on context
- "Low energy? Try a 10-min review instead of learning new content"

### 4.3 PACTDetailModal

**Sections:**
1. **Purpose Alignment**: How this connects to your SMART goal
2. **Daily Actions**: Full list with completion stats
3. **Streak Analysis**: Calendar view, longest streak, close calls
4. **Context Trends**: Charts showing mood/energy correlation with performance
5. **Habit Insights**: Best time of day, avg session length

**Help Tooltips:**
- "Purpose" → "Your 'why' - the reason behind daily commitment"
- "Continuous" → "Habit-based, meant to be done every day"
- "Context" → "External factors that affect your learning capacity"

---

## Phase 5: Diagnostic Dashboard (Day 5-6)

### 5.1 PriorityMatrixCard Component

**Display:**
- Three columns: RED | YELLOW | GREEN
- Item count badges per category
- Top 3 items per category
- "View All" button per category

**Color coding:**
- RED: Deep red background, "Needs Deep Teaching"
- YELLOW: Amber background, "Drill Practice"
- GREEN: Emerald background, "Maintain Review"

**Help Tooltips:**
- RED → "Critical gaps requiring slower, focused study"
- YELLOW → "Understood but needs more practice"
- GREEN → "Solid knowledge, just maintain"

### 5.2 ErrorBreakdownChart Component

**Display:**
- Pie/donut chart: Knowledge Gap vs Process Error vs Careless
- Legend with counts
- Recent error examples (3 items)

**Interactions:**
- Click segment → Filter to show those errors
- Click error example → Show full error with explanation

### 5.3 DiagnosticDetailModal

**Sections:**
1. **Error Type Breakdown**: Full list per category
2. **Root Cause Analysis**: For each error, what went wrong
3. **Corrective Actions**: Recommended activities
4. **Recovery Tracking**: Items that moved from RED → YELLOW → GREEN

**Help Tooltips:**
- "Knowledge Gap" → "Missing fundamental understanding"
- "Process Error" → "Know the concept but applied incorrectly"
- "Careless Error" → "Understood but made attention mistake"

---

## Phase 6: Review Cycles Section (Day 6-7)

### 6.1 ReviewSummaryCard Component

**Display:**
- Last review type (Daily/Weekly/Phase) with date
- Key metrics summary (3-4 bullets)
- Wins & Challenges (1 each, expandable)
- Next review countdown

**Interactions:**
- Click → Open ReviewHistoryModal
- "Generate Review" button → Triggers mock review generation

### 6.2 ReviewHistoryModal

**Features:**
- Calendar with review dots
- Click date → Show that day's review
- Review content:
  - Metrics compared to previous period
  - AI-generated insights
  - Adjustments made
  - Goals for next period

---

## Phase 7: Integration & Polish (Day 7-8)

### 7.1 Update Dashboard Page

**New Tab Structure:**
```
STRATEGY          TASKS          PERFORMANCE        DIAGNOSTICS
(SMART/OKR/PACT)  (Daily Tasks)  (Charts/History)  (RYG Matrix)
```

### 7.2 Navigation & State

- URL query params for active tab: `?tab=strategy`
- Deep links to specific goals: `?tab=strategy&goal=123`
- Persist last viewed tab in localStorage

### 7.3 Loading & Empty States

- Skeleton loaders for each component
- Empty states with CTAs:
  - "No SMART Goals" → "Create Your First Goal"
  - "No Session Data" → "Start Learning to See Insights"

### 7.4 Animations

- Card entrance: stagger fade-in
- Progress updates: number counting animation
- Streak: flame bounce on increase
- Priority change: color transition

---

## Component Specifications

### Help Tooltip Content Database

```typescript
// src/data/helpContent.ts

export const HELP_CONTENT = {
  // Stats
  vocabulary_mastered: {
    title: "Vocabulary Mastered",
    content: "Words you've correctly recalled 4+ times in spaced repetition. These are considered learned.",
    learnMoreUrl: "/help/srs"
  },
  current_streak: {
    title: "Study Streak",
    content: "Consecutive days you've completed at least one study session. Missing a day resets the streak.",
  },
  accuracy: {
    title: "Accuracy Rate",
    content: "Percentage of correct answers across all quizzes and flashcard reviews in the selected period.",
  },
  
  // Frameworks
  smart_specific: {
    title: "Specific (S)",
    content: "Clearly defined goal with no ambiguity. Who, what, where, when, why?",
  },
  smart_measurable: {
    title: "Measurable (M)",
    content: "Quantifiable criteria to track progress. How will you know when it's achieved?",
  },
  okr_key_result: {
    title: "Key Result",
    content: "A measurable outcome that indicates progress toward the objective. Should be challenging but achievable.",
  },
  pact_purpose: {
    title: "Purpose",
    content: "The 'why' behind your daily commitment. Connects your actions to your larger goal.",
  },
  
  // Diagnostic
  priority_red: {
    title: "RED Priority",
    content: "Critical items needing deep, focused study. Go slow and ensure solid understanding before moving on.",
  },
  priority_yellow: {
    title: "YELLOW Priority",
    content: "Items you understand but need more practice. Focus on repetition and application.",
  },
  priority_green: {
    title: "GREEN Priority",
    content: "Well-learned items. Periodic review to maintain. Don't over-study these.",
  },
  
  // Context
  context_sleep: {
    title: "Sleep Quality",
    content: "How well you slept affects learning capacity. Poor sleep = focus on review, not new content.",
  },
  context_energy: {
    title: "Energy Level",
    content: "Your current mental energy. Low energy? Try shorter, easier sessions.",
  },
};
```

---

## File Structure

```
src/
├── components/
│   ├── ui/
│   │   ├── InfoTooltip.tsx
│   │   ├── StatCard.tsx
│   │   ├── ExpandableSection.tsx
│   │   ├── DetailModal.tsx
│   │   ├── ProgressRing.tsx
│   │   └── TrendIndicator.tsx
│   └── strategy/
│       ├── SMARTGoalCard.tsx
│       ├── SMARTGoalDetailModal.tsx
│       ├── OKRObjectiveCard.tsx
│       ├── KeyResultRow.tsx
│       ├── OKRDetailModal.tsx
│       ├── PACTDailyCard.tsx
│       ├── ContextCheckInModal.tsx
│       ├── PACTDetailModal.tsx
│       ├── PriorityMatrixCard.tsx
│       ├── ErrorBreakdownChart.tsx
│       ├── DiagnosticDetailModal.tsx
│       ├── ReviewSummaryCard.tsx
│       └── ReviewHistoryModal.tsx
├── mocks/
│   └── strategyMockData.ts
├── data/
│   └── helpContent.ts
└── app/
    └── study-plan/
        └── dashboard/
            └── page.tsx (updated)
```

---

## Implementation Checklist

### Week 1

- [ ] Day 1: InfoTooltip, StatCard, ExpandableSection, DetailModal
- [ ] Day 2: Mock data store, SMARTGoalCard, SMARTGoalDetailModal
- [ ] Day 3: OKRObjectiveCard, KeyResultRow
- [ ] Day 4: OKRDetailModal, PACTDailyCard
- [ ] Day 5: ContextCheckInModal, PACTDetailModal
- [ ] Day 6: PriorityMatrixCard, ErrorBreakdownChart
- [ ] Day 7: DiagnosticDetailModal, ReviewSummaryCard
- [ ] Day 8: Integration, polish, testing

### Quality Gates

- [ ] All components have TypeScript interfaces
- [ ] All stats have help tooltips
- [ ] All cards are clickable with detail view
- [ ] Mobile responsive
- [ ] Dark mode compatible
- [ ] Animations are smooth (60fps)
- [ ] Empty/loading states handled

---

## Design Tokens

```css
/* Help tooltip */
--tooltip-bg: rgba(15, 23, 42, 0.95);
--tooltip-border: rgba(255, 255, 255, 0.1);
--help-icon-color: #94a3b8;
--help-icon-hover: #3b82f6;

/* Priority colors */
--priority-red: #ef4444;
--priority-red-bg: rgba(239, 68, 68, 0.1);
--priority-yellow: #f59e0b;
--priority-yellow-bg: rgba(245, 158, 11, 0.1);
--priority-green: #10b981;
--priority-green-bg: rgba(16, 185, 129, 0.1);

/* Trends */
--trend-up: #10b981;
--trend-down: #ef4444;
--trend-stable: #6b7280;
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Help tooltip engagement | >30% of users click at least one |
| Detail modal opens | >50% of card clicks lead to modal |
| Context check-in completion | >70% who open complete it |
| Time on dashboard | Increase by 2x |
| User satisfaction | "Dashboard is helpful" >4/5 |
