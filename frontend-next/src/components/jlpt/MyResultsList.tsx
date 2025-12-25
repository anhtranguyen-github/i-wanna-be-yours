"use client";

import React from 'react';
import {
    Trophy, Clock, Target, RotateCcw, Eye,
    CheckCircle2, XCircle, Loader2, History
} from 'lucide-react';
import { ExamAttempt } from '@/types/practice';

interface MyResultsListProps {
    attempts: ExamAttempt[];
    onRetake: (examId: string) => void;
    onReview: (attemptId: string) => void;
    isLoading?: boolean;
}

export function MyResultsList({
    attempts,
    onRetake,
    onReview,
    isLoading = false
}: MyResultsListProps) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-ink" />
            </div>
        );
    }

    if (attempts.length === 0) {
        return (
            <div className="text-center py-20 px-8 bg-muted/20 rounded-2xl border-2 border-dashed border-border">
                <div className="w-20 h-20 mx-auto mb-6 bg-card rounded-2xl flex items-center justify-center  text-neutral-ink">
                    <History size={40} />
                </div>
                <h3 className="text-xl font-black text-foreground mb-3 font-display tracking-tight">No Results Yet</h3>
                <p className="text-sm font-bold text-muted-foreground max-w-xs mx-auto leading-relaxed">
                    Once you complete a challenge, your achievements will bloom here.
                </p>
            </div>
        );
    }


    const formatDate = (date: Date | string) => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        });
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const getScoreColor = (percentage: number) => {
        if (percentage >= 80) return 'text-primary';
        if (percentage >= 60) return 'text-secondary';
        return 'text-destructive';
    };

    const getScoreBg = (percentage: number) => {
        if (percentage >= 80) return 'bg-primary/10 border-primary/20';
        if (percentage >= 60) return 'bg-secondary/10 border-secondary/20';
        return 'bg-destructive/10 border-destructive/20';
    };

    const getProgressColor = (percentage: number) => {
        if (percentage >= 80) return 'bg-primary';
        if (percentage >= 60) return 'bg-secondary';
        return 'bg-destructive';
    };


    return (
        <div className="grid grid-cols-1 gap-6">
            {attempts.map((attempt) => (
                <div
                    key={attempt.id}
                    className="group p-6 bg-card rounded-2xl border border-border/50 hover:border-primary/30 transition-all duration-500  hover: "
                >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                                <h4 className="text-lg font-black text-foreground font-display tracking-tight group-hover:text-primary transition-colors">{attempt.nodeTitle || (attempt as any).examTitle}</h4>
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black font-display uppercase tracking-widest border  ${attempt.passed
                                    ? 'bg-primary/5 text-primary border-primary/20'
                                    : 'bg-destructive/5 text-destructive border-destructive/20'
                                    }`}>
                                    {attempt.passed ? 'PASSED' : 'FAILED'}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.15em] text-neutral-ink font-display">
                                <span className="px-2.5 py-1 bg-muted rounded  text-foreground/70">
                                    {attempt.tags?.level || (attempt as any).level}
                                </span>
                                <span className="flex items-center gap-1.5 grayscale opacity-60">
                                    <Clock size={12} />
                                    {formatDate(attempt.completedAt)}
                                </span>
                            </div>
                        </div>

                        {/* Score Badge */}
                        <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center border  ${getScoreBg(attempt.scorePercentage)} transition-transform duration-500 group-`}>
                            <span className={`text-xl font-black font-display tracking-tighter ${getScoreColor(attempt.scorePercentage)}`}>
                                {Math.round(attempt.scorePercentage)}%
                            </span>
                        </div>
                    </div>

                    {/* Progress & Stats */}
                    <div className="space-y-4 mb-6">
                        <div className="h-2.5 bg-muted rounded-full overflow-hidden  border border-border/20">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ease-spring ${getProgressColor(attempt.scorePercentage)}`}
                                style={{ width: `${attempt.scorePercentage}%` }}
                            />
                        </div>

                        <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-neutral-ink font-display">
                            <span className="flex items-center gap-2">
                                <CheckCircle2 size={14} className="text-primary" />
                                <span className="text-foreground/80">{attempt.correctAnswers}/{attempt.totalQuestions}</span> Correct
                            </span>
                            <span className="flex items-center gap-2">
                                <Clock size={14} />
                                <span className="text-foreground/80">{formatTime(attempt.timeTakenSeconds)}</span> Taken
                            </span>
                            {attempt.unansweredQuestions > 0 && (
                                <span className="flex items-center gap-2 text-secondary">
                                    <XCircle size={14} />
                                    <span className="text-secondary">{attempt.unansweredQuestions}</span> Skipped
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4 border-t border-border/50">
                        <button
                            onClick={() => onReview(attempt.id)}
                            className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-muted/30 border border-border/50 rounded-xl text-[10px] font-black uppercase tracking-widest font-display text-muted-foreground hover:text-foreground hover:bg-card hover: transition-all"
                        >
                            <Eye size={16} />
                            Review Result
                        </button>
                        <button
                            onClick={() => onRetake(attempt.nodeId || (attempt as any).examId)}
                            className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-foreground text-background rounded-xl text-[10px] font-black uppercase tracking-widest font-display hover:opacity-90 active:scale-95 transition-all "
                        >
                            <RotateCcw size={16} />
                            Retry Challenge
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
