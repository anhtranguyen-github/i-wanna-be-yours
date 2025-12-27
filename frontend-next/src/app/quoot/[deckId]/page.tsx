"use client";

/**
 * Quoot Game Session Page
 * Flashcard-style competitive game with lives, scoring, and streaks
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    Heart, Zap, Clock, Shield, Target, Flame,
    RotateCcw, ArrowLeft, CheckCircle2, XCircle, Trophy,
    ShieldAlert, ChevronRight, Home, Play, Loader2, AlertTriangle,
    Star, Volume2, VolumeX
} from "lucide-react";
import { ResultShell } from "@/components/results/ResultShell";
import { quootService } from "@/services/quootService";
import { startSession, saveRecord } from "@/services/recordService";
import { mapResultIcons } from "@/utils/resultProcessor";
import {
    generateOptions,
    shuffleArray
} from "@/utils/gameUtils";
import { fetchQuootArenaById } from "@/services/quootService";
import {
    QuootDeck,
    QuootCard,
    QuootMode,
    QuootConfig,
    DEFAULT_QUOOT_CONFIG,
    QUOOT_MODE_CONFIG,
    QUOOT_SCORING
} from "@/types/quoot";

// =============================================================================
// TYPES
// =============================================================================

interface GameState {
    status: 'CONFIG' | 'COUNTDOWN' | 'PLAYING' | 'FEEDBACK' | 'GAME_OVER' | 'RESULTS';
    currentIndex: number;
    score: number;
    streak: number;
    maxStreak: number;
    lives: number;
    correctCount: number;
    incorrectCount: number;
    answers: Array<{
        cardId: string;
        isCorrect: boolean;
        timeMs: number;
        scoreEarned: number;
    }>;
    startedAt: number;
    questionStartedAt: number;
}

// =============================================================================
// GAME SESSION COMPONENT
// =============================================================================

export default function QuootSessionPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const deckId = params?.deckId as string;
    const modeParam = searchParams.get('mode') as QuootMode | null;

    // Data
    const [deck, setDeck] = useState<QuootDeck | null>(null);
    const [cards, setCards] = useState<QuootCard[]>([]);
    const [loading, setLoading] = useState(true);

    // Config
    const [config, setConfig] = useState<QuootConfig>({
        ...DEFAULT_QUOOT_CONFIG,
        mode: modeParam || 'CLASSIC'
    });

    // Game state
    const [gameState, setGameState] = useState<GameState>({
        status: 'CONFIG',
        currentIndex: 0,
        score: 0,
        streak: 0,
        maxStreak: 0,
        lives: 3,
        correctCount: 0,
        incorrectCount: 0,
        answers: [],
        startedAt: 0,
        questionStartedAt: 0
    });

    // UI state
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [timeRemaining, setTimeRemaining] = useState(config.timePerCardSeconds);
    const [countdown, setCountdown] = useState(3);
    const [currentOptions, setCurrentOptions] = useState<string[]>([]);
    const [soundEnabled, setSoundEnabled] = useState(true);

    const currentSessionId = React.useRef<string | null>(null);
    const [unifiedResult, setUnifiedResult] = useState<any>(null);

    // Submission logic
    useEffect(() => {
        if (gameState.status === 'RESULTS' || gameState.status === 'GAME_OVER') {
            const submitFinish = async () => {
                if (!deck) return; // Guard for deck
                try {
                    // Start with a default result for guests or fallback
                    let resultData = null;

                    // Only try API if we have a user (though service might handle it, let's be safe)
                    // Actually, let's just try-catch the whole thing.
                    try {
                        const response = await quootService.submitQuootResult(deck.id, {
                            score: gameState.score,
                            correctCount: gameState.correctCount,
                            maxStreak: gameState.maxStreak,
                            totalCards: cards.length
                        });
                        console.log("Quoot submission response:", response);
                        resultData = response.result || response.data || response;
                    } catch (e) {
                        console.warn("Guest or API error submit", e);
                        // Fallback for guest/offline
                        resultData = {
                            score: gameState.score,
                            rank: 'C',
                            xpEarned: 0,
                            coinsEarned: 0,
                            streakExtended: false,
                            stats: [
                                { label: "Accuracy", value: `${Math.round((gameState.correctCount / cards.length) * 100)}%`, icon: "Target" },
                                { label: "Max Streak", value: gameState.maxStreak, icon: "Flame" }
                            ],
                            achievements: [],
                            feedback: {
                                title: "Ephemeral Training",
                                message: "Sign in to persist your arena achievements.",
                                suggestions: ["Create an account to track metrics over time"]
                            }
                        };
                    }


                    // Track COMPLETED event
                    if (currentSessionId.current) {
                        await saveRecord({
                            itemType: 'QUOOT',
                            itemId: deck.id,
                            itemTitle: deck.title,
                            status: 'COMPLETED',
                            score: gameState.score,
                            sessionId: currentSessionId.current,
                            duration: Math.round((Date.now() - gameState.startedAt) / 1000)
                        });
                        currentSessionId.current = null; // Clear to prevent abandonment tracking
                    }

                    if (resultData) {
                        setUnifiedResult(mapResultIcons(resultData));
                    }
                } catch (err) {
                    console.error("Failed to submit quoot result:", err);
                }
            };
            submitFinish();
        }
    }, [gameState.status, deck?.id, gameState.score, gameState.correctCount, gameState.maxStreak, cards.length, gameState.startedAt, deck?.title]);

    // Handle session abandonment on unmount
    useEffect(() => {
        return () => {
            if (currentSessionId.current && deck) {
                // Fire and forget abandonment record
                saveRecord({
                    itemType: 'QUOOT',
                    itemId: deck.id,
                    itemTitle: deck.title,
                    status: 'ABANDONED',
                    sessionId: currentSessionId.current
                });
            }
        };
    }, [deck]);

    // Current card
    const currentCard = useMemo(() => {
        return cards[gameState.currentIndex] || null;
    }, [cards, gameState.currentIndex]);

    // Load deck and cards
    useEffect(() => {
        if (!deckId) return;

        const loadData = async () => {
            setLoading(true);
            try {
                const deckData = await fetchQuootArenaById(deckId);

                if (deckData) {
                    const mappedDeck: QuootDeck = {
                        id: deckData.id,
                        title: deckData.title,
                        description: deckData.description || "",
                        cardCount: deckData.cards?.length || 0,
                        level: deckData.level as any,
                        category: 'VOCABULARY',
                        coverEmoji: deckData.icon || '⚔️',
                        coverColor: 'bg-primary/20',
                        isPublic: true
                    };

                    const mappedCards: QuootCard[] = deckData.cards.map((c: any) => ({
                        id: c._id || c.id,
                        front: c.front,
                        back: c.back,
                        furigana: c.reading || c.sub_detail,
                        wrongOptions: []
                    }));

                    setDeck(mappedDeck);
                    setCards(config.shuffleCards ? shuffleArray(mappedCards) : mappedCards);
                }
            } catch (err) {
                console.error("Failed to load quoot deck:", err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [deckId, config.shuffleCards]);

    // Apply mode config
    useEffect(() => {
        if (modeParam && QUOOT_MODE_CONFIG[modeParam]) {
            setConfig(prev => ({
                ...prev,
                ...QUOOT_MODE_CONFIG[modeParam],
                mode: modeParam
            }));
        }
    }, [modeParam]);

    // Generate options when card changes
    useEffect(() => {
        if (currentCard && cards.length > 0) {
            const options = generateOptions(currentCard, cards);
            setCurrentOptions(options);
        }
    }, [currentCard, cards]);

    // Countdown timer
    useEffect(() => {
        if (gameState.status !== 'COUNTDOWN') return;

        if (countdown <= 0) {
            setGameState(prev => ({
                ...prev,
                status: 'PLAYING',
                startedAt: Date.now(),
                questionStartedAt: Date.now()
            }));

            // Track STARTED event
            if (deck) {
                startSession('QUOOT', deck.id, deck.title).then(sid => {
                    currentSessionId.current = sid;
                });
            }

            setTimeRemaining(config.timePerCardSeconds);
            return;
        }

        const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown, gameState.status, config.timePerCardSeconds]);

    // Question timer
    useEffect(() => {
        if (gameState.status !== 'PLAYING') return;

        if (timeRemaining <= 0) {
            handleAnswer(null); // Time up = wrong
            return;
        }

        const timer = setInterval(() => {
            setTimeRemaining(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeRemaining, gameState.status]);

    // Handle answer
    const handleAnswer = useCallback((option: string | null) => {
        if (!currentCard || gameState.status !== 'PLAYING') return;

        const isCorrect = option === currentCard.back;
        const timeMs = Date.now() - gameState.questionStartedAt;

        // Calculate score
        let scoreEarned = 0;
        if (isCorrect) {
            scoreEarned = QUOOT_SCORING.BASE_CORRECT;
            // Time bonus
            const timeBonus = Math.round(
                QUOOT_SCORING.TIME_BONUS_MAX * (1 - timeMs / (config.timePerCardSeconds * 1000))
            );
            scoreEarned += Math.max(0, timeBonus);
            // Streak bonus
            if ((gameState.streak + 1) % QUOOT_SCORING.STREAK_BONUS_THRESHOLD === 0) {
                scoreEarned += QUOOT_SCORING.STREAK_BONUS_POINTS;
            }
        }

        setSelectedOption(option);

        setGameState(prev => {
            const newStreak = isCorrect ? prev.streak + 1 : 0;
            const newLives = isCorrect ? prev.lives : prev.lives - 1;

            return {
                ...prev,
                status: 'FEEDBACK',
                score: prev.score + scoreEarned,
                streak: newStreak,
                maxStreak: Math.max(prev.maxStreak, newStreak),
                lives: newLives,
                correctCount: prev.correctCount + (isCorrect ? 1 : 0),
                incorrectCount: prev.incorrectCount + (isCorrect ? 0 : 1),
                answers: [...prev.answers, {
                    cardId: currentCard.id,
                    isCorrect,
                    timeMs,
                    scoreEarned
                }]
            };
        });

        // Show feedback then move to next
        setTimeout(() => {
            if (!isCorrect && gameState.lives <= 1 && config.mode === 'CLASSIC') {
                // Game over
                setGameState(prev => ({ ...prev, status: 'GAME_OVER' }));
            } else if (gameState.currentIndex >= cards.length - 1) {
                // Completed all cards
                setGameState(prev => ({ ...prev, status: 'RESULTS' }));
            } else {
                // Next card
                setGameState(prev => ({
                    ...prev,
                    status: 'PLAYING',
                    currentIndex: prev.currentIndex + 1,
                    questionStartedAt: Date.now()
                }));
                setSelectedOption(null);
                setTimeRemaining(config.timePerCardSeconds);
            }
        }, 1500);
    }, [currentCard, gameState, config, cards.length]);

    // Start game
    const startGame = () => {
        setGameState({
            status: 'COUNTDOWN',
            currentIndex: 0,
            score: 0,
            streak: 0,
            maxStreak: 0,
            lives: config.lives || 3,
            correctCount: 0,
            incorrectCount: 0,
            answers: [],
            startedAt: 0,
            questionStartedAt: 0
        });
        setCountdown(3);
        setSelectedOption(null);
        setUnifiedResult(null);
        // Re-shuffle cards
        if (config.shuffleCards) {
            setCards(prev => shuffleArray(prev));
        }
    };

    // Play again
    const playAgain = () => {
        startGame();
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
                <Loader2 className="w-16 h-16 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-ink font-display">
                    Loading deck...
                </p>
            </div>
        );
    }

    // Error state
    if (!deck || cards.length === 0) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
                <div className="w-24 h-24 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mb-8">
                    <AlertTriangle size={48} />
                </div>
                <h2 className="text-3xl font-black text-foreground font-display mb-4">Deck Not Found</h2>
                <Link
                    href="/quoot"
                    className="px-10 py-4 bg-foreground text-background font-black font-display text-sm uppercase tracking-widest rounded-2xl"
                >
                    Back to Games
                </Link>
            </div>
        );
    }

    // Config screen
    if (gameState.status === 'CONFIG') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <div className="max-w-lg w-full bg-card rounded-[3rem] border border-border/50 p-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />

                    <button
                        onClick={() => router.push('/quoot')}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-ink hover:text-foreground mb-8"
                    >
                        <ArrowLeft size={16} />
                        Back
                    </button>

                    <div className="text-center mb-10">
                        <div className={`w-20 h-20 mx-auto ${deck.coverColor || 'bg-primary'} rounded-2xl flex items-center justify-center text-4xl mb-6`}>
                            {deck.coverEmoji || '📚'}
                        </div>
                        <h1 className="text-3xl font-black text-foreground font-display tracking-tight mb-2">
                            {deck.title}
                        </h1>
                        <p className="text-neutral-ink font-bold">{deck.cardCount} cards</p>
                    </div>

                    {/* Mode Badges */}
                    <div className="flex justify-center gap-3 mb-10">
                        <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${config.mode === 'CLASSIC' ? 'bg-rose-500/10 text-rose-500' :
                            config.mode === 'SPEED' ? 'bg-amber-500/10 text-amber-500' :
                                'bg-purple-500/10 text-purple-500'
                            }`}>
                            {config.mode === 'CLASSIC' && <><Heart size={12} className="inline mr-1" /> 3 Lives</>}
                            {config.mode === 'SPEED' && <><Zap size={12} className="inline mr-1" /> Speed Mode</>}
                            {config.mode === 'DAILY_CHALLENGE' && <><Trophy size={12} className="inline mr-1" /> Daily</>}
                        </span>
                        <span className="px-4 py-2 bg-muted rounded-full text-[10px] font-black uppercase tracking-widest text-neutral-ink">
                            <Clock size={12} className="inline mr-1" /> {config.timePerCardSeconds}s
                        </span>
                    </div>

                    {/* Start Button */}
                    <button
                        onClick={startGame}
                        className="w-full py-5 bg-foreground text-background font-black font-display text-sm uppercase tracking-widest rounded-2xl hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                        <Play size={20} className="fill-current" />
                        Start Game
                    </button>
                </div>
            </div>
        );
    }

    // Countdown screen
    if (gameState.status === 'COUNTDOWN') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center animate-in zoom-in-95 duration-300">
                    <div className="text-9xl font-black text-primary font-display mb-4">
                        {countdown || 'GO!'}
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-ink font-display">
                        Get Ready
                    </p>
                </div>
            </div>
        );
    }

    // ... (This content will be removed from here)

    // Results / Game Over screen
    if (gameState.status === 'RESULTS' || gameState.status === 'GAME_OVER') {
        if (!unifiedResult) {
            return (
                <div className="min-h-screen bg-neutral-beige/20 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-ink/60">Finalizing Score...</p>
                </div>
            );
        }

        return (
            <ResultShell
                result={unifiedResult}
                onRetry={playAgain}
                customActions={
                    <button
                        onClick={() => router.push('/quoot')}
                        className="h-16 px-10 bg-neutral-white border-2 border-neutral-gray/10 text-neutral-ink rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-3 hover:border-primary-strong/30 hover:bg-neutral-beige/10 transition-all active:scale-95 shadow-sm"
                    >
                        <Home size={20} className="text-primary-strong" />
                        Exit Arena
                    </button>
                }
            />
        );
    }

    // Playing / Feedback screen
    const isShowingFeedback = gameState.status === 'FEEDBACK';
    const timeProgress = (timeRemaining / config.timePerCardSeconds) * 100;
    const isTimeLow = timeRemaining <= 5;

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="bg-card border-b border-border px-6 py-4 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <button onClick={() => router.push('/quoot')} className="text-neutral-ink hover:text-foreground">
                        <ArrowLeft size={24} />
                    </button>

                    {/* Progress & Stats */}
                    <div className="flex items-center gap-6">
                        {/* Lives (Classic mode) */}
                        {config.mode === 'CLASSIC' && (
                            <div className="flex items-center gap-1">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <Heart
                                        key={i}
                                        size={20}
                                        className={i < gameState.lives ? 'text-rose-500 fill-rose-500' : 'text-neutral-ink'}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Streak */}
                        {gameState.streak > 0 && (
                            <div className="flex items-center gap-1 px-3 py-1 bg-accent/10 text-accent rounded-full">
                                <Flame size={16} />
                                <span className="font-black">{gameState.streak}</span>
                            </div>
                        )}
                    </div>

                    {/* Score */}
                    <div className="text-right">
                        <div className="text-2xl font-black text-foreground font-display">{gameState.score.toLocaleString()}</div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-neutral-ink">Points</div>
                    </div>
                </div>
            </header>

            {/* Timer Bar */}
            <div className="h-1 bg-muted">
                <div
                    className={`h-full transition-all duration-1000 ${isTimeLow ? 'bg-destructive animate-pulse' : 'bg-primary'}`}
                    style={{ width: `${timeProgress}%` }}
                />
            </div>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center p-6">
                {currentCard && (
                    <div className="max-w-2xl w-full">
                        {/* Progress */}
                        <div className="text-center mb-6">
                            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-ink font-display">
                                Card {gameState.currentIndex + 1} of {cards.length}
                            </span>
                        </div>

                        {/* Card Front (Question) */}
                        <div className="bg-card rounded-[2rem] border border-border p-10 mb-8 text-center ">
                            <p className="text-4xl md:text-5xl font-black text-foreground font-jp mb-4">
                                {currentCard.front}
                            </p>
                            {currentCard.furigana && (
                                <p className="text-xl text-neutral-ink font-jp">
                                    {currentCard.furigana}
                                </p>
                            )}
                        </div>

                        {/* Options */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {currentOptions.map((option, idx) => {
                                const isSelected = selectedOption === option;
                                const isCorrect = isShowingFeedback && option === currentCard.back;
                                const isWrong = isShowingFeedback && isSelected && option !== currentCard.back;

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => !isShowingFeedback && handleAnswer(option)}
                                        disabled={isShowingFeedback}
                                        className={`
                                            group relative p-6 rounded-2xl text-left transition-all duration-300 border-2
                                            ${isCorrect ? 'bg-primary/10 border-primary' : ''}
                                            ${isWrong ? 'bg-destructive/10 border-destructive shake' : ''}
                                            ${!isShowingFeedback && !isSelected ? 'bg-card border-border hover:border-primary/50 hover:scale-[1.02]' : ''}
                                            ${isSelected && !isShowingFeedback ? 'border-primary bg-primary/5' : ''}
                                        `}
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className={`
                                                w-10 h-10 rounded-xl flex items-center justify-center font-black font-display
                                                ${isCorrect ? 'bg-primary text-primary-foreground' : ''}
                                                ${isWrong ? 'bg-destructive text-destructive-foreground' : ''}
                                                ${!isCorrect && !isWrong ? 'bg-muted text-neutral-ink' : ''}
                                            `}>
                                                {isCorrect ? <CheckCircle2 size={20} /> : isWrong ? <XCircle size={20} /> : String.fromCharCode(65 + idx)}
                                            </span>
                                            <span className="text-lg font-bold text-foreground">
                                                {option}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>

            {/* CSS for shake animation */}
            <style jsx>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .shake {
                    animation: shake 0.3s ease-in-out;
                }
            `}</style>
        </div>
    );
}
