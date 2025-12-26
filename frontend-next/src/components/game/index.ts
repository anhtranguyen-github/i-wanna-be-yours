/**
 * Game Components Index
 * Export all game-related components
 */

// Re-export hook
export { useGameSession } from '@/hooks/useGameSession';

// Re-export types
export type {
    GameSessionConfig,
    PlayerGameState,
    SRSQueueItem,
    PowerUp,
    PowerUpType,
    ScoreResult,
    GameResult,
    ProgressIndicator,
    GameMode,
    MasteryStatus,
    GameSessionStatus,
    GameAnswer,
    WeakGameItem,
    PowerUpResult,
    LinearProgress,
    MasteryProgress,
    GamePlayerProps,
    GameConfigFormData
} from '@/types/game';

export {
    DEFAULT_GAME_CONFIG,
    SCORING_CONFIG,
    SRS_CONFIG,
    INITIAL_POWERUPS
} from '@/types/game';

// Re-export service functions
export {
    getNextQuestion,
    isSessionComplete,
    getCurrentQuestionNumber,
    initializeSRSQueue,
    updateSRSQueue,
    calculateMasteryPercentage,
    calculateScore,
    calculateMaxPossibleScore,
    canUsePowerUp,
    initializePowerups,
    usePowerUp,
    deactivatePowerUp,
    applyFiftyFifty,
    getProgressIndicator,
    createInitialState,
    processAnswer,
    generateGameResult
} from '@/services/gameEngineService';
