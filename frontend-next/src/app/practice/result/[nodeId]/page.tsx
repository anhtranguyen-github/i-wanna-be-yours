"use client";

/**
 * Unified Practice Result Page
 * Shows results for any PracticeNode type (QUIZ, SINGLE_EXAM, FULL_EXAM)
 */

import React, { useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    Trophy, CheckCircle2, XCircle, AlertTriangle,
    RotateCcw, Home, ChevronRight, Target, BookOpen,
    Clock, Flame, Star, ArrowLeft
} from "lucide-react";
import { mockExamConfigs, getQuestionsForExam } from "@/data/mockPractice";

export default function UnifiedResultPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const nodeId = params?.nodeId as string;

    // Load practice node and questions
    const node = useMemo(() => mockExamConfigs.find((e) => e.id === nodeId), [nodeId]);
    const questions = useMemo(() => (nodeId ? getQuestionsForExam(nodeId) : []), [nodeId]);

    // In a real app, results would come from state/API
    // For demo, generate mock results
    const results = useMemo(() => {
        if (!questions.length) return null;

        // Simulate results - in production this would come from submitted answers
        const totalQuestions = questions.length;
        const correctAnswers = Math.floor(totalQuestions * 0.75); // 75% correct for demo
        const incorrectAnswers = totalQuestions - correctAnswers;
        const accuracy = Math.round((correctAnswers / totalQuestions) * 100);

        return {
            totalQuestions,
            correctAnswers,
            incorrectAnswers,
            accuracy,
            timeSpent: node?.stats.timeLimitMinutes ? Math.floor(node.stats.timeLimitMinutes * 0.7 * 60) : 0,
            maxStreak: Math.min(correctAnswers, 5),
            weakAreas: questions.slice(0, 3).map(q => ({
                id: q.id,
                content: q.content
            }))
        };
    }, [questions, node]);

    // Error state
    if (!node || !results) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mb-6">
                    <AlertTriangle size={32} />
                </div>
                <h2 className="text-2xl font-black text-foreground font-display mb-2">Results Not Found</h2>
                <p className="text-muted-foreground font-bold mb-6">The requested practice results could not be loaded.</p>
                <Link
                    href="/practice"
                    className="px-6 py-3 bg-foreground text-background font-black font-display text-sm rounded-xl"
                >
                    Back to Practice
                </Link>
            </div>
        );
    }

    const isPassed = results.accuracy >= 60;
    const isExcellent = results.accuracy >= 80;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const getModeLabel = () => {
        switch (node.mode) {
            case 'QUIZ': return 'Quiz';
            case 'SINGLE_EXAM': return 'Exam';
            case 'FULL_EXAM': return 'Full Exam';
            default: return 'Practice';
        }
    };

    return (
        <div className="min-h-screen bg-background py-12 px-6">
            <div className="max-w-2xl mx-auto">
                {/* Back Button */}
                <Link
                    href="/practice"
                    className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground mb-8"
                >
                    <ArrowLeft size={16} />
                    Back to Practice
                </Link>

                {/* Result Card */}
                <div className="bg-card rounded-[3rem] border border-border/50 p-10 text-center relative overflow-hidden">
                    {/* Background Glow */}
                    <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 ${isExcellent ? 'bg-primary/10' : isPassed ? 'bg-secondary/10' : 'bg-destructive/5'}`} />

                    {/* Trophy Icon */}
                    <div className={`w-24 h-24 mx-auto rounded-3xl flex items-center justify-center mb-8 ${isExcellent ? 'bg-primary/10 text-primary' :
                        isPassed ? 'bg-secondary/10 text-secondary' :
                            'bg-muted text-muted-foreground'
                        }`}>
                        <Trophy size={48} />
                    </div>

                    {/* Title */}
                    <h1 className="text-4xl font-black text-foreground font-display tracking-tight mb-2">
                        {isExcellent ? 'Excellent!' : isPassed ? 'Good Job!' : 'Keep Practicing!'}
                    </h1>
                    <p className="text-muted-foreground font-bold mb-2">{node.title}</p>
                    <div className="flex justify-center gap-2 mb-8">
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-black uppercase tracking-widest">
                            {node.tags.level}
                        </span>
                        <span className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs font-black uppercase tracking-widest">
                            {getModeLabel()}
                        </span>
                    </div>

                    {/* Score Circle */}
                    <div className="relative mb-8">
                        <div className={`text-7xl font-black font-display tracking-tighter ${isExcellent ? 'text-primary' : isPassed ? 'text-foreground' : 'text-destructive'
                            }`}>
                            {results.accuracy}%
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-2">
                            Accuracy
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="bg-muted/30 rounded-2xl p-4">
                            <div className="flex items-center justify-center gap-2 text-2xl font-black text-primary font-display">
                                <CheckCircle2 size={20} />
                                {results.correctAnswers}
                            </div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-1">Correct</div>
                        </div>
                        <div className="bg-muted/30 rounded-2xl p-4">
                            <div className="flex items-center justify-center gap-2 text-2xl font-black text-destructive font-display">
                                <XCircle size={20} />
                                {results.incorrectAnswers}
                            </div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-1">Incorrect</div>
                        </div>
                        <div className="bg-muted/30 rounded-2xl p-4">
                            <div className="flex items-center justify-center gap-2 text-2xl font-black text-foreground font-display">
                                <Target size={20} />
                                {results.totalQuestions}
                            </div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-1">Total</div>
                        </div>
                    </div>

                    {/* Additional Stats */}
                    <div className="flex justify-center gap-6 mb-8">
                        {results.timeSpent > 0 && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock size={16} />
                                <span className="font-bold">{formatTime(results.timeSpent)}</span>
                            </div>
                        )}
                        {results.maxStreak > 0 && (
                            <div className="flex items-center gap-2 text-sm text-accent">
                                <Flame size={16} />
                                <span className="font-bold">{results.maxStreak} streak</span>
                            </div>
                        )}
                    </div>

                    {/* Weak Areas */}
                    {results.weakAreas.length > 0 && results.accuracy < 100 && (
                        <div className="text-left mb-8 bg-muted/20 rounded-2xl p-6 border border-border/30">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                                <BookOpen size={14} />
                                Areas to Review
                            </h3>
                            <div className="space-y-2">
                                {results.weakAreas.map((item, i) => (
                                    <div key={i} className="flex items-start gap-3 text-sm">
                                        <span className="w-5 h-5 bg-destructive/10 text-destructive rounded flex items-center justify-center font-black text-xs shrink-0">
                                            {i + 1}
                                        </span>
                                        <span className="text-foreground/80 font-jp line-clamp-1">{item.content}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-4">
                        <Link
                            href="/practice"
                            className="flex-1 py-4 bg-muted text-foreground font-black font-display text-sm uppercase tracking-widest rounded-2xl hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"
                        >
                            <Home size={18} />
                            Practice Hub
                        </Link>
                        <Link
                            href={`/practice/session/${nodeId}`}
                            className="flex-1 py-4 bg-foreground text-background font-black font-display text-sm uppercase tracking-widest rounded-2xl hover:opacity-90 transition-colors flex items-center justify-center gap-2"
                        >
                            <RotateCcw size={18} />
                            Try Again
                        </Link>
                    </div>
                </div>

                {/* Suggested Next */}
                <div className="mt-8 bg-card rounded-2xl border border-border p-6">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">
                        Continue Learning
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {mockExamConfigs
                            .filter(n => n.id !== nodeId && n.tags.level === node.tags.level)
                            .slice(0, 2)
                            .map(n => (
                                <Link
                                    key={n.id}
                                    href={`/practice/session/${n.id}`}
                                    className="p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors group"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-black uppercase tracking-widest">
                                            {n.tags.level}
                                        </span>
                                        <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                    <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">
                                        {n.title}
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {n.stats.questionCount} questions
                                    </p>
                                </Link>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
