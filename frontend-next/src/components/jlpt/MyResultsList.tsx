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
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (attempts.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                    <History size={32} className="text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-600 mb-2">No Results Yet</h3>
                <p className="text-sm text-slate-400 max-w-xs mx-auto">
                    Complete an exam to see your results here. Your progress will be tracked automatically.
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
        if (percentage >= 80) return 'text-emerald-600';
        if (percentage >= 60) return 'text-amber-600';
        return 'text-red-500';
    };

    const getScoreBg = (percentage: number) => {
        if (percentage >= 80) return 'bg-emerald-100';
        if (percentage >= 60) return 'bg-amber-100';
        return 'bg-red-100';
    };

    const getProgressColor = (percentage: number) => {
        if (percentage >= 80) return 'bg-emerald-500';
        if (percentage >= 60) return 'bg-amber-500';
        return 'bg-red-500';
    };

    return (
        <div className="space-y-3">
            {attempts.map((attempt) => (
                <div
                    key={attempt.id}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-all"
                >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-brand-dark">{attempt.examTitle}</h4>
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${attempt.passed
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-red-100 text-red-600'
                                    }`}>
                                    {attempt.passed ? '✓ Passed' : '✗ Failed'}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                <span className="px-2 py-0.5 bg-slate-200 rounded font-medium">
                                    {attempt.level}
                                </span>
                                <span>{formatDate(attempt.completedAt)}</span>
                            </div>
                        </div>

                        {/* Score Badge */}
                        <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center ${getScoreBg(attempt.scorePercentage)}`}>
                            <span className={`text-lg font-black ${getScoreColor(attempt.scorePercentage)}`}>
                                {Math.round(attempt.scorePercentage)}%
                            </span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
                        <div
                            className={`h-full rounded-full transition-all ${getProgressColor(attempt.scorePercentage)}`}
                            style={{ width: `${attempt.scorePercentage}%` }}
                        />
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-slate-600 mb-3">
                        <span className="flex items-center gap-1">
                            <CheckCircle2 size={12} className="text-emerald-500" />
                            {attempt.correctAnswers}/{attempt.totalQuestions} correct
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatTime(attempt.timeTakenSeconds)}
                        </span>
                        {attempt.unansweredQuestions > 0 && (
                            <span className="flex items-center gap-1 text-amber-600">
                                <XCircle size={12} />
                                {attempt.unansweredQuestions} skipped
                            </span>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => onReview(attempt.id)}
                            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            <Eye size={14} />
                            Review
                        </button>
                        <button
                            onClick={() => onRetake(attempt.examId)}
                            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-brand-green text-white rounded-lg text-sm font-medium hover:bg-brand-green/90 transition-colors"
                        >
                            <RotateCcw size={14} />
                            Retake
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
