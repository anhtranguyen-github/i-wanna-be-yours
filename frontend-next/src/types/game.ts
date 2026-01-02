// =============================================================================
// Hanachan Game Engine - Hybrid Assessment Mode Types
// =============================================================================

import { PracticeNode, Question, UserAnswer, JLPTLevel, SkillType } from './practice';

// --- Session Configuration Flags ---

export interface GameSessionConfig {
    id: string;
    nodeId: string; // References PracticeNode

    // Feature Toggles (Core Requirements)
    is_srs_enabled: boolean;
    is_speed_scoring_enabled: boolean;
    is_powerup_enabled: boolean;

    // Timing Configuration
    timePerQuestionSeconds: number;
    totalTimeLimitSeconds?: number;

    // Game Mode
    mode: GameMode;

    // Metadata
    createdAt: string;
    userId?: string;
}

export type GameMode = 'SOLO' | 'LIVE_MULTIPLAYER' | 'ASYNC_CHALLENGE';

// --- SRS Queue Management ---

export type MasteryStatus = 'NEW' | 'LEARNING' | 'MASTERED';

export interface SRSQueueItem {
    questionId: string;
    attempts: number;
    lastAttemptCorrect: boolean;
    masteryStatus: MasteryStatus;
    lastAttemptedAt?: string;
}

// --- Player Game State ---

export interface PlayerGameState {
    sessionId: string;
    sessionConfig: GameSessionConfig;
    userId?: string;

    // Linear Mode State
    currentIndex: number;

    // SRS Mode State
    srsQueue: SRSQueueItem[];
    masteredQuestions: string[];
    masteryPercentage: number;

    // Universal State
    answers: Record<string, GameAnswer>;
    score: number;
    streak: number;
    maxStreak: number;
    powerups: PowerUp[];

    // Timing
    startedAt: string;
    questionStartedAt: string;
    totalTimeSpentMs: number;

    // Status
    status: GameSessionStatus;
}

export type GameSessionStatus = 'READY' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED';

// --- Answer Tracking ---

export interface GameAnswer {
    questionId: string;
    selectedOptionId: string | null;
    isCorrect: boolean;
    timeSpentMs: number;
    scoreEarned: number;
    answeredAt: string;
}

// --- Power-ups System ---

export type PowerUpType = 'FIFTY_FIFTY' | 'TIME_FREEZE' | 'DOUBLE_POINTS' | 'SKIP';

export interface PowerUp {
    type: PowerUpType;
    quantity: number;
    isActive: boolean;
}

export interface PowerUpResult {
    allowed: boolean;
    reason?: string;
}

// --- Scoring ---

export interface ScoreResult {
    baseScore: number;
    timeBonus: number;
    streakMultiplier: number;
    powerupMultiplier: number;
    finalScore: number;
    isCorrect: boolean;
}

// --- Progress Indicators ---

export interface LinearProgress {
    type: 'linear';
    current: number;
    total: number;
    percentage: number;
    label: string;
}

export interface MasteryProgress {
    type: 'mastery';
    percentage: number;
    mastered: number;
    remaining: number;
    total: number;
    label: string;
}

export type ProgressIndicator = LinearProgress | MasteryProgress;

// --- Game Results ---

export interface GameResult {
    sessionId: string;
    nodeId: string;
    nodeTitle: string;
    userId?: string;

    // Config used
    config: GameSessionConfig;

    // Scores
    totalScore: number;
    maxPossibleScore: number;
    scorePercentage: number;

    // Stats
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    masteryAchieved: boolean;

    // Streaks
    maxStreak: number;

    // Timing
    totalTimeSpentSeconds: number;
    averageTimePerQuestionSeconds: number;

    // Timestamps
    startedAt: string;
    completedAt: string;

    // Power-ups used
    powerupsUsed: Record<PowerUpType, number>;

    // Detailed answers
    answers: GameAnswer[];

    // Weak items for review
    weakItems: WeakGameItem[];
}

export interface WeakGameItem {
    questionId: string;
    questionContent: string;
    correctAnswer: string;
    userAnswer: string | null;
    attempts: number;
}

// --- UI Component Props ---

export interface GamePlayerProps {
    node: PracticeNode;
    questions: Question[];
    config: GameSessionConfig;
    onComplete: (result: GameResult) => void;
    onExit: () => void;
}

export interface GameConfigFormData {
    is_srs_enabled: boolean;
    is_speed_scoring_enabled: boolean;
    is_powerup_enabled: boolean;
    timePerQuestionSeconds: number;
    mode: GameMode;
}

// --- Constants ---

export const DEFAULT_GAME_CONFIG: Omit<GameSessionConfig, 'id' | 'nodeId' | 'createdAt'> = {
    is_srs_enabled: false,
    is_speed_scoring_enabled: true,
    is_powerup_enabled: false,
    timePerQuestionSeconds: 30,
    mode: 'SOLO'
};

export const SCORING_CONFIG = {
    BASE_SCORE: 1000,
    MAX_TIME_BONUS: 1000,
    STREAK_BONUS_THRESHOLD: 3, // Every 3 correct
    STREAK_BONUS_INCREMENT: 0.1, // +10% per threshold
    MAX_STREAK_MULTIPLIER: 2.0,
    DOUBLE_POINTS_MULTIPLIER: 2.0
};

export const SRS_CONFIG = {
    REINSERT_OFFSET: 3, // Wrong answers reinserted 3 positions later
    MIN_REINSERT_POSITION: 1
};

export const INITIAL_POWERUPS: PowerUp[] = [
    { type: 'FIFTY_FIFTY', quantity: 2, isActive: false },
    { type: 'TIME_FREEZE', quantity: 1, isActive: false },
    { type: 'DOUBLE_POINTS', quantity: 1, isActive: false },
    { type: 'SKIP', quantity: 1, isActive: false }
];
