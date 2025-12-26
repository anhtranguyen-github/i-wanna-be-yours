/**
 * Study Plan Types
 * 
 * TypeScript definitions for the JLPT Study Plan feature.
 */

// ============================================
// Enums / Constants
// ============================================

export type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

export type PlanStatus = 'active' | 'paused' | 'completed' | 'abandoned';

export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

export type TaskStatus = 'pending' | 'completed' | 'skipped';

export type TaskType = 'flashcard' | 'quiz' | 'reading' | 'grammar_lesson' | 'assessment';

export type MilestoneCategory = 'vocabulary' | 'grammar' | 'kanji' | 'reading' | 'listening' | 'mixed';

// ============================================
// API Response Types
// ============================================

export interface JLPTRequirements {
    vocabulary: number;
    kanji: number;
    grammar_points: number;
}

export interface JLPTInfo {
    levels: JLPTLevel[];
    requirements: Record<JLPTLevel, JLPTRequirements>;
    study_time_options: number[];
}

// ============================================
// Plan Template Types
// ============================================

export interface MilestoneCriterion {
    type: 'vocab_count' | 'kanji_count' | 'grammar_points' | 'quiz_score' | 'reading_speed';
    target_value: number;
    current_value?: number;
    unit: string;
}

export interface TemplateMilestone {
    week_start: number;
    week_end: number;
    title: string;
    category: MilestoneCategory;
    criteria: MilestoneCriterion[];
}

export interface PlanTemplateListItem {
    id: string;
    target_level: JLPTLevel;
    duration_weeks: number;
    title: string;
    description: string;
    daily_minutes_recommended: number;
    milestone_count: number;
}

export interface PlanTemplateDetail extends PlanTemplateListItem {
    milestones: TemplateMilestone[];
    jlpt_requirements: JLPTRequirements;
}

// ============================================
// Study Plan Types
// ============================================

export interface StudyPlanSettings {
    daily_study_minutes: number;
    study_days_per_week: number;
    preferred_focus: string[];
}

export interface CreatePlanRequest {
    user_id: string;
    target_level: JLPTLevel;
    exam_date: string; // ISO date string
    daily_study_minutes?: number;
    study_days_per_week?: number;
    preferred_focus?: string[];
}

export interface StudyPlanListItem {
    id: string;
    target_level: JLPTLevel;
    exam_date: string;
    status: PlanStatus;
    days_remaining: number;
    overall_progress_percent: number;
    daily_study_minutes: number;
    created_at: string;
}

export interface Milestone {
    id: string;
    plan_id: string;
    milestone_number: number;
    title: string;
    description: string;
    category: MilestoneCategory;
    status: MilestoneStatus;
    progress_percent: number;
    target_start_date: string;
    target_end_date: string;
    actual_start_date?: string | null;
    actual_end_date?: string | null;
    criteria: MilestoneCriterion[];
}

export interface StudyPlanDetail {
    id: string;
    target_level: JLPTLevel;
    exam_date: string;
    start_date: string;
    status: PlanStatus;
    total_days: number;
    days_remaining: number;
    overall_progress_percent: number;
    daily_study_minutes: number;
    study_days_per_week: number;
    preferred_focus: string[];
    current_milestone_id: string | null;
    milestones: Milestone[];
    jlpt_requirements: JLPTRequirements;
    framework_stats?: FrameworkStats;
}

// ============================================
// Strategic Framework Types (OKR, PACT, SMART)
// ============================================

export interface OKRGoal {
    objective: string;
    key_results: {
        label: string;
        current: number;
        target: number;
        unit: string;
        progress: number;
    }[];
}

export interface PACTStat {
    label: string;
    value: number | string;
    icon: string;
    description: string;
    commitment_level: number; // 0-100
}

export interface SMARTGoal {
    id: string;
    title: string;
    specific_action: string;
    deadline: string;
    is_achievable: boolean;
    relevance: string;
    status: 'active' | 'achieved' | 'failed';
    progress: number;
}

export interface FrameworkStats {
    okr: OKRGoal;
    pact: {
        commitment_score: number;
        habit_strength: number;
        streak: number;
        recent_sessions: number;
        daily_metrics: PACTStat[];
    };
    smart: SMARTGoal[];
}

// ============================================
// Daily Task Types
// ============================================

