/**
 * Game Engine Service - Core game loop, question serving, scoring, and power-up logic
 * 
 * This service implements the Hybrid Assessment Mode with configurable:
 * - SRS (Spaced Repetition System) question queueing
 * - Speed-based scoring
 * - Power-up system
 */

import { Question } from '@/types/practice';
import {
    GameSessionConfig,
    SRSQueueItem,
    PlayerGameState,
    ScoreResult,
    PowerUp,
    PowerUpType,
    PowerUpResult,
    GameAnswer,
    GameResult,
    WeakGameItem,
    ProgressIndicator,
    LinearProgress,
    MasteryProgress,
    SCORING_CONFIG,
    SRS_CONFIG,
    INITIAL_POWERUPS,
    GameSessionStatus
} from '@/types/game';

// =============================================================================
// QUESTION SERVING STRATEGY
// =============================================================================

/**
 * Get the next question based on session configuration
 * 
 * IF is_srs_enabled == FALSE (Linear Mode):
 *   - Standard sequential traversal
 *   - Returns questions[currentIndex]
 *   - End when currentIndex >= totalQuestions
 * 
 * IF is_srs_enabled == TRUE (SRS/Adaptive Mode):
 *   - Dynamic Priority Queue
 *   - Returns first item from srsQueue
 *   - End when queue is empty (all mastered)
 */
export function getNextQuestion(
    config: GameSessionConfig,
    state: PlayerGameState,
    questions: Question[]
): Question | null {
    if (!config.is_srs_enabled) {
        // LINEAR MODE: Sequential traversal
        if (state.currentIndex >= questions.length) {
            return null; // End of exam
        }
        return questions[state.currentIndex];
    } else {
        // SRS/ADAPTIVE MODE: Priority queue
        if (state.srsQueue.length === 0) {
            return null; // All mastered
        }
        const nextItem = state.srsQueue[0];
        return questions.find(q => q.id === nextItem.questionId) || null;
    }
}

/**
 * Check if the game session is complete
 */
export function isSessionComplete(
    config: GameSessionConfig,
    state: PlayerGameState,
    totalQuestions: number
): boolean {
    if (!config.is_srs_enabled) {
        // Linear mode: complete when we've gone through all questions
        return state.currentIndex >= totalQuestions;
    } else {
        // SRS mode: complete when all questions are mastered
        return state.srsQueue.length === 0;
    }
}

/**
 * Get the current question index for display purposes
 */
export function getCurrentQuestionNumber(
    config: GameSessionConfig,
    state: PlayerGameState
): number {
    if (!config.is_srs_enabled) {
        return state.currentIndex + 1;
    } else {
        // In SRS mode, show how many have been answered
        return Object.keys(state.answers).length + 1;
    }
}

// =============================================================================
// SRS QUEUE MANAGEMENT
// =============================================================================

/**
 * Initialize the SRS queue with all questions
 */
export function initializeSRSQueue(questions: Question[]): SRSQueueItem[] {
    return questions.map(q => ({
        questionId: q.id,
        attempts: 0,
        lastAttemptCorrect: false,
        masteryStatus: 'NEW'
    }));
}

/**
 * Update SRS queue after answering a question
 * 
 * On Correct Answer: Remove question from queue (Mastered)
 * On Wrong Answer: Re-insert at currentIndex + offset (default: 3)
 */
export function updateSRSQueue(
    queue: SRSQueueItem[],
    questionId: string,
    isCorrect: boolean,
    reinsertOffset: number = SRS_CONFIG.REINSERT_OFFSET
): { newQueue: SRSQueueItem[]; wasMastered: boolean; item: SRSQueueItem | null } {
    const itemIndex = queue.findIndex(q => q.questionId === questionId);
    if (itemIndex === -1) {
        return { newQueue: queue, wasMastered: false, item: null };
    }

    const item: SRSQueueItem = {
        ...queue[itemIndex],
        attempts: queue[itemIndex].attempts + 1,
        lastAttemptCorrect: isCorrect,
        lastAttemptedAt: new Date().toISOString()
    };

    // Remove from current position
    const newQueue = [...queue.slice(0, itemIndex), ...queue.slice(itemIndex + 1)];

    if (isCorrect) {
        // CORRECT: Mark as mastered, don't reinsert
        item.masteryStatus = 'MASTERED';
        return { newQueue, wasMastered: true, item };
    } else {
        // WRONG: Reinsert at offset position (or end of queue)
        item.masteryStatus = 'LEARNING';
        const insertPosition = Math.min(
            Math.max(SRS_CONFIG.MIN_REINSERT_POSITION, reinsertOffset),
            newQueue.length
        );
        newQueue.splice(insertPosition, 0, item);
        return { newQueue, wasMastered: false, item };
    }
}

