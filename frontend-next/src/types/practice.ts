// =============================================================================
// JLPT Practice Platform - Type Definitions
// =============================================================================

// --- Core Enums & Types ---

export type PracticeMode = 'ALL' | 'QUIZ' | 'SINGLE_EXAM' | 'FULL_EXAM';

export type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

export type SkillType = 'VOCABULARY' | 'GRAMMAR' | 'READING' | 'LISTENING';

export type QuestionStatus = 'UNANSWERED' | 'ANSWERED' | 'FLAGGED';

export type DisplayMode = 'FOCUS' | 'SCROLL';

export type TimerMode = 'UNLIMITED' | 'JLPT_STANDARD' | 'CUSTOM';

// --- Question Types ---

export interface QuestionOption {
    id: string;
    text: string;
    isCorrect?: boolean; // Only revealed after submission
}

export interface Question {
    id: string;
    type: 'MULTIPLE_CHOICE' | 'READING_PASSAGE' | 'LISTENING';
    content: string;
    passage?: string; // For reading questions
    audioUrl?: string; // For listening questions
    options: QuestionOption[];
    correctOptionId: string;
    explanation: string;
    tags: {
        level: JLPTLevel;
        skill: SkillType;
        topic?: string;
        difficulty?: number; // 1-5
    };
}

// --- Exam/Quiz Configuration ---

export interface ExamConfig {
    id: string;
    mode: Exclude<PracticeMode, 'ALL'>;
    title: string;
    description: string;
    level: JLPTLevel;
    skills: SkillType[];
    questionCount: number;
    timerMode: TimerMode;
    timeLimitMinutes?: number; // For JLPT_STANDARD or CUSTOM
    sections?: ExamSection[]; // For FULL_EXAM only
}

export interface ExamSection {
    id: string;
    name: string;
    skill: SkillType;
    questionCount: number;
    timeLimitMinutes: number;
    breakAfterMinutes?: number;
}

// --- Session State ---

export interface UserAnswer {
    questionId: string;
    selectedOptionId: string | null;
    timeSpentSeconds: number;
}

export interface ExamSession {
    id: string;
    examId: string;
    examConfig: ExamConfig;
    questions: Question[];
    answers: Map<string, UserAnswer> | Record<string, UserAnswer>;
    flaggedQuestions: Set<string> | string[];
    currentQuestionIndex: number;
    currentSectionIndex?: number; // For FULL_EXAM
    displayMode: DisplayMode;
    startedAt: Date | string;
    timeRemainingSeconds: number;
    isSubmitted: boolean;
    isPaused: boolean;
    isOnBreak: boolean;
}

// --- Results ---

export interface ExamResult {
    sessionId: string;
    examId: string;
    examTitle: string;
    level: JLPTLevel;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    unansweredQuestions: number;
    scorePercentage: number;
    timeTakenSeconds: number;
    skillBreakdown: SkillBreakdown[];
    submittedAt: Date | string;
    passed: boolean;
}

export interface SkillBreakdown {
    skill: SkillType;
    totalQuestions: number;
    correctAnswers: number;
    percentage: number;
}

// --- UI Props ---

export interface PracticeCardProps {
    config: ExamConfig;
    onStart: (examId: string) => void;
}

export interface FilterState {
    mode: PracticeMode;
    level: JLPTLevel | 'ALL';
    skill: SkillType | 'ALL';
}
