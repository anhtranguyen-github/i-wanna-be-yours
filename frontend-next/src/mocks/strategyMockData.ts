/**
 * Strategy Mock Data Store
 * Comprehensive mock data for frontend-first implementation
 */

import { SMARTGoal, PACTStat } from '@/types/studyPlanTypes';

// ============================================
// Enhanced Types (Frontend-only for now)
// ============================================

export interface SMARTGoalEnhanced {
    id: string;
    title: string;
    specific: string;
    measurable: string;
    achievable: string;
    relevant: string;
    timeBound: string;
    deadline: string;
    progress: number;
    status: 'active' | 'completed' | 'overdue';
    phase_id?: string;
    linked_jlpt_level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
    success_criteria: SuccessCriterion[];
    baseline_score: number;
    target_score: number;
    current_score: number;
    ai_confidence_score: number;
    ai_recommended_adjustments: string[];
    created_at: string;
    updated_at: string;
}

export interface SuccessCriterion {
    id: string;
    metric: 'quiz_score' | 'vocab_mastered' | 'kanji_learned' | 'grammar_points' | 'reading_speed' | 'listening_accuracy';
    label: string;
    target_value: number;
    current_value: number;
    unit: string;
    weight: number;
}

export interface OKRGoalEnhanced {
    id: string;
    smart_goal_id: string;
    milestone_id?: string;
    objective: string;
    description: string;
    start_date: string;
    end_date: string;
    keyResults: KeyResultEnhanced[];
    progress: number;
    on_track: boolean;
    risk_level: 'low' | 'medium' | 'high';
    blockers: string[];
    weekly_review_status: 'pending' | 'reviewed' | 'adjusted';
    last_weekly_review?: string;
}

export interface MasteredItem {
    id: string;
    title: string;
    type: 'vocabulary' | 'grammar' | 'kanji';
    level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
    status: 'learning' | 'reviewing' | 'mastered' | 'burned';
    performance: 'low' | 'medium' | 'high' | 'perfect';
    last_rating: 'hard' | 'medium' | 'easy' | 'perfect';
}

export interface KeyResultEnhanced {
    id: string;
    title: string;
    current: number;
    target: number;
    unit: string;
    trend: 'improving' | 'stable' | 'declining';
    velocity: number;
    projected_completion?: string;
    contributing_task_types: string[];
    confidence: number;
    items?: MasteredItem[];
}

export interface PACTStatEnhanced {
    id: string;
    okr_id: string;
    purpose: string;
    purpose_alignment_score: number;
    actions: PACTAction[];
    continuous: boolean;
    streak_current: number;
    streak_longest: number;
    streak_target: number;
    missed_days_this_week: number;
    trackable: boolean;
    daily_metrics: DailyMetric[];
    context_tracking: boolean;
    last_context?: ContextSnapshot;
}

export interface PACTAction {
    id: string;
    action_type: 'study' | 'review' | 'practice' | 'test';
    description: string;
    target_minutes: number;
    actual_minutes_avg: number;
    completion_rate: number;
    best_time_of_day: 'morning' | 'afternoon' | 'evening' | 'night';
    completed_today: boolean;
}

export interface DailyMetric {
    date: string;
    minutes_studied: number;
    tasks_completed: number;
    accuracy_avg: number;
    focus_score: number;
}

export interface ContextSnapshot {
    timestamp: string;
    sleep_quality: 'poor' | 'fair' | 'good' | 'excellent';
    stress_level: 'low' | 'medium' | 'high';
    mood: 'unmotivated' | 'neutral' | 'focused' | 'energized';
    energy_level: number;
}

export interface PriorityMatrix {
    user_id: string;
    generated_at: string;
    skills: SkillPriority[];
    content_items: ContentPriority[];
    today_focus: 'deep_teaching' | 'drill_practice' | 'maintenance';
    today_time_allocation: {
        red_minutes: number;
        yellow_minutes: number;
        green_minutes: number;
    };
}

export interface SkillPriority {
    skill: 'vocabulary' | 'grammar' | 'kanji' | 'reading' | 'listening';
    priority: 'red' | 'yellow' | 'green';
    reason: string;
    last_assessed: string;
    accuracy_trend: number;
}

export interface ContentPriority {
    content_type: string;
    content_id: string;
    title: string;
    priority: 'red' | 'yellow' | 'green';
    error_count_last_7_days: number;
    recommended_action: string;
}

export interface ReviewCycle {
    id: string;
    user_id: string;
    cycle_type: 'daily' | 'weekly' | 'phase';
    period_start: string;
    period_end: string;
    metrics: ReviewMetrics;
    wins: string[];
    challenges: string[];
    adjustments_made: string[];
    next_cycle_goals: string[];
    focus_areas: string[];
}

