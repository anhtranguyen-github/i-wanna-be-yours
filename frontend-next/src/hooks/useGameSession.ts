"use client";

/**
 * useGameSession - React hook for managing game session state
 * 
 * Implements the Hybrid Assessment Mode with:
 * - SRS (Spaced Repetition System) question queueing (when enabled)
 * - Speed-based scoring (when enabled)
 * - Power-up system (when enabled)
 */

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Question, PracticeNode } from "@/types/practice";
import {
    GameSessionConfig,
    PlayerGameState,
    PowerUp,
    PowerUpType,
    ScoreResult,
    GameResult,
    ProgressIndicator,
    DEFAULT_GAME_CONFIG
} from "@/types/game";
import * as gameEngine from "@/services/gameEngineService";

// =============================================================================
// HOOK OPTIONS & RETURN TYPES
// =============================================================================

interface UseGameSessionOptions {
    node: PracticeNode;
    questions: Question[];
    config?: Partial<GameSessionConfig>;
    onComplete?: (result: GameResult) => void;
}

interface UseGameSessionReturn {
    // Core State
    state: PlayerGameState;
    currentQuestion: Question | null;
    isComplete: boolean;

    // Progress
    progressIndicator: ProgressIndicator;

    // Scoring
    score: number;
    streak: number;
    lastScoreResult: ScoreResult | null;

    // Timer
    timeRemaining: number;
    isTimerActive: boolean;

    // Power-ups
    powerups: PowerUp[];
    fiftyFiftyOptions: string[] | null; // Reduced options after 50/50

    // Actions
    submitAnswer: (optionId: string) => void;
    usePowerUp: (type: PowerUpType) => boolean;
    skipQuestion: () => void;
    pauseGame: () => void;
    resumeGame: () => void;

    // Result
    gameResult: GameResult | null;

    // Config info
    config: GameSessionConfig;
}

// =============================================================================
// MAIN HOOK
// =============================================================================