/**
 * Calculate mastery percentage
 */
export function calculateMasteryPercentage(
    masteredCount: number,
    totalQuestions: number
): number {
    if (totalQuestions === 0) return 0;
    return Math.round((masteredCount / totalQuestions) * 100);
}

// =============================================================================
// SCORING MECHANISM
// =============================================================================

/**
 * Calculate score for an answer
 * 
 * Base formula:
 *   if not isCorrect: return 0
 *   baseScore = 1000
 *   
 *   if is_speed_scoring_enabled:
 *     timeFactor = 1 - (timeTaken / totalTime)
 *     finalScore = baseScore + (1000 * timeFactor)
 *   else:
 *     finalScore = baseScore (Flat rate)
 */
export function calculateScore(
    config: GameSessionConfig,
    isCorrect: boolean,
    timeTakenMs: number,
    totalTimeMs: number,
    currentStreak: number,
    hasDoublePointsActive: boolean = false
): ScoreResult {
    if (!isCorrect) {
        return {
            baseScore: 0,
            timeBonus: 0,
            streakMultiplier: 1,
            powerupMultiplier: 1,
            finalScore: 0,
            isCorrect: false
        };
    }

    const baseScore = SCORING_CONFIG.BASE_SCORE;
    let timeBonus = 0;
    let streakMultiplier = 1;
    let powerupMultiplier = 1;

    // Speed scoring
    if (config.is_speed_scoring_enabled && totalTimeMs > 0) {
        const timeFactor = Math.max(0, 1 - (timeTakenMs / totalTimeMs));
        timeBonus = Math.round(SCORING_CONFIG.MAX_TIME_BONUS * timeFactor);
    }

    // Streak bonus: +10% every 3 correct, max 2x
    const streakThresholds = Math.floor(currentStreak / SCORING_CONFIG.STREAK_BONUS_THRESHOLD);
    streakMultiplier = Math.min(
        SCORING_CONFIG.MAX_STREAK_MULTIPLIER,
        1 + streakThresholds * SCORING_CONFIG.STREAK_BONUS_INCREMENT
    );

    // Power-up multiplier
    if (hasDoublePointsActive) {
        powerupMultiplier = SCORING_CONFIG.DOUBLE_POINTS_MULTIPLIER;
    }

    const finalScore = Math.round((baseScore + timeBonus) * streakMultiplier * powerupMultiplier);

    return {
        baseScore,
        timeBonus,
        streakMultiplier,
        powerupMultiplier,
        finalScore,
        isCorrect: true
    };
}

/**
 * Calculate max possible score for a session
 */
export function calculateMaxPossibleScore(
    config: GameSessionConfig,
    totalQuestions: number
): number {
    // Assume perfect timing and max streak
    const basePerQuestion = SCORING_CONFIG.BASE_SCORE;
    const maxTimeBonus = config.is_speed_scoring_enabled ? SCORING_CONFIG.MAX_TIME_BONUS : 0;
    const maxMultiplier = SCORING_CONFIG.MAX_STREAK_MULTIPLIER;

    return Math.round((basePerQuestion + maxTimeBonus) * maxMultiplier * totalQuestions);
}

// =============================================================================
// POWER-UPS SYSTEM
// =============================================================================

/**
 * Check if a power-up can be used
 * 
 * API Layer Guard: If is_powerup_enabled == FALSE, reject (403 equivalent)
 */
export function canUsePowerUp(
    config: GameSessionConfig,
    powerups: PowerUp[],
    type: PowerUpType
): PowerUpResult {
    // Primary guard: Check if power-ups are enabled
    if (!config.is_powerup_enabled) {
        return {
            allowed: false,
            reason: 'Power-ups are disabled for this session (HTTP 403 equivalent)'
        };
    }

    const powerup = powerups.find(p => p.type === type);
    if (!powerup) {
        return {
            allowed: false,
            reason: `Power-up type ${type} not found`
        };
    }

    if (powerup.quantity <= 0) {
        return {
            allowed: false,
            reason: `No ${type} power-ups remaining`
        };
    }

    if (powerup.isActive) {
        return {
            allowed: false,
            reason: `${type} is already active`
        };
    }

    return { allowed: true };
}