export interface ReviewMetrics {
    total_study_minutes: number;
    avg_daily_minutes: number;
    tasks_completed: number;
    tasks_total: number;
    completion_rate: number;
    avg_accuracy: number;
    accuracy_trend: 'improving' | 'stable' | 'declining';
    streak_maintained: boolean;
    days_studied: number;
    days_in_period: number;
    okr_progress_delta: number;
    red_items_count: number;
    yellow_items_count: number;
    green_items_count: number;
}

// ============================================
// Mock Data
// ============================================

export const mockSMARTGoals: SMARTGoalEnhanced[] = [
    {
        id: 'smart-1',
        title: 'Master N3 Vocabulary Core',
        specific: 'Learn and retain 3000 N3-level vocabulary words with 90% recall accuracy',
        measurable: 'Track via flashcard reviews with 90% accuracy threshold',
        achievable: 'Based on current learning rate of 20 words/day, achievable in 6 months',
        relevant: 'Essential for JLPT N3 vocabulary section (30% of exam)',
        timeBound: 'Complete by exam date: July 2024',
        deadline: '2024-07-07',
        progress: 41,
        status: 'active',
        linked_jlpt_level: 'N3',
        success_criteria: [
            { id: 'sc-1', metric: 'vocab_mastered', label: 'Words Mastered', target_value: 3000, current_value: 1240, unit: 'words', weight: 0.6 },
            { id: 'sc-2', metric: 'quiz_score', label: 'Quiz Accuracy', target_value: 90, current_value: 78, unit: '%', weight: 0.4 },
        ],
        baseline_score: 0,
        target_score: 90,
        current_score: 78,
        ai_confidence_score: 72,
        ai_recommended_adjustments: [
            'Increase daily new words from 20 to 25',
            'Add 10 minutes of context reading practice',
            'Review N4 vocabulary gaps detected',
        ],
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-03-20T00:00:00Z',
    },
    {
        id: 'smart-2',
        title: 'N3 Grammar Proficiency',
        specific: 'Master 120 N3 grammar patterns with ability to use in context',
        measurable: 'Complete grammar exercises with 85% accuracy',
        achievable: 'Learning 3 patterns/week with review cycles',
        relevant: 'Grammar section is 25% of N3 exam',
        timeBound: 'Complete 2 weeks before exam for review buffer',
        deadline: '2024-06-23',
        progress: 54,
        status: 'active',
        linked_jlpt_level: 'N3',
        success_criteria: [
            { id: 'sc-3', metric: 'grammar_points', label: 'Patterns Learned', target_value: 120, current_value: 65, unit: 'patterns', weight: 0.5 },
            { id: 'sc-4', metric: 'quiz_score', label: 'Exercise Accuracy', target_value: 85, current_value: 82, unit: '%', weight: 0.5 },
        ],
        baseline_score: 0,
        target_score: 85,
        current_score: 82,
        ai_confidence_score: 85,
        ai_recommended_adjustments: [
            'Focus on causative-passive forms (weak area)',
            'Add more sentence construction practice',
        ],
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-03-20T00:00:00Z',
    },
];

