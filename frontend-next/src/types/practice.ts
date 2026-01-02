// =============================================================================
// Hanachan Practice Nexus - Unified Type Definitions
// =============================================================================

// --- Core Enums & Types ---

export type PracticeMode = 'ALL' | 'QUIZ' | 'SINGLE_EXAM' | 'FULL_EXAM';

export type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

export type SkillType = 'VOCABULARY' | 'GRAMMAR' | 'READING' | 'LISTENING';

export type QuestionStatus = 'UNANSWERED' | 'ANSWERED' | 'FLAGGED';

export type DisplayMode = 'FOCUS' | 'SCROLL';

export type TimerMode = 'UNLIMITED' | 'JLPT_STANDARD' | 'CUSTOM';

export type ProtocolOrigin = 'system' | 'chatbot' | 'manual' | 'ai';

// --- Unified Metadata & Tags ---

export interface PracticeTags {
    levels: JLPTLevel[];
    skills: SkillType[];
    category?: string; // e.g. "Kanj", "Particles"
    origin: ProtocolOrigin;
    isStrict?: boolean; // For strict timing enforcement
    timerMode?: TimerMode;
}

export interface PracticeStats {
    questionCount: number;
    timeLimitMinutes?: number;
    timeLimitSeconds?: number;
    estimatedTimeMinutes?: number;
}

export interface PersonalData {
    hasCompleted: boolean;
    bestScore?: number;
    lastAttemptedAt?: string;
    attemptCount: number;
    status: 'NEW' | 'PASSED' | 'FAILED' | 'IN_PROGRESS';
}

// --- Unified Practice Node (Base for Quizzes/Exams) ---

export interface PracticeNode {
    id: string;
    title: string;
    description: string;
    // Unified Backend structure
    mode: Exclude<PracticeMode, 'ALL'>;
    levels: JLPTLevel[];
    skills: SkillType[];
    isPublic: boolean;
    tags?: PracticeTags;
    stats: PracticeStats;

    // Personalization (for logged-in users)
    personalData?: PersonalData;

    // For Multi-segment Exams (Standard JLPT)
    segments?: ExamSegment[];

    // Guest access
    isPremium?: boolean;
}

// --- Question Types (Cognitive Units) ---

export interface QuestionOption {
    id: string;
    text: string;
    isCorrect?: boolean; // Only revealed after submission
}

/**
 * Formerly Question, now evolving towards CognitiveUnit
 */
export interface Question {
    id: string;
    type: 'MULTIPLE_CHOICE' | 'READING_PASSAGE' | 'LISTENING';
    content: string;
    passage?: string; // For reading questions
    audioUrl?: string; // For listening questions
    options: QuestionOption[];
    correctOptionId: string;
    explanation: string;
    tags: PracticeTags;
}

// --- Specific Implementations ---

export interface ExamSegment {
    id: string;
    title: string; // e.g. "Language Knowledge"
    skills: SkillType[];
    questionCount: number;
    timeLimitMinutes: number;
    breakAfterMinutes?: number;
    questions?: Question[];
}

// --- Session State ---

export interface UserAnswer {
    questionId: string;
    selectedOptionId: string | string[] | null;
    timeSpentSeconds: number;
}

export interface ExamSession {
    id: string;
    nodeId: string; // References PracticeNode id
    node: PracticeNode;
    questions: Question[];
    answers: Record<string, UserAnswer>;
    flaggedQuestions: string[];
    currentQuestionIndex: number;
    currentSegmentIndex?: number;
    displayMode: DisplayMode;
    status: 'INTRO' | 'TESTING' | 'BREAK' | 'TRANSITION' | 'COMPLETED';
    startedAt: string;
    timeRemainingSeconds: number;
    isSubmitted: boolean;
    isPaused: boolean;
    isOnBreak: boolean;
}

// --- Results ---

export interface SkillBreakdown {
    skill: SkillType;
    totalQuestions: number;
    correctAnswers: number;
    percentage: number;
}

export interface PracticeAttempt {
    id: string;
    userId?: string;
    nodeId: string;
    nodeTitle: string;
    mode: Exclude<PracticeMode, 'ALL'>;
    tags: PracticeTags;

    // Results
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    unansweredQuestions: number;
    scorePercentage: number;
    passed: boolean;

    // Timing
    startedAt: string;
    completedAt: string;
    timeTakenSeconds: number;

    // Details
    skillBreakdown: SkillBreakdown[];
    answers: Record<string, UserAnswer>;
    weakItems?: WeakItem[];
}

export interface WeakItem {
    id: string | null; // e.g. flashcard_id
    learningPoint: string;
    type: string;
}

// --- Legacy Compatibility (Aliasing) ---
export type ExamConfig = PracticeNode;
export type ExamAttempt = PracticeAttempt;
export type ExamResult = PracticeAttempt;

export interface UserCreatedExam {
    id: string;
    userId: string;
    config: PracticeNode;
    questions: Question[];
    createdAt: string;
    updatedAt: string;
    timesAttempted: number;
    isPublic: boolean;
    averageScore?: number;
}

// --- Filter State ---

export interface FilterState {
    mode: PracticeMode;
    levels: JLPTLevel[];
    skills: SkillType[];
    timing?: 'ALL' | 'TIMED' | 'UNLIMITED';
    status?: 'ALL' | 'COMPLETED' | 'IN_PROGRESS' | 'NEVER_ATTEMPTED';
    origin?: 'ALL' | ProtocolOrigin;
    access?: 'PUBLIC' | 'PERSONAL' | 'ALL';
}

// --- UI Props ---

export interface PracticeCardProps {
    node: PracticeNode;
    onStart: (id: string) => void;
}