export function useGameSession({
    node,
    questions,
    config: configOverrides,
    onComplete
}: UseGameSessionOptions): UseGameSessionReturn {
    // Build full config
    const config = useMemo<GameSessionConfig>(() => ({
        id: crypto.randomUUID(),
        nodeId: node.id,
        createdAt: new Date().toISOString(),
        ...DEFAULT_GAME_CONFIG,
        ...configOverrides
    }), [node.id, configOverrides]);

    // Core state
    const [state, setState] = useState<PlayerGameState>(() =>
        gameEngine.createInitialState(config, questions)
    );
    const [lastScoreResult, setLastScoreResult] = useState<ScoreResult | null>(null);
    const [gameResult, setGameResult] = useState<GameResult | null>(null);
    const [fiftyFiftyOptions, setFiftyFiftyOptions] = useState<string[] | null>(null);

    // Timer state
    const [timeRemaining, setTimeRemaining] = useState(config.timePerQuestionSeconds);
    const [isTimerActive, setIsTimerActive] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const questionStartRef = useRef<number>(Date.now());

    // Current question
    const currentQuestion = useMemo(() => {
        return gameEngine.getNextQuestion(config, state, questions);
    }, [config, state, questions]);

    // Is complete
    const isComplete = useMemo(() => {
        return gameEngine.isSessionComplete(config, state, questions.length);
    }, [config, state, questions.length]);

    // Progress indicator
    const progressIndicator = useMemo(() => {
        return gameEngine.getProgressIndicator(config, state, questions.length);
    }, [config, state, questions.length]);

    // ==========================================================================
    // TIMER LOGIC
    // ==========================================================================

    // Start timer when question changes
    useEffect(() => {
        if (currentQuestion && state.status === 'IN_PROGRESS' && !isComplete) {
            setTimeRemaining(config.timePerQuestionSeconds);
            questionStartRef.current = Date.now();
            setIsTimerActive(true);
            setFiftyFiftyOptions(null); // Reset 50/50 for new question
        }
    }, [currentQuestion?.id, state.status, isComplete, config.timePerQuestionSeconds]);

    // Timer countdown
    useEffect(() => {
        if (!isTimerActive || isComplete || state.status === 'PAUSED') {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            return;
        }

        timerRef.current = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    // Time's up - auto-submit with no answer
                    if (currentQuestion) {
                        handleTimeUp();
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isTimerActive, isComplete, state.status, currentQuestion?.id]);

    // ==========================================================================
    // ACTIONS
    // ==========================================================================

    const handleTimeUp = useCallback(() => {
        if (!currentQuestion) return;

        // Submit with no answer (automatic wrong)
        const timeTakenMs = config.timePerQuestionSeconds * 1000;

        const { newState, scoreResult, isComplete: nowComplete } = gameEngine.processAnswer(
            state,
            currentQuestion,
            '', // Empty = wrong
            timeTakenMs
        );

        setState(newState);
        setLastScoreResult(scoreResult);
        setIsTimerActive(false);

        if (nowComplete) {
            const result = gameEngine.generateGameResult(newState, questions, node.title);
            setGameResult(result);
            onComplete?.(result);
        }
    }, [currentQuestion, config.timePerQuestionSeconds, state, questions, node.title, onComplete]);

    const submitAnswer = useCallback((optionId: string) => {
        if (!currentQuestion || isComplete) return;

        const timeTakenMs = Date.now() - questionStartRef.current;
        setIsTimerActive(false);

        const { newState, scoreResult, isComplete: nowComplete } = gameEngine.processAnswer(
            state,
            currentQuestion,
            optionId,
            timeTakenMs
        );

        setState(newState);
        setLastScoreResult(scoreResult);

        if (nowComplete) {
            const result = gameEngine.generateGameResult(newState, questions, node.title);
            setGameResult(result);
            onComplete?.(result);
        } else {
            // Start timer for next question after a short delay
            setTimeout(() => {
                setState(prev => ({ ...prev, status: 'IN_PROGRESS' }));
            }, 1500); // Show score result for 1.5s
        }
    }, [currentQuestion, isComplete, state, questions, node.title, onComplete]);

    const usePowerUp = useCallback((type: PowerUpType): boolean => {
        const { allowed, reason } = gameEngine.canUsePowerUp(config, state.powerups, type);

        if (!allowed) {
            console.warn('Power-up rejected:', reason);
            return false;
        }

        const newPowerups = gameEngine.usePowerUp(state.powerups, type);
        setState(prev => ({ ...prev, powerups: newPowerups }));

        // Apply power-up effects
        switch (type) {
            case 'FIFTY_FIFTY':
                if (currentQuestion) {
                    const reducedOptions = gameEngine.applyFiftyFifty(currentQuestion);
                    setFiftyFiftyOptions(reducedOptions);
                }
                break;
            case 'TIME_FREEZE':
                // Add extra time
                setTimeRemaining(prev => prev + 15);
                // Immediately deactivate (one-time use)
                setState(prev => ({
                    ...prev,
                    powerups: gameEngine.deactivatePowerUp(prev.powerups, 'TIME_FREEZE')
                }));
                break;
            case 'DOUBLE_POINTS':
                // Active flag is already set, will be used in next answer
                break;
            case 'SKIP':
                skipQuestion();
                break;
        }

        return true;
    }, [config, state.powerups, currentQuestion]);

    const skipQuestion = useCallback(() => {
        if (!currentQuestion || isComplete) return;

        // Move to next question without scoring
        if (!config.is_srs_enabled) {
            setState(prev => ({
                ...prev,
                currentIndex: prev.currentIndex + 1
            }));
        } else {
            // In SRS mode, move question to end of queue
            const { newQueue } = gameEngine.updateSRSQueue(
                state.srsQueue,
                currentQuestion.id,
                false, // Treat as wrong for SRS purposes
                state.srsQueue.length // Put at end
            );
            setState(prev => ({
                ...prev,
                srsQueue: newQueue
            }));
        }

        // Reset timer for next question
        questionStartRef.current = Date.now();
        setTimeRemaining(config.timePerQuestionSeconds);
        setFiftyFiftyOptions(null);
    }, [currentQuestion, isComplete, config, state.srsQueue]);

    const pauseGame = useCallback(() => {
        setIsTimerActive(false);
        setState(prev => ({ ...prev, status: 'PAUSED' }));
    }, []);

    const resumeGame = useCallback(() => {
        setIsTimerActive(true);
        setState(prev => ({ ...prev, status: 'IN_PROGRESS' }));
    }, []);

    // ==========================================================================
    // START GAME ON MOUNT
    // ==========================================================================

    useEffect(() => {
        // Auto-start the game
        if (state.status === 'READY' && questions.length > 0) {
            setState(prev => ({ ...prev, status: 'IN_PROGRESS' }));
        }
    }, [state.status, questions.length]);

    // ==========================================================================
    // RETURN
    // ==========================================================================

    return {
        state,
        currentQuestion,
        isComplete,
        progressIndicator,
        score: state.score,
        streak: state.streak,
        lastScoreResult,
        timeRemaining,
        isTimerActive,
        powerups: state.powerups,
        fiftyFiftyOptions,
        submitAnswer,
        usePowerUp,
        skipQuestion,
        pauseGame,
        resumeGame,
        gameResult,
        config
    };
}