/**
 * Initialize power-ups for a session
 * 
 * State Layer: Do not generate power-ups if disabled
 */
export function initializePowerups(config: GameSessionConfig): PowerUp[] {
    if (!config.is_powerup_enabled) {
        return []; // Don't generate power-ups if disabled
    }

    return INITIAL_POWERUPS.map(p => ({ ...p }));
}

/**
 * Use a power-up (decrement quantity, set active)
 */
export function usePowerUp(
    powerups: PowerUp[],
    type: PowerUpType
): PowerUp[] {
    return powerups.map(p => {
        if (p.type === type && p.quantity > 0) {
            return {
                ...p,
                quantity: p.quantity - 1,
                isActive: true
            };
        }
        return p;
    });
}

/**
 * Deactivate a power-up after use
 */
export function deactivatePowerUp(
    powerups: PowerUp[],
    type: PowerUpType
): PowerUp[] {
    return powerups.map(p => {
        if (p.type === type) {
            return { ...p, isActive: false };
        }
        return p;
    });
}

/**
 * Apply FIFTY_FIFTY power-up: Remove 2 wrong options
 */
export function applyFiftyFifty(
    question: Question
): string[] {
    const correctId = question.correctOptionId;
    const wrongOptions = question.options.filter(o => o.id !== correctId);

    // Keep the correct answer and one random wrong answer
    const shuffled = wrongOptions.sort(() => Math.random() - 0.5);
    const optionToKeep = shuffled[0];

    return [correctId, optionToKeep?.id].filter(Boolean) as string[];
}

// =============================================================================
// PROGRESS INDICATORS
// =============================================================================

/**
 * Get progress indicator based on session mode
 * 
 * Linear Mode: "Question X of Y"
 * SRS Mode: "Mastery X%"
 */
export function getProgressIndicator(
    config: GameSessionConfig,
    state: PlayerGameState,
    totalQuestions: number
): ProgressIndicator {
    if (!config.is_srs_enabled) {
        const current = state.currentIndex + 1;
        const percentage = Math.round((state.currentIndex / totalQuestions) * 100);
        return {
            type: 'linear',
            current: Math.min(current, totalQuestions),
            total: totalQuestions,
            percentage,
            label: `Question ${Math.min(current, totalQuestions)} of ${totalQuestions}`
        } as LinearProgress;
    } else {
        return {
            type: 'mastery',
            percentage: state.masteryPercentage,
            mastered: state.masteredQuestions.length,
            remaining: state.srsQueue.length,
            total: totalQuestions,
            label: `Mastery: ${state.masteryPercentage}%`
        } as MasteryProgress;
    }
}

// =============================================================================
// SESSION MANAGEMENT
// =============================================================================

/**
 * Create initial player state
 */
export function createInitialState(
    config: GameSessionConfig,
    questions: Question[]
): PlayerGameState {
    const now = new Date().toISOString();

    return {
        sessionId: config.id,
        sessionConfig: config,
        userId: config.userId,
        currentIndex: 0,
        srsQueue: config.is_srs_enabled ? initializeSRSQueue(questions) : [],
        masteredQuestions: [],
        masteryPercentage: 0,
        answers: {},
        score: 0,
        streak: 0,
        maxStreak: 0,
        powerups: initializePowerups(config),
        startedAt: now,
        questionStartedAt: now,
        totalTimeSpentMs: 0,
        status: 'READY'
    };
}

/**
 * Process an answer and update state
 */
