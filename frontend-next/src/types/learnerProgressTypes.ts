/**
 * Learner Progress Types
 * 
 * TypeScript definitions for the learner progress tracking system.
 */

// ============================================
// Activity Types
// ============================================

export type ActivityType =
    | 'flashcard_review'
    | 'quiz_completed'
    | 'grammar_lesson'
    | 'reading_session'
    | 'listening_session'
    | 'milestone_completed';

export type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

export type LearningCategory = 'vocabulary' | 'kanji' | 'grammar' | 'reading' | 'listening';

// ============================================
// Progress Types
// ============================================

export interface WeeklyGoal {
    target: number;
    current: number;
}

export interface WeeklyGoals {
    flashcard_reviews: WeeklyGoal;
    quizzes_completed: WeeklyGoal;
    study_minutes: WeeklyGoal;
}

export interface LevelScores {
    vocabulary: number;
    kanji: number;
    grammar: number;
}

export interface LearnerProgress {
    id: string;
    user_id: string;
    vocabulary_mastered: number;
    kanji_mastered: number;
    grammar_points_learned: number;
    total_study_time_minutes: number;
    current_streak: number;
    longest_streak: number;
    level_scores: Record<JLPTLevel, LevelScores>;
    weekly_goals: WeeklyGoals;
    last_activity_date: string | null;
    created_at: string;
    updated_at: string;
}

// ============================================
// Activity Types
// ============================================

export interface LearningActivity {
    id: string;
    user_id: string;
    activity_type: ActivityType;
    timestamp: string;
    count?: number;
    score?: number;
    level?: JLPTLevel;
    category?: LearningCategory;
    duration_minutes?: number;
    mastered_count?: number;
}

export interface LogActivityRequest {
    user_id: string;
    activity_type: ActivityType;
    data: {
        count?: number;
        score?: number;
        level?: JLPTLevel;
        category?: LearningCategory;
        duration_minutes?: number;
        mastered_count?: number;
    };
}

export interface LogActivityResponse {
    activity_logged: boolean;
    activity_id: string;
    new_achievements: Achievement[];
    streak: number;
}

// ============================================
// Achievement Types
// ============================================

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    earned: boolean;
    earned_at?: string;
}

export interface AchievementsResponse {
    achievements: Achievement[];
    earned_count: number;
    total_count: number;
}

// ============================================
// Statistics Types
// ============================================

export interface DailyStats {
    flashcard_reviews: number;
    quizzes: number;
    quiz_avg_score: number;
    study_minutes: number;
}

export interface WeeklyStats {
    flashcard_reviews: number;
    quizzes_completed: number;
    avg_quiz_score: number;
    study_minutes: number;
    days_active: number;
}

export interface DetailedStatsResponse {
    period_days: number;
    daily_breakdown: Record<string, DailyStats>;
    level_scores: Record<JLPTLevel, LevelScores>;
    total_activities: number;
}

// ============================================
// Progress Summary
// ============================================

export interface ProgressSummaryResponse {
    progress: LearnerProgress;
    recent_activities: LearningActivity[];
    achievements: Achievement[];
    achievements_count: number;
    total_achievements_available: number;
    weekly_stats: WeeklyStats;
}

// ============================================
// Session Types
// ============================================

export interface StudySession {
    session_id: string;
    started_at: string;
    ended_at?: string;
    duration_minutes?: number;
    focus_area: string;
}

export interface StartSessionRequest {
    user_id: string;
    focus_area?: string;
}

export interface StartSessionResponse {
    session_id: string;
    started_at: string;
}

export interface EndSessionResponse {
    session_id: string;
    duration_minutes: number;
    ended_at: string;
}

// ============================================
// Dashboard Widget Types
// ============================================

export interface StreakInfo {
    current: number;
    longest: number;
    todayCompleted: boolean;
}

export interface ProgressRing {
    label: string;
    current: number;
    target: number;
    color: string;
}

export interface ActivityChartData {
    date: string;
    flashcards: number;
    quizzes: number;
    minutes: number;
}

// ============================================
// Constants
// ============================================

export const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

export const LEARNING_CATEGORIES: LearningCategory[] = [
    'vocabulary',
    'kanji',
    'grammar',
    'reading',
    'listening'
];

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
    flashcard_review: 'Flashcard Review',
    quiz_completed: 'Quiz Completed',
    grammar_lesson: 'Grammar Lesson',
    reading_session: 'Reading Practice',
    listening_session: 'Listening Practice',
    milestone_completed: 'Milestone Completed'
};

export const CATEGORY_COLORS: Record<LearningCategory, string> = {
    vocabulary: '#4CAF50',
    kanji: '#FF9800',
    grammar: '#2196F3',
    reading: '#9C27B0',
    listening: '#00BCD4'
};
