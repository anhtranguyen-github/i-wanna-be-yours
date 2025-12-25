// =============================================================================
// Quoot - Fast-Paced Flashcard Game Types
// (Quizizz + Kahoot Hybrid)
// =============================================================================

import { JLPTLevel } from './practice';

// --- Deck & Card Types ---

export type QuootCategory = 'VOCABULARY' | 'KANJI' | 'GRAMMAR' | 'PHRASES' | 'MIXED';

export interface QuootDeck {
    id: string;
    title: string;
    description: string;
    cardCount: number;
    level?: JLPTLevel;
    category: QuootCategory;
    coverEmoji?: string;
    coverColor?: string;
    isPublic: boolean;
    createdBy?: string;
    createdAt?: string;
    playCount?: number;
    avgScore?: number;
}

export interface QuootCard {
    id: string;
    front: string;              // Question/term (usually Japanese)
    back: string;               // Answer (usually English)
    furigana?: string;          // Reading for kanji
    hint?: string;              // Optional hint
    audioUrl?: string;          // Audio for listening
    imageUrl?: string;          // Image for visual learning
    wrongOptions?: string[];    // Pre-defined distractors
}

// --- Game Session Types ---

export type QuootMode =
    | 'CLASSIC'         // 3 lives, answer correctly to survive
    | 'SPEED'           // Beat the timer, faster = more points
    | 'ENDLESS'         // No lives, play until you quit
    | 'DAILY_CHALLENGE'; // Daily rotating deck

export interface QuootConfig {
    mode: QuootMode;
    cardCount: number;          // How many cards to play
    timePerCardSeconds: number; // Time limit per question
    enableSRS: boolean;         // Repeat wrong answers
    enablePowerups: boolean;    // 50/50, freeze, etc.
    enableSound: boolean;       // Sound effects
    shuffleCards: boolean;      // Randomize order
    lives?: number;            // For CLASSIC mode
}

export interface QuootSessionState {
    sessionId: string;
    deckId: string;
    deck: QuootDeck;
    cards: QuootCard[];
    config: QuootConfig;

    // Progress
    currentCardIndex: number;
    answeredCards: string[];

    // Scoring
    score: number;
    streak: number;
    maxStreak: number;
    correctCount: number;
    incorrectCount: number;

    // Classic mode
    lives: number;

    // SRS mode
    srsQueue: string[];         // Card IDs to repeat
    masteredCards: string[];    // Card IDs mastered

    // Timing
    startedAt: string;
    questionStartedAt: string;
    totalTimeMs: number;

    // Status
    status: 'READY' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'COMPLETED';
    gameOverReason?: 'OUT_OF_LIVES' | 'TIME_UP' | 'COMPLETED' | 'QUIT';
}

// --- Answer & Result Types ---

export interface QuootAnswer {
    cardId: string;
    selectedAnswer: string;
    isCorrect: boolean;
    timeMs: number;
    scoreEarned: number;
}

export interface QuootResult {
    sessionId: string;
    deckId: string;
    deckTitle: string;
    mode: QuootMode;

    // Scores
    totalScore: number;
    maxPossibleScore: number;
    accuracy: number;           // Percentage

    // Stats
    totalCards: number;
    correctAnswers: number;
    incorrectAnswers: number;
    maxStreak: number;
    livesRemaining?: number;

    // Timing
    totalTimeSeconds: number;
    avgTimePerCardSeconds: number;

    // Details
    answers: QuootAnswer[];
    weakCards: QuootCard[];     // Cards to review

    // Timestamps
    startedAt: string;
    completedAt: string;
}

// --- Power-ups ---

export type QuootPowerupType = 'FIFTY_FIFTY' | 'TIME_FREEZE' | 'EXTRA_LIFE' | 'SKIP';

export interface QuootPowerup {
    type: QuootPowerupType;
    quantity: number;
    isActive: boolean;
}

// --- UI Props ---

export interface QuootCardDisplayProps {
    card: QuootCard;
    options: string[];
    selectedOption: string | null;
    showAnswer: boolean;
    correctAnswer: string;
    onSelect: (option: string) => void;
}

export interface QuootDeckCardProps {
    deck: QuootDeck;
    onClick: () => void;
}

// --- Constants ---

export const QUOOT_MODE_CONFIG: Record<QuootMode, Partial<QuootConfig>> = {
    CLASSIC: {
        lives: 3,
        timePerCardSeconds: 15,
        enablePowerups: true,
        enableSRS: false
    },
    SPEED: {
        timePerCardSeconds: 10,
        enablePowerups: true,
        enableSRS: false
    },
    ENDLESS: {
        timePerCardSeconds: 20,
        enablePowerups: false,
        enableSRS: true
    },
    DAILY_CHALLENGE: {
        cardCount: 10,
        timePerCardSeconds: 12,
        enablePowerups: false,
        enableSRS: false
    }
};

export const QUOOT_SCORING = {
    BASE_CORRECT: 100,
    TIME_BONUS_MAX: 100,
    STREAK_BONUS_THRESHOLD: 3,
    STREAK_BONUS_POINTS: 50,
    PERFECT_BONUS: 500
};

export const DEFAULT_QUOOT_CONFIG: QuootConfig = {
    mode: 'CLASSIC',
    cardCount: 10,
    timePerCardSeconds: 15,
    enableSRS: false,
    enablePowerups: true,
    enableSound: true,
    shuffleCards: true,
    lives: 3
};