export interface ContentRef {
    type: 'flashcard_deck' | 'quiz' | 'reading_passage' | 'grammar_point';
    id: string | null;
}

export interface DailyTask {
    id: string | null;
    task_type: TaskType;
    title: string;
    description: string;
    estimated_minutes: number;
    status: TaskStatus;
    completed_at: string | null;
    score: number | null;
}

export interface DailyTasksResponse {
    date: string;
    tasks: DailyTask[];
    plan_id: string;
}

// ============================================
// Progress Types
// ============================================

export interface MilestoneProgress {
    milestone_number: number;
    title: string;
    status: MilestoneStatus;
    progress_percent: number;
}

export interface PlanProgressReport {
    plan_id: string;
    overall_progress_percent: number;
    days_remaining: number;
    days_studied: number;
    study_streak: number;
    milestone_progress: MilestoneProgress[];
    jlpt_requirements: JLPTRequirements;
}

// ============================================
// UI State Types
// ============================================

export interface StudyPlanSetupState {
    step: number;
    targetLevel: JLPTLevel | null;
    examDate: Date | null;
    dailyMinutes: number;
    studyDaysPerWeek: number;
    preferredFocus: string[];
}

export const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

export const FOCUS_AREAS = [
    'vocabulary',
    'grammar',
    'kanji',
    'reading',
    'listening',
] as const;

export const STUDY_TIME_OPTIONS = [15, 30, 60, 90, 120];

// Level display info for UI
export const JLPT_LEVEL_INFO: Record<JLPTLevel, { name: string; description: string; color: string }> = {
    N5: {
        name: 'N5 - Beginner',
        description: 'Basic Japanese, everyday expressions',
        color: '#4CAF50', // Green
    },
    N4: {
        name: 'N4 - Elementary',
        description: 'Basic conversation, simple reading',
        color: '#8BC34A', // Light Green
    },
    N3: {
        name: 'N3 - Intermediate',
        description: 'Daily situations, newspaper headlines',
        color: '#FFC107', // Amber
    },
    N2: {
        name: 'N2 - Upper Intermediate',
        description: 'Complex texts, professional settings',
        color: '#FF9800', // Orange
    },
    N1: {
        name: 'N1 - Advanced',
        description: 'Near-native proficiency, any context',
        color: '#F44336', // Red
    },
};

// ============================================
// Study Session Types
// ============================================

export type SkillCategory = 'grammar' | 'kanji' | 'reading' | 'listening' | 'vocabulary' | 'mixed';

export type EffortLevel = 'light' | 'focused' | 'deep';

export interface StudySession {
    id: string;
    userId: string;
    skill: SkillCategory;
    effortLevel: EffortLevel;
    durationMinutes: number;
    linkedKeyResultId?: string;
    notes?: string;
    createdAt: string;
}

export interface StudyStreak {
    current: number;
    longest: number;
}

// ============================================
// Content Mastery Types
// ============================================

export interface ContentMastery {
    id: string;
    userId: string;
    category: SkillCategory;
    masteryPercent: number;
    itemsLearned: number;
    itemsTotal: number;
    updatedAt: string;
}

export interface ContentMasteryOverview {
    grammar: ContentMastery;
    kanji: ContentMastery;
    vocabulary: ContentMastery;
    reading: ContentMastery;
    listening: ContentMastery;
}

// ============================================
// Reflection Types
// ============================================

export interface ReflectionEntry {
    id: string;
    userId: string;
    weekStartDate: string;
    content: string;
    createdAt: string;
}

// ============================================
// UI Preferences Types
// ============================================

export interface UIPreferences {
    userId: string;
    expandedCards: Record<string, boolean>;
    theme: 'light' | 'dark';
    createdAt?: string;
    updatedAt?: string;
}

// ============================================
// Dashboard Overview Types
// ============================================

export interface DashboardOverview {
    objective: {
        id: string;
        title: string;
        targetExam: string;
        targetDate: string;
        progress: number;
    } | null;
    keyResults: {
        id: string;
        label: string;
        currentValue: number;
        targetValue: number;
        metricType: 'percentage' | 'count' | 'streak';
    }[];
    streak: StudyStreak;
    todaysTasks: DailyTask[];
    recentSessions: StudySession[];
    contentMastery: ContentMasteryOverview;
    examReadiness: number;
    daysRemaining: number;
}

