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
import { processQuootResult } from "@/utils/resultProcessor";
import {
    getQuootDeck,
    getQuootCards,
    generateOptions,
    shuffleArray,
    mockQuootDecks
} from "@/data/mockQuoot";
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

    // Current card
    const currentCard = useMemo(() => {
        return cards[gameState.currentIndex] || null;
    }, [cards, gameState.currentIndex]);

    // Load deck and cards
    useEffect(() => {
        if (!deckId) return;

        const loadData = async () => {
            const deckData = getQuootDeck(deckId);
            const cardsData = getQuootCards(deckId);

            if (deckData && cardsData.length > 0) {
                setDeck(deckData);
                // Shuffle cards if configured
                setCards(config.shuffleCards ? shuffleArray(cardsData) : cardsData);
            }
            setLoading(false);
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
        // Re-shuffle cards
        if (config.shuffleCards) {
            setCards(shuffleArray(getQuootCards(deckId)));
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
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground font-display">
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
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground mb-8"
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
                        <p className="text-muted-foreground font-bold">{deck.cardCount} cards</p>
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
                        <span className="px-4 py-2 bg-muted rounded-full text-[10px] font-black uppercase tracking-widest text-muted-foreground">
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
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground font-display">
                        Get Ready
                    </p>
                </div>
            </div>
        );
    }

    // Results / Game Over screen
    if (gameState.status === 'RESULTS' || gameState.status === 'GAME_OVER') {
        const unifiedResult = processQuootResult(deck, gameState, cards);

        return (
            <ResultShell
                result={unifiedResult}
                onRetry={playAgain}
                customActions={
                    <button
                        onClick={() => router.push('/quoot')}
                        className="px-10 py-5 bg-neutral-white border-2 border-neutral-gray/10 text-neutral-ink rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 hover:border-primary-strong/40 transition-all shadow-lg shadow-neutral-ink/5"
                    >
                        <Home size={20} />
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
                    <button onClick={() => router.push('/quoot')} className="text-muted-foreground hover:text-foreground">
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
                                        className={i < gameState.lives ? 'text-rose-500 fill-rose-500' : 'text-muted-foreground/30'}
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
                        <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Points</div>
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
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground font-display">
                                Card {gameState.currentIndex + 1} of {cards.length}
                            </span>
                        </div>

                        {/* Card Front (Question) */}
                        <div className="bg-card rounded-[2rem] border border-border p-10 mb-8 text-center shadow-lg">
                            <p className="text-4xl md:text-5xl font-black text-foreground font-jp mb-4">
                                {currentCard.front}
                            </p>
                            {currentCard.furigana && (
                                <p className="text-xl text-muted-foreground font-jp">
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
                                                ${!isCorrect && !isWrong ? 'bg-muted text-muted-foreground' : ''}
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
