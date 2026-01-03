"use client";

/**
 * Unified Practice Session Page
 * Handles all PracticeNode types: QUIZ, SINGLE_EXAM, FULL_EXAM
 * JLPT and Quiz are now just tags, not separate routes
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Clock, Flag, ChevronLeft, ChevronRight, Send,
    AlignJustify, Target, Menu, X, AlertTriangle,
    CheckCircle2, HelpCircle, ArrowLeft, Loader2
} from "lucide-react";
import Link from "next/link";
import { practiceService } from "@/services/practiceService";
import { startSession, saveRecord } from "@/services/recordService";
import { PracticeNode, Question, UserAnswer, DisplayMode, QuestionStatus } from "@/types/practice";

export default function UnifiedSessionPage() {
    const params = useParams();
    const router = useRouter();
    const nodeId = params?.nodeId as string;

    // Load practice node and questions
    const [node, setNode] = useState<PracticeNode | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Lifecycle tracking
    const currentSessionId = React.useRef<string | null>(null);
    const sessionStartedAt = React.useRef<number>(0);

    useEffect(() => {
        if (!nodeId) return;

        const loadData = async () => {
            setIsLoading(true);
            setLoadError(null);
            try {
                const data = await practiceService.getNodeSessionData(nodeId);
                setNode(data.node);
                setQuestions(data.questions);
            } catch (err: any) {
                // Don't spam console for expected 404 errors
                const message = err?.message || 'Unknown error';
                setLoadError(message);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [nodeId]);

    // Track session start
    useEffect(() => {
        if (!isLoading && node && !currentSessionId.current) {
            sessionStartedAt.current = Date.now();
            startSession('PRACTICE', node.id, node.title).then(sid => {
                currentSessionId.current = sid;
            });
        }
    }, [isLoading, node]);

    // Track session abandonment
    useEffect(() => {
        return () => {
            if (currentSessionId.current && node) {
                saveRecord({
                    itemType: 'PRACTICE',
                    itemId: node.id,
                    itemTitle: node.title,
                    status: 'ABANDONED',
                    sessionId: currentSessionId.current
                });
            }
        };
    }, [node]);

    // State
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, UserAnswer>>({});
    const [flagged, setFlagged] = useState<Set<string>>(new Set());
    const [displayMode, setDisplayMode] = useState<DisplayMode>("FOCUS");
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);

    // Initialize timer based on node config
    useEffect(() => {
        if (node?.tags.timerMode !== "UNLIMITED" && node?.stats.timeLimitMinutes) {
            setTimeRemaining(node.stats.timeLimitMinutes * 60);
        }
    }, [node]);

    // Timer countdown
    useEffect(() => {
        if (isSubmitted || !timeRemaining || node?.tags.timerMode === "UNLIMITED") return;
        const interval = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) { clearInterval(interval); handleSubmit(); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [isSubmitted, node?.tags.timerMode, timeRemaining]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    // Scroll Sync logic for SCROLL mode
    // Highlights the active question in the sidebar based on viewport position
    useEffect(() => {
        if (displayMode !== "SCROLL" || questions.length === 0 || isSubmitted) return;

        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -70% 0px', // Trigger when question is in the upper part of the viewport
            threshold: 0
        };

        const handleIntersection = (entries: IntersectionObserverEntry[]) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const id = entry.target.id.replace('q-', '');
                    const index = questions.findIndex(q => q.id === id);
                    if (index !== -1) {
                        setCurrentIndex(index);
                    }
                }
            });
        };

        const observer = new IntersectionObserver(handleIntersection, observerOptions);

        // Let the DOM settle then observe
        const timer = setTimeout(() => {
            questions.forEach((q) => {
                const el = document.getElementById(`q-${q.id}`);
                if (el) observer.observe(el);
            });
        }, 100);

        return () => {
            observer.disconnect();
            clearTimeout(timer);
        };
    }, [displayMode, questions, isSubmitted]);

    // Handle immediate scroll when switching to SCROLL mode
    useEffect(() => {
        if (displayMode === "SCROLL" && questions.length > 0) {
            const timer = setTimeout(() => {
                const element = document.getElementById(`q-${questions[currentIndex].id}`);
                if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "start" });
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [displayMode]);

    const getQuestionStatus = (questionId: string): QuestionStatus => {
        if (flagged.has(questionId)) return "FLAGGED";
        if (answers[questionId]?.selectedOptionId) return "ANSWERED";
        return "UNANSWERED";
    };

    const handleSelectAnswer = (questionId: string, optionId: string) => {
        if (isSubmitted) return;
        setAnswers((prev) => ({ ...prev, [questionId]: { questionId, selectedOptionId: optionId, timeSpentSeconds: 0 } }));
    };

    const handleToggleFlag = (questionId: string) => {
        if (isSubmitted) return;
        setFlagged((prev) => {
            const newFlagged = new Set(prev);
            if (newFlagged.has(questionId)) newFlagged.delete(questionId);
            else newFlagged.add(questionId);
            return newFlagged;
        });
    };

    const goToQuestion = (index: number) => {
        if (index < 0 || index >= questions.length) return;

        setCurrentIndex(index);

        if (displayMode === "SCROLL") {
            const element = document.getElementById(`q-${questions[index].id}`);
            if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        }
    };

    const handleSubmit = useCallback(async () => {
        setIsSubmitted(true);
        setShowSubmitConfirm(false);
        setIsRedirecting(true);

        try {
            const timeTakenSeconds = node?.stats.timeLimitMinutes
                ? (node.stats.timeLimitMinutes * 60 - timeRemaining)
                : 0;

            const response = await practiceService.saveAttempt({
                nodeId,
                answers,
                timeTakenSeconds,
                // Add any other required fields for PracticeAttempt type if necessary
            } as any);

            // Redirect to results page with the attempt ID
            // This ensures we fetch the data specifically for this attempt from the backend

            // Track COMPLETED event
            if (currentSessionId.current) {
                const score = response.result?.percentage || 0;
                await saveRecord({
                    itemType: 'PRACTICE',
                    itemId: nodeId,
                    itemTitle: node?.title,
                    status: 'COMPLETED',
                    score,
                    sessionId: currentSessionId.current,
                    duration: Math.round((Date.now() - sessionStartedAt.current) / 1000)
                });
                currentSessionId.current = null; // Clear to prevent abandonment tracking
            }

            router.push(`/practice/result/${nodeId}?attemptId=${response.attemptId}`);
        } catch (e) {
            console.error("Failed to save practice results:", e);
            // Fallback redirect if backend fails, though result page might error
            router.push(`/practice/result/${nodeId}`);
        }
    }, [nodeId, router, answers, node, timeRemaining]);

    const handleViewResults = () => {
        router.push(`/practice/result/${nodeId}`);
    };

    const answeredCount = Object.values(answers).filter((a) => a.selectedOptionId).length;
    const flaggedCount = flagged.size;

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
                <Loader2 className="w-16 h-16 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-ink font-display">
                    Loading Practice Node...
                </p>
            </div>
        );
    }

    // Error state
    if (loadError || !node || questions.length === 0) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mb-6">
                    <AlertTriangle size={32} />
                </div>
                <h2 className="text-2xl font-black text-foreground font-display mb-2">
                    {loadError === 'Exam not found' ? 'Practice Not Found' : 'Unable to Load Practice'}
                </h2>
                <p className="text-neutral-ink font-bold mb-6 max-w-md">
                    {loadError === 'Exam not found'
                        ? 'This practice session doesn\'t exist or may have been removed.'
                        : 'The requested practice session could not be loaded. Please try again or choose a different practice.'}
                </p>
                <Link
                    href="/activity"
                    className="px-6 py-3 bg-foreground text-background font-black font-display text-sm rounded-xl hover:bg-foreground/90 transition-colors"
                >
                    Back to Activity Hub
                </Link>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];
    const isTimeLow = timeRemaining > 0 && timeRemaining <= 300;

    // Determine styling based on mode
    const getModeLabel = () => {
        switch (node.mode) {
            case 'QUIZ': return 'Quiz';
            case 'SINGLE_EXAM': return 'Exam';
            case 'FULL_EXAM': return 'Full Exam';
            default: return 'Practice';
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="bg-card border-b border-border px-6 py-4 sticky top-0 z-50">
                <div className="flex items-center justify-between max-w-[1920px] mx-auto gap-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="lg:hidden w-10 h-10 bg-muted hover:bg-muted/80 rounded-xl flex items-center justify-center transition-colors"
                        >
                            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                        <div>
                            <h1 className="text-lg font-black text-foreground font-display">{node.title}</h1>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-black uppercase tracking-widest">
                                    {node.tags.levels?.[0]}
                                </span>
                                <span className="px-2 py-0.5 bg-muted text-neutral-ink rounded text-xs font-black uppercase tracking-widest">
                                    {getModeLabel()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Timer */}
                    {node.tags.timerMode !== "UNLIMITED" && timeRemaining > 0 && (
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-lg ${isTimeLow ? "bg-destructive/10 text-destructive animate-pulse" : "bg-muted text-foreground"}`}>
                            <Clock size={18} />
                            <span>{formatTime(timeRemaining)}</span>
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        {/* Display Mode Toggle */}
                        <div className="hidden sm:flex items-center gap-1 p-1 bg-muted rounded-xl">
                            <button
                                onClick={() => setDisplayMode("FOCUS")}
                                className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${displayMode === "FOCUS" ? "bg-card text-foreground" : "text-neutral-ink hover:text-foreground"}`}
                            >
                                <Target size={16} />
                            </button>
                            <button
                                onClick={() => setDisplayMode("SCROLL")}
                                className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${displayMode === "SCROLL" ? "bg-card text-foreground" : "text-neutral-ink hover:text-foreground"}`}
                            >
                                <AlignJustify size={16} />
                            </button>
                        </div>

                        {/* Submit / View Results */}
                        {!isSubmitted ? (
                            <button
                                onClick={() => setShowSubmitConfirm(true)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-background font-black font-display text-sm rounded-xl hover:bg-foreground/90 transition-colors"
                            >
                                <Send size={16} />
                                <span className="hidden sm:inline">Submit</span>
                            </button>
                        ) : (
                            <button
                                onClick={handleViewResults}
                                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-black font-display text-sm rounded-xl hover:bg-primary/90 transition-colors"
                            >
                                <CheckCircle2 size={16} />
                                <span className="hidden sm:inline">View Results</span>
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex">
                {/* Sidebar - Question Navigator */}
                <aside className={`fixed lg:sticky inset-y-0 left-0 lg:inset-auto lg:top-[73px] lg:h-[calc(100vh-73px)] z-40 w-72 bg-card border-r border-border transform transition-transform lg:transform-none ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} pt-20 lg:pt-0 shrink-0`}>
                    <div className="p-6 h-full flex flex-col overflow-hidden">
                        <div className="mb-6 pb-6 border-b border-border">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-bold text-neutral-ink">Progress</span>
                                <span className="text-sm font-bold text-foreground">{currentIndex + 1} / {questions.length}</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary transition-all" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
                            </div>
                            <div className="flex items-center gap-4 mt-4 text-xs font-bold text-neutral-ink">
                                <span className="text-primary">{answeredCount} answered</span>
                                <span className="text-secondary-foreground">{flaggedCount} flagged</span>
                            </div>
                        </div>

                        {/* Question Navigator Grid */}
                        <div className="flex-1 overflow-y-auto mb-6">
                            <div className="grid grid-cols-5 gap-2">
                                {questions.map((q, index) => {
                                    const status = getQuestionStatus(q.id);
                                    const isCurrent = index === currentIndex;
                                    let colorClass = "bg-muted text-neutral-ink hover:bg-muted/80";
                                    if (status === "ANSWERED") colorClass = "bg-primary/10 text-primary border-primary/30";
                                    if (status === "FLAGGED") colorClass = "bg-secondary text-secondary-foreground";
                                    if (isCurrent) colorClass = "bg-foreground text-background";
                                    if (isSubmitted) {
                                        const userAnswer = answers[q.id]?.selectedOptionId;
                                        const isCorrect = userAnswer === q.correctOptionId;
                                        if (userAnswer) colorClass = isCorrect ? "bg-primary text-primary-foreground" : "bg-destructive text-destructive-foreground";
                                    }
                                    return (
                                        <button
                                            key={q.id}
                                            onClick={() => goToQuestion(index)}
                                            className={`aspect-square rounded-lg font-bold text-xs border transition-colors ${colorClass}`}
                                        >
                                            {index + 1}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="pt-4 border-t border-border shrink-0">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-muted rounded" /><span className="text-neutral-ink">Unanswered</span></div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-primary/10 border border-primary/30 rounded" /><span className="text-neutral-ink">Answered</span></div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-secondary rounded" /><span className="text-neutral-ink">Flagged</span></div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-foreground rounded" /><span className="text-neutral-ink">Current</span></div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Question Area */}
                <main className="flex-1 overflow-y-auto p-8">
                    {displayMode === "FOCUS" ? (
                        <FocusModeView
                            question={currentQuestion}
                            questionIndex={currentIndex}
                            totalQuestions={questions.length}
                            selectedOptionId={(answers[currentQuestion.id]?.selectedOptionId as string) || null}
                            isFlagged={flagged.has(currentQuestion.id)}
                            isSubmitted={isSubmitted}
                            onSelectAnswer={(optionId) => handleSelectAnswer(currentQuestion.id, optionId)}
                            onToggleFlag={() => handleToggleFlag(currentQuestion.id)}
                            onPrevious={() => goToQuestion(currentIndex - 1)}
                            onNext={() => goToQuestion(currentIndex + 1)}
                        />
                    ) : (
                        <ScrollModeView
                            questions={questions}
                            answers={answers}
                            flagged={flagged}
                            isSubmitted={isSubmitted}
                            onSelectAnswer={handleSelectAnswer}
                            onToggleFlag={handleToggleFlag}
                        />
                    )}
                </main>
            </div>

            {/* Submit Confirmation Modal */}
            {showSubmitConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-background/80 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-card rounded-2xl p-8 border border-border text-center">
                        <h3 className="text-xl font-black text-foreground font-display mb-2">Submit Practice?</h3>
                        <p className="text-neutral-ink font-bold mb-6">
                            You have answered {answeredCount} of {questions.length} questions.
                            {questions.length - answeredCount > 0 && (
                                <span className="text-destructive"> ({questions.length - answeredCount} unanswered)</span>
                            )}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowSubmitConfirm(false)}
                                className="flex-1 py-3 bg-muted rounded-xl font-black text-foreground hover:bg-muted/80 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="flex-1 py-3 bg-foreground text-background rounded-xl font-black hover:bg-foreground/90 transition-colors"
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Redirecting Overlay */}
            {isRedirecting && (
                <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center bg-background/90 backdrop-blur-md">
                    <div className="relative w-24 h-24 mb-6">
                        <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Target className="text-primary animate-pulse" size={32} />
                        </div>
                    </div>
                    <h3 className="text-2xl font-black text-foreground font-display mb-2">Analyzing your results...</h3>
                    <p className="text-neutral-ink font-bold animate-pulse">Calculating score and preparing insights</p>
                </div>
            )}
        </div>
    );
}

// =============================================================================
// FOCUS MODE VIEW
// =============================================================================

function FocusModeView({ question, questionIndex, totalQuestions, selectedOptionId, isFlagged, isSubmitted, onSelectAnswer, onToggleFlag, onPrevious, onNext }: {
    question: Question; questionIndex: number; totalQuestions: number; selectedOptionId: string | null; isFlagged: boolean; isSubmitted: boolean;
    onSelectAnswer: (optionId: string) => void; onToggleFlag: () => void; onPrevious: () => void; onNext: () => void;
}) {
    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <span className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-black">{questionIndex + 1}</span>
                    <span className="text-sm text-neutral-ink font-bold">of {totalQuestions} questions</span>
                </div>
                <button
                    onClick={onToggleFlag}
                    disabled={isSubmitted}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${isFlagged ? "bg-secondary text-secondary-foreground" : "bg-muted text-neutral-ink hover:text-foreground"} ${isSubmitted ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                    <Flag size={16} className={isFlagged ? "fill-current" : ""} />
                    {isFlagged ? "Flagged" : "Flag"}
                </button>
            </div>

            {/* Passage */}
            {question.passage && (
                <div className="p-6 bg-muted/50 rounded-2xl border border-border">
                    <p className="text-lg font-jp text-foreground whitespace-pre-line leading-relaxed">{question.passage}</p>
                </div>
            )}

            {/* Question */}
            <div className="bg-card rounded-2xl border border-border p-8">
                <p className="text-xl font-black text-foreground font-jp leading-relaxed">{question.content}</p>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 gap-3">
                {question.options.map((option, idx) => {
                    const isSelected = selectedOptionId === option.id;
                    const isCorrect = option.id === question.correctOptionId;
                    let optionClass = "bg-card border-border text-foreground hover:border-primary/50";
                    if (isSelected && !isSubmitted) optionClass = "bg-primary/10 border-primary text-foreground";
                    if (isSubmitted && isCorrect) optionClass = "bg-primary text-primary-foreground border-primary";
                    if (isSubmitted && isSelected && !isCorrect) optionClass = "bg-destructive text-destructive-foreground border-destructive";

                    return (
                        <button
                            key={option.id}
                            onClick={() => onSelectAnswer(option.id)}
                            disabled={isSubmitted}
                            className={`w-full text-left p-5 rounded-xl border-2 transition-colors flex items-center gap-4 ${optionClass} ${isSubmitted ? "cursor-default" : "cursor-pointer"}`}
                        >
                            <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center font-black text-sm shrink-0">
                                {String.fromCharCode(65 + idx)}
                            </span>
                            <span className="text-lg font-jp">{option.text}</span>
                        </button>
                    );
                })}
            </div>

            {/* Explanation */}
            {isSubmitted && (
                <div className="p-6 bg-muted/50 rounded-2xl border border-border">
                    <div className="flex items-start gap-4">
                        <HelpCircle size={20} className="text-primary shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-black text-foreground mb-1">Explanation</h4>
                            <p className="text-neutral-ink font-jp">{question.explanation}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 border-t border-border">
                <button
                    onClick={onPrevious}
                    disabled={questionIndex === 0}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black transition-colors ${questionIndex === 0 ? "bg-muted text-neutral-ink cursor-not-allowed" : "bg-card border border-border text-foreground hover:border-primary/50"}`}
                >
                    <ChevronLeft size={18} /> Previous
                </button>
                <button
                    onClick={onNext}
                    disabled={questionIndex === totalQuestions - 1}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black transition-colors ${questionIndex === totalQuestions - 1 ? "bg-muted text-neutral-ink cursor-not-allowed" : "bg-foreground text-background hover:bg-foreground/90"}`}
                >
                    Next <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
}

// =============================================================================
// SCROLL MODE VIEW
// =============================================================================

function ScrollModeView({ questions, answers, flagged, isSubmitted, onSelectAnswer, onToggleFlag }: {
    questions: Question[]; answers: Record<string, UserAnswer>; flagged: Set<string>; isSubmitted: boolean;
    onSelectAnswer: (questionId: string, optionId: string) => void; onToggleFlag: (questionId: string) => void;
}) {
    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-32">
            {questions.map((question, idx) => {
                const selectedOptionId = (answers[question.id]?.selectedOptionId as string) || null;
                const isFlagged = flagged.has(question.id);

                return (
                    <div key={question.id} id={`q-${question.id}`} className="bg-card rounded-2xl border border-border p-8 scroll-mt-24">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center font-black text-sm">{idx + 1}</span>
                                {isSubmitted && (
                                    <span className={`px-2 py-1 rounded text-xs font-black ${selectedOptionId === question.correctOptionId ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                                        {selectedOptionId === question.correctOptionId ? "Correct" : "Incorrect"}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => onToggleFlag(question.id)}
                                disabled={isSubmitted}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black transition-colors ${isFlagged ? "bg-secondary text-secondary-foreground" : "bg-muted text-neutral-ink"} ${isSubmitted ? "opacity-50" : ""}`}
                            >
                                <Flag size={12} className={isFlagged ? "fill-current" : ""} />
                                {isFlagged ? "Flagged" : "Flag"}
                            </button>
                        </div>

                        {/* Passage */}
                        {question.passage && (
                            <div className="mb-6 p-5 bg-muted/50 rounded-xl border border-border">
                                <p className="text-lg font-jp text-foreground whitespace-pre-line">{question.passage}</p>
                            </div>
                        )}

                        {/* Question */}
                        <p className="text-xl font-black text-foreground font-jp mb-6">{question.content}</p>

                        {/* Options */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {question.options.map((option, optIdx) => {
                                const isSelected = selectedOptionId === option.id;
                                const isCorrect = option.id === question.correctOptionId;
                                let optionClass = "bg-muted border-transparent text-foreground hover:border-primary/50";
                                if (isSelected && !isSubmitted) optionClass = "bg-primary/10 border-primary text-foreground";
                                if (isSubmitted && isCorrect) optionClass = "bg-primary text-primary-foreground border-primary";
                                if (isSubmitted && isSelected && !isCorrect) optionClass = "bg-destructive text-destructive-foreground border-destructive";

                                return (
                                    <button
                                        key={option.id}
                                        onClick={() => onSelectAnswer(question.id, option.id)}
                                        disabled={isSubmitted}
                                        className={`w-full text-left p-4 rounded-xl border-2 transition-colors flex items-center gap-3 ${optionClass}`}
                                    >
                                        <span className="w-7 h-7 bg-card rounded-lg flex items-center justify-center font-black text-xs shrink-0">
                                            {String.fromCharCode(65 + optIdx)}
                                        </span>
                                        <span className="font-jp">{option.text}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Explanation */}
                        {isSubmitted && (
                            <div className="mt-6 p-5 bg-muted/50 rounded-xl border border-border">
                                <div className="flex items-start gap-3">
                                    <HelpCircle size={16} className="text-primary shrink-0 mt-0.5" />
                                    <p className="text-sm text-neutral-ink font-jp">{question.explanation}</p>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