export function processAnswer(
    state: PlayerGameState,
    question: Question,
    selectedOptionId: string,
    timeTakenMs: number
): {
    newState: PlayerGameState;
    scoreResult: ScoreResult;
    isComplete: boolean;
} {
    const config = state.sessionConfig;
    const isCorrect = question.correctOptionId === selectedOptionId;
    const totalTimeMs = config.timePerQuestionSeconds * 1000;

    // Check for active double points
    const hasDoublePoints = state.powerups.some(
        p => p.type === 'DOUBLE_POINTS' && p.isActive
    );

    // Calculate score
    const newStreak = isCorrect ? state.streak + 1 : 0;
    const scoreResult = calculateScore(
        config,
        isCorrect,
        timeTakenMs,
        totalTimeMs,
        newStreak,
        hasDoublePoints
    );

    // Create answer record
    const answer: GameAnswer = {
        questionId: question.id,
        selectedOptionId,
        isCorrect,
        timeSpentMs: timeTakenMs,
        scoreEarned: scoreResult.finalScore,
        answeredAt: new Date().toISOString()
    };

    // Build new state
    let newState: PlayerGameState = {
        ...state,
        answers: { ...state.answers, [question.id]: answer },
        score: state.score + scoreResult.finalScore,
        streak: newStreak,
        maxStreak: Math.max(state.maxStreak, newStreak),
        totalTimeSpentMs: state.totalTimeSpentMs + timeTakenMs,
        questionStartedAt: new Date().toISOString(),
        status: 'IN_PROGRESS'
    };

    // Deactivate double points after use
    if (hasDoublePoints) {
        newState.powerups = deactivatePowerUp(newState.powerups, 'DOUBLE_POINTS');
    }

    // Update based on mode
    if (!config.is_srs_enabled) {
        // Linear mode: advance index
        newState.currentIndex = state.currentIndex + 1;
    } else {
        // SRS mode: update queue
        const { newQueue, wasMastered } = updateSRSQueue(
            state.srsQueue,
            question.id,
            isCorrect
        );
        newState.srsQueue = newQueue;

        if (wasMastered) {
            newState.masteredQuestions = [...state.masteredQuestions, question.id];
        }

        newState.masteryPercentage = calculateMasteryPercentage(
            newState.masteredQuestions.length,
            newState.masteredQuestions.length + newQueue.length
        );
    }

    // Check completion
    const totalQuestions = config.is_srs_enabled
        ? state.masteredQuestions.length + state.srsQueue.length
        : Object.keys(newState.answers).length + (newState.srsQueue?.length || 0);

    const isComplete = isSessionComplete(config, newState, totalQuestions);
    if (isComplete) {
        newState.status = 'COMPLETED';
    }

    return { newState, scoreResult, isComplete };
}

/**
 * Generate game result
 */
export function generateGameResult(
    state: PlayerGameState,
    questions: Question[],
    nodeTitle: string
): GameResult {
    const config = state.sessionConfig;
    const answers: GameAnswer[] = Object.values(state.answers);
    const correctCount = answers.filter(a => a.isCorrect).length;
    const totalQuestions = questions.length;

    // Calculate power-ups used
    const powerupsUsed: Record<PowerUpType, number> = {
        'FIFTY_FIFTY': 0,
        'TIME_FREEZE': 0,
        'DOUBLE_POINTS': 0,
        'SKIP': 0
    };

    INITIAL_POWERUPS.forEach(initial => {
        const current = state.powerups.find(p => p.type === initial.type);
        if (current) {
            powerupsUsed[initial.type] = initial.quantity - current.quantity;
        }
    });

    // Generate weak items
    const weakItems: WeakGameItem[] = answers
        .filter(a => !a.isCorrect)
        .map(a => {
            const q = questions.find(q => q.id === a.questionId)!;
            const correctOption = q.options.find(o => o.id === q.correctOptionId);
            const userOption = q.options.find(o => o.id === a.selectedOptionId);
            return {
                questionId: a.questionId,
                questionContent: q.content,
                correctAnswer: correctOption?.text || q.correctOptionId,
                userAnswer: userOption?.text || a.selectedOptionId,
                attempts: config.is_srs_enabled
                    ? (state.srsQueue.find(i => i.questionId === a.questionId)?.attempts || 1)
                    : 1
            };
        });

    return {
        sessionId: state.sessionId,
        nodeId: config.nodeId,
        nodeTitle,
        userId: state.userId,
        config,
        totalScore: state.score,
        maxPossibleScore: calculateMaxPossibleScore(config, totalQuestions),
        scorePercentage: Math.round((correctCount / totalQuestions) * 100),
        totalQuestions,
        correctAnswers: correctCount,
        incorrectAnswers: answers.filter(a => !a.isCorrect).length,
        masteryAchieved: config.is_srs_enabled && state.srsQueue.length === 0,
        maxStreak: state.maxStreak,
        totalTimeSpentSeconds: Math.round(state.totalTimeSpentMs / 1000),
        averageTimePerQuestionSeconds: Math.round(state.totalTimeSpentMs / 1000 / answers.length),
        startedAt: state.startedAt,
        completedAt: new Date().toISOString(),
        powerupsUsed,
        answers,
        weakItems
    };
}