export const mockOKRs: OKRGoalEnhanced[] = [
    {
        id: 'okr-1',
        smart_goal_id: 'smart-1',
        objective: 'Build Unshakeable N3 Vocabulary Foundation',
        description: 'Master the core vocabulary needed to understand 80% of N3-level content',
        start_date: '2024-01-15',
        end_date: '2024-04-15',
        keyResults: [
            {
                id: 'kr-1',
                title: 'Master 1500 high-frequency words',
                current: 1240,
                target: 1500,
                unit: 'words',
                trend: 'improving',
                velocity: 18.5,
                projected_completion: '2024-04-01',
                contributing_task_types: ['flashcard', 'quiz'],
                confidence: 85,
                items: [
                    { id: 'v-101', title: '改善 (Kaizen)', type: 'vocabulary', level: 'N3', status: 'mastered', performance: 'high', last_rating: 'easy' },
                    { id: 'v-102', title: '先生 (Sensei)', type: 'vocabulary', level: 'N5', status: 'reviewing', performance: 'medium', last_rating: 'medium' },
                    { id: 'v-103', title: '学校 (Gakkou)', type: 'vocabulary', level: 'N5', status: 'learning', performance: 'low', last_rating: 'hard' },
                    { id: 'v-104', title: '経済 (Keizai)', type: 'vocabulary', level: 'N3', status: 'mastered', performance: 'perfect', last_rating: 'perfect' },
                    { id: 'v-105', title: '分析 (Bunseki)', type: 'vocabulary', level: 'N3', status: 'reviewing', performance: 'medium', last_rating: 'medium' },
                ]
            },
            {
                id: 'kr-2',
                title: 'Achieve 85% accuracy on vocab quizzes',
                current: 78,
                target: 85,
                unit: '%',
                trend: 'stable',
                velocity: 0.3,
                projected_completion: '2024-04-20',
                contributing_task_types: ['quiz'],
                confidence: 70,
            },
            {
                id: 'kr-3',
                title: 'Complete daily SRS reviews (5 days/week)',
                current: 4.2,
                target: 5,
                unit: 'days/week',
                trend: 'improving',
                velocity: 0.1,
                projected_completion: '2024-03-25',
                contributing_task_types: ['flashcard'],
                confidence: 90,
            },
        ],
        progress: 65,
        on_track: true,
        risk_level: 'low',
        blockers: [],
        weekly_review_status: 'reviewed',
        last_weekly_review: '2024-03-17',
    },
    {
        id: 'okr-2',
        smart_goal_id: 'smart-2',
        objective: 'Internalize N3 Grammar Structures',
        description: 'Understand and correctly apply N3 grammar patterns in reading and writing',
        start_date: '2024-01-15',
        end_date: '2024-05-15',
        keyResults: [
            {
                id: 'kr-4',
                title: 'Learn 60 grammar patterns',
                current: 45,
                target: 60,
                unit: 'patterns',
                trend: 'improving',
                velocity: 2.8,
                projected_completion: '2024-04-10',
                contributing_task_types: ['lesson', 'quiz'],
                confidence: 80,
                items: [
                    { id: 'g-55', title: '~てもいい', type: 'grammar', level: 'N5', status: 'mastered', performance: 'high', last_rating: 'easy' },
                    { id: 'g-56', title: '~なくてはいけない', type: 'grammar', level: 'N5', status: 'reviewing', performance: 'medium', last_rating: 'medium' },
                    { id: 'g-57', title: '~たり~たり', type: 'grammar', level: 'N5', status: 'learning', performance: 'low', last_rating: 'hard' },
                    { id: 'g-58', title: '~ほど', type: 'grammar', level: 'N3', status: 'learning', performance: 'medium', last_rating: 'medium' },
                ]
            },
            {
                id: 'kr-5',
                title: 'Score 80% on grammar exercises',
                current: 75,
                target: 80,
                unit: '%',
                trend: 'declining',
                velocity: -0.5,
                contributing_task_types: ['quiz'],
                confidence: 55,
            },
        ],
        progress: 55,
        on_track: false,
        risk_level: 'medium',
        blockers: ['Causative-passive confusion', 'Limited practice time this week'],
        weekly_review_status: 'pending',
    },
];

export const mockPACT: PACTStatEnhanced = {
    id: 'pact-1',
    okr_id: 'okr-1',
    purpose: 'Become confident in Japanese to work and travel in Japan',
    purpose_alignment_score: 92,
    actions: [
        {
            id: 'action-1',
            action_type: 'review',
            description: 'Complete daily SRS flashcard reviews',
            target_minutes: 15,
            actual_minutes_avg: 18,
            completion_rate: 92,
            best_time_of_day: 'morning',
            completed_today: true,
        },
        {
            id: 'action-2',
            action_type: 'study',
            description: 'Learn 5 new vocabulary words with context',
            target_minutes: 10,
            actual_minutes_avg: 12,
            completion_rate: 85,
            best_time_of_day: 'evening',
            completed_today: false,
        },
        {
            id: 'action-3',
            action_type: 'practice',
            description: 'Complete 1 grammar exercise set',
            target_minutes: 15,
            actual_minutes_avg: 14,
            completion_rate: 78,
            best_time_of_day: 'afternoon',
            completed_today: false,
        },
    ],
    continuous: true,
    streak_current: 12,
    streak_longest: 28,
    streak_target: 30,
    missed_days_this_week: 1,
    trackable: true,
    daily_metrics: [
        { date: '2024-03-14', minutes_studied: 42, tasks_completed: 3, accuracy_avg: 82, focus_score: 78 },
        { date: '2024-03-15', minutes_studied: 38, tasks_completed: 3, accuracy_avg: 85, focus_score: 82 },
        { date: '2024-03-16', minutes_studied: 0, tasks_completed: 0, accuracy_avg: 0, focus_score: 0 },
        { date: '2024-03-17', minutes_studied: 55, tasks_completed: 4, accuracy_avg: 79, focus_score: 75 },
        { date: '2024-03-18', minutes_studied: 48, tasks_completed: 3, accuracy_avg: 88, focus_score: 85 },
        { date: '2024-03-19', minutes_studied: 35, tasks_completed: 2, accuracy_avg: 80, focus_score: 70 },
        { date: '2024-03-20', minutes_studied: 25, tasks_completed: 1, accuracy_avg: 90, focus_score: 88 },
    ],
    context_tracking: true,
    last_context: {
        timestamp: '2024-03-20T08:30:00Z',
        sleep_quality: 'good',
        stress_level: 'medium',
        mood: 'focused',
        energy_level: 7,
    },
};

