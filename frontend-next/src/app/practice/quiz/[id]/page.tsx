"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    Clock,
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    AlertCircle,
    Loader2,
    Send,
    ArrowLeft,
    Brain,
    LayoutGrid,
    Target,
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import { getQuiz, submitQuiz, Quiz, QuizSubmissionResult } from "@/services/quizService";
import Link from "next/link";

export default function QuizPlayerPage() {
    const router = useRouter();
    const params = useParams();
    const quizId = params?.id as string;
    const { user } = useUser();

    // Quiz state
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Player state
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
    const [startedAt, setStartedAt] = useState<string>("");
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    // Submission state
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<QuizSubmissionResult | null>(null);

    // Load quiz
    useEffect(() => {
        if (!quizId) return;

        const loadQuiz = async () => {
            try {
                const data = await getQuiz(quizId);
                setQuiz(data);
                setStartedAt(new Date().toISOString());
                if (data.time_limit_seconds) {
                    setTimeLeft(data.time_limit_seconds);
                }
            } catch (err) {
                setError("Protocol synchronization failed. Retrieval unsuccessful.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadQuiz();
    }, [quizId]);

    // Timer logic
    const handleSubmit = useCallback(async () => {
        if (!quiz) return;
        setSubmitting(true);
        try {
            const res = await submitQuiz(
                quizId,
                answers,
                user?.id ? String(user.id) : undefined,
                startedAt
            );
            setResult(res);
        } catch (err) {
            console.error("Submission failed:", err);
            setError("Logic commit failed. Retransmission required.");
        } finally {
            setSubmitting(false);
        }
    }, [quiz, quizId, answers, user, startedAt]);

    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0 || result) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev === null || prev <= 1) {
                    clearInterval(timer);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, result, handleSubmit]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const currentQuestion = quiz?.questions[currentIndex];
    const totalQuestions = quiz?.questions.length || 0;
    const answeredCount = Object.keys(answers).length;

    const handleAnswer = (answer: string | string[]) => {
        if (!currentQuestion) return;
        setAnswers((prev) => ({
            ...prev,
            [currentQuestion.question_id]: answer,
        }));
    };

    const handleNext = () => {
        if (currentIndex < totalQuestions - 1) {
            setCurrentIndex((prev) => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
                <div className="relative">
                    <Loader2 className="w-16 h-16 animate-spin text-primary opacity-20" />
                    <Brain className="absolute inset-0 m-auto w-6 h-6 text-primary animate-pulse" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-ink font-display">Allocating Logic Blocks...</p>
            </div>
        );
    }

    if (error || !quiz) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-700">
                <div className="w-24 h-24 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mb-8  border border-destructive/20 rotate-12">
                    <AlertCircle size={48} />
                </div>
                <h2 className="text-3xl font-black text-foreground font-display tracking-tight mb-4">{error || "Manifest Not Found"}</h2>
                <Link
                    href="/practice/quiz"
                    className="px-10 py-4 bg-foreground text-background font-black font-display text-[11px] uppercase tracking-widest rounded-2xl  active:scale-95 transition-all"
                >
                    Return to Cluster
                </Link>
            </div>
        );
    }

    // Result view
    if (result) {
        return (
            <div className="min-h-screen bg-background py-16 px-8 selection:bg-primary/20 animate-in fade-in duration-1000">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-card rounded-[3.5rem] border border-border/50 p-12 text-center  relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors" />

                        <div className={`w-24 h-24 mx-auto rounded-[2.5rem] flex items-center justify-center mb-10  border border-border/50 transition-transform duration-700 rotate-6 group-hover:rotate-0 ${result.percentage >= 80 ? "bg-primary/10 text-primary border-primary/20" :
                            result.percentage >= 50 ? "bg-secondary/10 text-secondary border-secondary/20" :
                                "bg-destructive/10 text-destructive border-destructive/20"
                            }`}>
                            <CheckCircle size={48} />
                        </div>

                        <h1 className="text-4xl font-black text-foreground font-display tracking-tighter mb-4 italic leading-none">
                            {result.percentage >= 80 ? "Synthesis Success" : result.percentage >= 50 ? "Partial Convergence" : "System Anomaly"}
                        </h1>

                        <p className="text-muted-foreground font-bold tracking-tight mb-12 italic opacity-60">{quiz.title}</p>

                        <div className="relative mb-8">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-ink font-display block mb-2">Sync Accuracy</span>
                            <div className="text-7xl font-black text-foreground font-display tracking-tighter inline-flex items-baseline">
                                {result.percentage}<span className="text-2xl text-neutral-ink ml-2">%</span>
                            </div>
                        </div>

                        <p className="text-[11px] font-black font-display uppercase tracking-[0.3em] text-neutral-ink mb-12 italic">
                            {result.total_score} of {result.max_score} Logic Nodes Validated
                        </p>

                        <div className="grid grid-cols-2 gap-6 mb-12">
                            <div className="bg-muted/30 rounded-3xl p-6 border border-border/20 ">
                                <div className="text-3xl font-black text-primary font-display mb-1">{result.answers.filter(a => a.is_correct).length}</div>
                                <div className="text-[9px] font-black text-neutral-ink uppercase tracking-widest font-display">Valid Gates</div>
                            </div>
                            <div className="bg-muted/30 rounded-3xl p-6 border border-border/20 ">
                                <div className="text-3xl font-black text-destructive font-display mb-1">{result.answers.filter(a => !a.is_correct).length}</div>
                                <div className="text-[9px] font-black text-neutral-ink uppercase tracking-widest font-display">Shield Failures</div>
                            </div>
                        </div>

                        {result.weak_items.length > 0 && (
                            <div className="text-left mb-12 bg-muted/20 p-8 rounded-[2rem] border border-border/30">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground font-display mb-6">Structural Vulnerabilities</h3>
                                <div className="space-y-3">
                                    {result.weak_items.slice(0, 3).map((item, i) => (
                                        <div key={i} className="flex items-center gap-4 group/v">
                                            <div className="w-1.5 h-1.5 rounded-full bg-destructive/40 group-hover/v:scale-150 transition-transform" />
                                            <div className="text-sm font-bold text-foreground/80 italic group-hover:text-foreground transition-colors">
                                                {item.learning_point}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-6 justify-center">
                            <Link
                                href="/practice/quiz"
                                className="px-10 py-5 bg-card border border-border/50 text-foreground font-black font-display text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:text-primary hover:border-primary/30 transition-all  active:scale-95"
                            >
                                Cluster Home
                            </Link>
                            <button
                                onClick={() => {
                                    setResult(null);
                                    setAnswers({});
                                    setCurrentIndex(0);
                                    setStartedAt(new Date().toISOString());
                                    if (quiz.time_limit_seconds) {
                                        setTimeLeft(quiz.time_limit_seconds);
                                    }
                                }}
                                className="px-10 py-5 bg-primary text-primary-foreground font-black font-display text-[10px] uppercase tracking-[0.2em] rounded-2xl  hover:opacity-95 transition-all active:scale-95"
                            >
                                Initiate Recalibration
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Quiz player
    return (
        <div className="min-h-screen bg-background pb-20 selection:bg-primary/20">
            {/* Header */}
            <header className="bg-card  border-b border-border/50 sticky top-0 z-50 px-8 py-5 ">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Link
                        href="/practice/quiz"
                        className="group flex items-center gap-3 px-5 py-2.5 bg-muted/50 hover:bg-card border border-border/30 rounded-2xl transition-all  active:scale-95"
                    >
                        <ArrowLeft size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground font-display">Abort Sync</span>
                    </Link>

                    <div className="text-center">
                        <h2 className="text-sm font-black text-foreground font-display tracking-tight leading-none mb-1 max-w-[200px] truncate">{quiz.title}</h2>
                        <p className="text-[9px] font-black text-neutral-ink uppercase tracking-widest font-display">
                            Node {currentIndex + 1} of {totalQuestions}
                        </p>
                    </div>

                    {timeLeft !== null && (
                        <div className={`
                            flex items-center gap-3 px-5 py-2.5 rounded-2xl font-display font-black text-[10px] uppercase tracking-widest  border transition-all duration-500
                            ${timeLeft < 60 ? "bg-destructive/10 text-destructive border-destructive/20 animate-pulse" : "bg-muted/50 text-muted-foreground border-border/30"}
                        `}>
                            <Clock size={16} className={timeLeft < 60 ? "animate-spin-slow" : ""} />
                            {formatTime(timeLeft)}
                        </div>
                    )}
                </div>

                {/* Tactical Progress Indicator */}
                <div className="max-w-4xl mx-auto mt-5 px-1">
                    <div className="h-2 bg-muted rounded-full overflow-hidden  border border-border/10">
                        <div
                            className="h-full bg-primary shadow-[0_0_15px_rgba(var(--primary),0.3)] transition-all duration-700 ease-spring"
                            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
                        />
                    </div>
                </div>
            </header>

            {/* Question Workspace */}
            <main className="max-w-4xl mx-auto px-8 py-12">
                {currentQuestion && (
                    <div className="bg-card rounded-2xl border border-border p-10 md:p-14 relative overflow-hidden group/card animate-in slide-in-from-bottom-8 duration-700 space-y-10">
                        {/* Background Deco */}
                        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/2 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover/card:bg-primary/5 transition-colors duration-1000" />

                        {/* Question Header - Unified with JLPT */}
                        <div className="flex items-center justify-between border-b border-border/50 pb-8 relative z-10">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] font-display">Step</p>
                                <p className="text-xl font-black text-foreground font-display">Node {currentIndex + 1}</p>
                            </div>
                            <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-muted/50 text-muted-foreground border border-border/30 text-[10px] font-black uppercase tracking-widest font-display">
                                <Target size={16} className="text-primary" />
                                Interactive Node
                            </div>
                        </div>

                        {/* Passage Segment */}
                        {currentQuestion.content.passage && (
                            <div className="bg-muted/20 rounded-2xl p-10 text-xl font-jp leading-[2] tracking-tight border border-border/50 relative group/passage italic text-foreground/80">
                                <div className="absolute top-4 right-4 text-neutral-ink group-hover/passage:text-primary/20 transition-colors">
                                    <LayoutGrid size={24} />
                                </div>
                                {currentQuestion.content.passage}
                            </div>
                        )}

                        {/* Question Prompt */}
                        <div className="relative">
                            <h3 className="text-2xl font-black text-foreground font-jp leading-relaxed group-hover/card:text-primary transition-colors">
                                {currentQuestion.content.prompt}
                            </h3>
                        </div>

                        {/* Logic Options - Updated to 2-column Grid */}
                        {currentQuestion.content.options && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
                                {currentQuestion.content.options.map((option, idx) => {
                                    const isSelected = answers[currentQuestion.question_id] === option;
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleAnswer(option)}
                                            className={`
                                                group/opt w-full p-6 rounded-2xl text-left transition-all duration-500 border flex items-center gap-6
                                                ${isSelected
                                                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                                                    : "border-border/50 bg-card hover:border-primary/30 hover:bg-muted/20 active:scale-[0.98]"
                                                }
                                            `}
                                        >
                                            <span className={`
                                                w-10 h-10 rounded-2xl flex items-center justify-center font-display font-black text-sm transition-all duration-500
                                                ${isSelected
                                                    ? "bg-primary text-primary-foreground rotate-12"
                                                    : "bg-muted text-neutral-ink group-hover/opt:bg-primary/10 group-hover/opt:text-primary"
                                                }
                                            `}>
                                                {String.fromCharCode(65 + idx)}
                                            </span>
                                            <span className="text-lg font-bold font-jp leading-snug text-foreground/80 group-hover/opt:text-foreground transition-colors">
                                                {option}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Navigation Matrix */}
                <div className="flex items-center justify-between mt-12 pt-12 border-t border-border/20">
                    <button
                        onClick={handlePrev}
                        disabled={currentIndex === 0}
                        className={`
                            flex items-center gap-4 px-10 py-5 rounded-2xl font-black font-display text-[10px] uppercase tracking-[0.2em] transition-all  active:scale-90
                            ${currentIndex === 0
                                ? "bg-muted text-neutral-ink border border-border/10 cursor-not-allowed opacity-50 shadow-none"
                                : "bg-card text-foreground hover:text-primary border border-border/50 hover:border-primary/30"}
                        `}
                    >
                        <ChevronLeft size={20} />
                        Previous Node
                    </button>

                    {/* Question Matrix (Breadcrumbs) */}
                    <div className="hidden lg:flex items-center gap-3 px-6 py-4 bg-muted/20 rounded-full border border-border/20 ">
                        {quiz.questions.map((q, idx) => (
                            <button
                                key={q.question_id}
                                onClick={() => setCurrentIndex(idx)}
                                className={`
                                    w-3.5 h-3.5 rounded-full transition-all duration-500
                                    ${idx === currentIndex
                                        ? "bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)] scale-150 rotate-45 rounded-sm"
                                        : answers[q.question_id]
                                            ? "bg-primary/40"
                                            : "bg-muted-foreground/20 hover:bg-primary/20"
                                    }
                                `}
                            />
                        ))}
                    </div>

                    {currentIndex === totalQuestions - 1 ? (
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className={`
                                flex items-center gap-4 px-12 py-5 rounded-2xl font-black font-display text-[10px] uppercase tracking-[0.2em] transition-all  active:scale-95
                                ${submitting ? "bg-muted text-neutral-ink" : "bg-foreground text-background hover:opacity-95 shadow-[0_0_30px_rgba(var(--foreground),0.2)]"}
                            `}
                        >
                            {submitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send size={20} className="rotate-12" />
                            )}
                            Commit Sync
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            className="flex items-center gap-4 px-10 py-5 bg-card text-foreground font-black font-display text-[10px] uppercase tracking-[0.2em] rounded-2xl border border-border/50 hover:border-primary/30 hover:text-primary transition-all  active:scale-90group"
                        >
                            Next Node
                            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    )}
                </div>

                {/* State Summary Metadata */}
                <div className="mt-10 text-center">
                    <span className="px-6 py-2.5 bg-muted/30 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-neutral-ink font-display border border-border/20 italic">
                        {answeredCount} of {totalQuestions} Nodes Synchronized
                    </span>
                </div>
            </main>
        </div>
    );
}
