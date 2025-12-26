"use client";

import React from "react";
import { Trophy, Sparkles, RotateCcw, ArrowRight, CheckCircle } from "lucide-react";

// ==================== Progress Bar Component ====================

interface ProgressBarProps {
    current: number;
    total: number;
    reviewed: number;  // Number of cards reviewed in this session
    className?: string;
}

export function ProgressBar({ current, total, reviewed, className = "" }: ProgressBarProps) {
    const progress = total > 0 ? (reviewed / total) * 100 : 0;

    return (
        <div className={`space-y-2 ${className}`}>
            {/* Progress bar */}
            <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-green to-emerald-400 transition-all duration-500 ease-out rounded-full"
                    style={{ width: `${progress}%` }}
                />
                {/* Current position indicator */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-brand-green rounded-full  transition-all duration-300"
                    style={{ left: `calc(${(current / total) * 100}% - 6px)` }}
                />
            </div>

            {/* Stats row */}
            <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-ink dark:text-neutral-ink">
                    Card <span className="font-bold text-neutral-ink dark:text-neutral-ink">{current + 1}</span> of {total}
                </span>
                <span className="text-neutral-ink dark:text-neutral-ink">
                    <span className="font-bold text-brand-green">{reviewed}</span> reviewed
                </span>
            </div>
        </div>
    );
}

// ==================== Session Stats Component ====================

interface SessionStatsProps {
    reviewed: number;
    easy: number;
    medium: number;
    hard: number;
}

export function SessionStats({ reviewed, easy, medium, hard }: SessionStatsProps) {
    return (
        <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-neutral-ink dark:text-neutral-ink">{easy}</span>
            </div>
            <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="text-neutral-ink dark:text-neutral-ink">{medium}</span>
            </div>
            <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-neutral-ink dark:text-neutral-ink">{hard}</span>
            </div>
        </div>
    );
}

// ==================== Completion Screen Component ====================

interface CompletionScreenProps {
    totalCards: number;
    sessionStats: SessionStatsProps;
    onRestart: () => void;
    onClose: () => void;
    deckTitle?: string;
}

export function CompletionScreen({
    totalCards,
    sessionStats,
    onRestart,
    onClose,
    deckTitle = "this deck"
}: CompletionScreenProps) {
    const { easy, medium, hard } = sessionStats;
    const total = easy + medium + hard;

    // Calculate mastery percentage (easy = 100%, medium = 50%, hard = 0%)
    const masteryScore = total > 0
        ? Math.round(((easy * 100) + (medium * 50)) / total)
        : 0;

    // Performance message based on mastery
    let message = "";
    let emoji = "";
    if (masteryScore >= 80) {
        message = "Outstanding! You've mastered this deck!";
        emoji = "🎉";
    } else if (masteryScore >= 60) {
        message = "Great job! You're making solid progress.";
        emoji = "💪";
    } else if (masteryScore >= 40) {
        message = "Good effort! Keep practicing.";
        emoji = "📚";
    } else {
        message = "Don't give up! Practice makes perfect.";
        emoji = "🌱";
    }

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-6">
            {/* Trophy animation */}
            <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center  animate-pulse">
                    <Trophy className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2">
                    <Sparkles className="w-8 h-8 text-yellow-400 animate-bounce" />
                </div>
            </div>

            {/* Completion message */}
            <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-black text-neutral-ink dark:text-white">
                    {emoji} Deck Complete!
                </h2>
                <p className="text-neutral-ink dark:text-neutral-ink text-sm sm:text-base">
                    You&apos;ve reviewed all <span className="font-bold text-brand-green">{totalCards}</span> cards in {deckTitle}
                </p>
            </div>

            {/* Mastery meter */}
            <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between text-xs font-bold">
                    <span className="text-neutral-ink">Mastery</span>
                    <span className={`${masteryScore >= 60 ? 'text-brand-green' : 'text-neutral-ink'}`}>
                        {masteryScore}%
                    </span>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-1000 ease-out rounded-full ${masteryScore >= 80 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                            masteryScore >= 60 ? 'bg-gradient-to-r from-yellow-400 to-green-500' :
                                masteryScore >= 40 ? 'bg-gradient-to-r from-orange-400 to-yellow-500' :
                                    'bg-gradient-to-r from-red-400 to-orange-500'
                            }`}
                        style={{ width: `${masteryScore}%` }}
                    />
                </div>
                <p className="text-sm text-neutral-ink dark:text-neutral-ink">{message}</p>
            </div>

            {/* Session breakdown */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-4 w-full max-w-xs">
                <h3 className="text-xs font-bold text-neutral-ink uppercase tracking-wider mb-3">
                    Session Summary
                </h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-black text-green-500">{easy}</div>
                        <div className="text-xs text-neutral-ink">Easy</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-black text-yellow-500">{medium}</div>
                        <div className="text-xs text-neutral-ink">Medium</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-black text-red-500">{hard}</div>
                        <div className="text-xs text-neutral-ink">Hard</div>
                    </div>
                </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                <button
                    onClick={onRestart}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-brand-green hover:bg-green-500 text-white font-bold rounded-xl  transition-colors"
                >
                    <RotateCcw size={18} />
                    Study Again
                </button>
                <button
                    onClick={onClose}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-neutral-ink dark:text-neutral-ink font-bold rounded-xl transition-colors"
                >
                    Done
                    <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );
}

// ==================== Progress Context Hook ====================
// This can be used to track deck-wide progress across sessions

export interface DeckProgress {
    totalCards: number;
    reviewedThisSession: number;
    sessionStats: SessionStatsProps;
    isComplete: boolean;
}

export function useFlashcardProgress(totalCards: number) {
    const [progress, setProgress] = React.useState<DeckProgress>({
        totalCards,
        reviewedThisSession: 0,
        sessionStats: { reviewed: 0, easy: 0, medium: 0, hard: 0 },
        isComplete: false,
    });

    const recordAnswer = React.useCallback((difficulty: 'easy' | 'medium' | 'hard') => {
        setProgress(prev => {
            const newReviewed = prev.reviewedThisSession + 1;
            const newStats = {
                ...prev.sessionStats,
                reviewed: newReviewed,
                [difficulty]: prev.sessionStats[difficulty] + 1,
            };

            return {
                ...prev,
                reviewedThisSession: newReviewed,
                sessionStats: newStats,
                isComplete: newReviewed >= prev.totalCards,
            };
        });
    }, []);

    const resetProgress = React.useCallback(() => {
        setProgress({
            totalCards,
            reviewedThisSession: 0,
            sessionStats: { reviewed: 0, easy: 0, medium: 0, hard: 0 },
            isComplete: false,
        });
    }, [totalCards]);

    // Update total when it changes (e.g., data loads)
    React.useEffect(() => {
        if (totalCards !== progress.totalCards) {
            setProgress(prev => ({ ...prev, totalCards }));
        }
    }, [totalCards, progress.totalCards]);

    return { progress, recordAnswer, resetProgress };
}