export const mockPriorityMatrix: PriorityMatrix = {
    user_id: 'user-1',
    generated_at: '2024-03-20T00:00:00Z',
    skills: [
        { skill: 'vocabulary', priority: 'yellow', reason: 'On track but needs consistent practice', last_assessed: '2024-03-19', accuracy_trend: 5 },
        { skill: 'grammar', priority: 'red', reason: 'Causative-passive accuracy dropped 15%', last_assessed: '2024-03-19', accuracy_trend: -15 },
        { skill: 'kanji', priority: 'yellow', reason: 'Good progress, maintain pace', last_assessed: '2024-03-18', accuracy_trend: 2 },
        { skill: 'reading', priority: 'green', reason: 'Strong performance, maintenance only', last_assessed: '2024-03-17', accuracy_trend: 8 },
        { skill: 'listening', priority: 'red', reason: 'Limited practice time, accuracy unknown', last_assessed: '2024-03-10', accuracy_trend: -5 },
    ],
    content_items: [
        { content_type: 'grammar', content_id: 'g-1', title: '〜させられる (causative-passive)', priority: 'red', error_count_last_7_days: 8, recommended_action: 'Re-study with examples' },
        { content_type: 'grammar', content_id: 'g-2', title: '〜ようにする', priority: 'red', error_count_last_7_days: 5, recommended_action: 'Practice sentence formation' },
        { content_type: 'vocabulary', content_id: 'v-1', title: '熟語 (compound words)', priority: 'yellow', error_count_last_7_days: 3, recommended_action: 'Add to SRS deck' },
        { content_type: 'kanji', content_id: 'k-1', title: '読み (readings) confusion', priority: 'yellow', error_count_last_7_days: 4, recommended_action: 'Context practice' },
    ],
    today_focus: 'drill_practice',
    today_time_allocation: {
        red_minutes: 20,
        yellow_minutes: 15,
        green_minutes: 10,
    },
};

export const mockReviewCycles: ReviewCycle[] = [
    {
        id: 'review-1',
        user_id: 'user-1',
        cycle_type: 'weekly',
        period_start: '2024-03-11',
        period_end: '2024-03-17',
        metrics: {
            total_study_minutes: 245,
            avg_daily_minutes: 35,
            tasks_completed: 18,
            tasks_total: 21,
            completion_rate: 86,
            avg_accuracy: 81,
            accuracy_trend: 'stable',
            streak_maintained: true,
            days_studied: 6,
            days_in_period: 7,
            okr_progress_delta: 8,
            red_items_count: 2,
            yellow_items_count: 5,
            green_items_count: 12,
        },
        wins: [
            'Completed 120 flashcard reviews',
            'Vocabulary accuracy improved 3%',
            'Maintained 12-day streak',
        ],
        challenges: [
            'Missed Sunday session',
            'Grammar causative-passive still confusing',
            'Low energy mid-week affected focus',
        ],
        adjustments_made: [
            'Added causative-passive to priority review',
            'Scheduled grammar practice in morning when energy high',
        ],
        next_cycle_goals: [
            'Complete all 7 days of practice',
            'Focus on grammar weak points',
            'Add 10 min listening practice daily',
        ],
        focus_areas: ['grammar', 'listening'],
    },
];

// ============================================
// Utility Functions
// ============================================

export function getSMARTGoalById(id: string): SMARTGoalEnhanced | undefined {
    return mockSMARTGoals.find(g => g.id === id);
}

export function getOKRById(id: string): OKRGoalEnhanced | undefined {
    return mockOKRs.find(o => o.id === id);
}

export function getOKRsForSMARTGoal(smartGoalId: string): OKRGoalEnhanced[] {
    return mockOKRs.filter(o => o.smart_goal_id === smartGoalId);
}

export function calculateOverallProgress(): number {
    const totalProgress = mockSMARTGoals.reduce((sum, g) => sum + g.progress, 0);
    return Math.round(totalProgress / mockSMARTGoals.length);
}
