"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
    Clock,
    Flag,
    ChevronLeft,
    ChevronRight,
    Send,
    LayoutGrid,
    AlignJustify,
    Menu,
    X,
    AlertTriangle,
    CheckCircle2,
    HelpCircle,
    ArrowLeft,
    BookOpen,
    Sparkles,
} from "lucide-react";

import { mockExamConfigs, getQuestionsForExam } from "@/data/mockPractice";
import {
    ExamConfig,
    Question,
    UserAnswer,
    DisplayMode,
    QuestionStatus,
} from "@/types/practice";
import { useExamTimer } from "@/hooks/useExamTimer";
import * as jlptService from "@/services/jlptService";

// ============================================================================
// EXAM SESSION PAGE - Now at /jlpt/[examId]
// ============================================================================

export default function ExamSessionPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params?.examId as string;

    // Load exam config
    const examConfig = useMemo(() => {
        return mockExamConfigs.find((e) => e.id === examId);
    }, [examId]);

    // Load questions
    const questions = useMemo(() => {
        if (!examId) return [];
        return getQuestionsForExam(examId);
    }, [examId]);

    const searchParams = useSearchParams();
    const isReviewMode = searchParams.get('review') === 'true';
    const attemptId = searchParams.get('attemptId');

    // Session State
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, UserAnswer>>({});
    const [flagged, setFlagged] = useState<Set<string>>(new Set());
    const [displayMode, setDisplayMode] = useState<DisplayMode>("FOCUS");
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [startedAt] = useState<Date>(new Date());

    // Load answers if in review mode
    useEffect(() => {
        if (isReviewMode) {
            setIsSubmitted(true);
            try {
                const saved = sessionStorage.getItem('last_exam_attempt');
                if (saved) {
                    const attempt = JSON.parse(saved);
                    if (attempt.answers) {
                        setAnswers(attempt.answers);
                    }
                }
            } catch (e) {
                console.error('Error loading answers for review:', e);
            }
        }
    }, [isReviewMode]);

    // Submit exam
    const handleSubmit = useCallback(async () => {
        if (isSubmitted) return;

        const completedAt = new Date();

        // Calculate the result
        const attempt = jlptService.calculateExamResult({
            examId,
            examTitle: examConfig?.title || 'Unknown Exam',
            examMode: examConfig?.mode || 'QUIZ',
            level: examConfig?.level || 'N3',
            questions,
            answers,
            startedAt,
            completedAt,
        });

        // Save to local storage
        jlptService.saveLocalAttempt(attempt);

        // If user is logged in, try to save to API
        // if (user) {
        //     try { await jlptService.saveAttempt(attempt); } catch (e) { console.error(e); }
        // }

        setIsSubmitted(true);
        setShowSubmitConfirm(false);

        // Store attempt ID in session storage for the result page to pick up
        sessionStorage.setItem('last_exam_attempt', JSON.stringify(attempt));
    }, [isSubmitted, examId, examConfig, questions, answers, startedAt]);

    // Handle submit callback for timer
    const handleTimerSubmit = useCallback(() => {
        handleSubmit();
    }, [handleSubmit]);

    // Use exam timer hook with persistence
    const {
        timeRemaining,
        formattedTime,
        timerStyles,
        isTimeLow,
        isTimeUp,
    } = useExamTimer({
        examId: examId || 'unknown',
        initialSeconds: examConfig?.timeLimitMinutes ? examConfig.timeLimitMinutes * 60 : 0,
        timerMode: examConfig?.timerMode || 'UNLIMITED',
        onTimeUp: handleTimerSubmit,
        autoStart: true,
    });

    // Auto-submit when time is up
    React.useEffect(() => {
        if (isTimeUp && !isSubmitted) {
            setIsSubmitted(true);
        }
    }, [isTimeUp, isSubmitted]);

    // Get question status
    const getQuestionStatus = (questionId: string): QuestionStatus => {
        if (flagged.has(questionId)) return "FLAGGED";
        if (answers[questionId]?.selectedOptionId) return "ANSWERED";
        return "UNANSWERED";
    };

    // Handle answer selection
    const handleSelectAnswer = (questionId: string, optionId: string) => {
        if (isSubmitted) return;

        setAnswers((prev) => ({
            ...prev,
            [questionId]: {
                questionId,
                selectedOptionId: optionId,
                timeSpentSeconds: 0,
            },
        }));
    };

    // Handle flag toggle
    const handleToggleFlag = (questionId: string) => {
        if (isSubmitted) return;

        setFlagged((prev) => {
            const newFlagged = new Set(prev);
            if (newFlagged.has(questionId)) {
                newFlagged.delete(questionId);
            } else {
                newFlagged.add(questionId);
            }
            return newFlagged;
        });
    };

    const contentRef = React.useRef<HTMLDivElement>(null);

    // Helper to find the scrollable parent (AppShell's overflow-auto div)
    const getScrollContainer = () => {
        if (!contentRef.current) return window;
        let parent = contentRef.current.parentElement;
        while (parent) {
            const overflow = window.getComputedStyle(parent).overflowY;
            if (overflow === "auto" || overflow === "scroll") return parent;
            parent = parent.parentElement;
        }
        return window;
    };

    // Navigation
    // Navigation
    const goToQuestion = useCallback((index: number) => {
        if (index >= 0 && index < questions.length) {
            setCurrentIndex(index);
            if (displayMode === "SCROLL") {
                const element = document.getElementById(`question-${index}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        }
    }, [questions.length, displayMode]);

    // Sync active question on scroll (for SCROLL mode) using IntersectionObserver
    useEffect(() => {
        if (displayMode !== "SCROLL" || questions.length === 0) return;

        const observerOptions = {
            root: null, // Spy on viewport
            rootMargin: '-15% 0px -75% 0px', // Active region is top part of screen
            threshold: 0
        };

        const observerCallback = (entries: IntersectionObserverEntry[]) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    const index = parseInt(id.replace('question-', ''), 10);
                    if (!isNaN(index)) {
                        setCurrentIndex(index);
                    }
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        questions.forEach((_, i) => {
            const el = document.getElementById(`question-${i}`);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [displayMode, questions]);



    // View results - Updated URL
    const handleViewResults = () => {
        router.push(`/jlpt/${examId}/result`);
    };

    // Stats
    const answeredCount = Object.values(answers).filter((a) => a.selectedOptionId).length;
    const flaggedCount = flagged.size;

    if (!examConfig || questions.length === 0) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
                <div className="w-32 h-32 bg-destructive/5 rounded-2xl flex items-center justify-center mb-10 ">
                    <AlertTriangle className="w-16 h-16 text-destructive/20" />
                </div>
                <h2 className="text-3xl font-black text-foreground mb-4 font-display">Exam Not Found</h2>
                <p className="text-muted-foreground font-bold mb-10 max-w-md">The requested exam could not be loaded. Please check your connection or try again later.</p>
                <button
                    onClick={() => router.push("/jlpt")}
                    className="flex items-center gap-3 px-10 py-5 bg-foreground text-background font-black rounded-2xl hover:opacity-90 active:scale-95 transition-all  font-display uppercase tracking-widest text-xs"
                >
                    <ArrowLeft size={20} />
                    Back to Practice
                </button>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];
    return (
        <div className="min-h-screen bg-secondary flex flex-col">
            {/* ===== TOP BAR ===== */}
            <header className="bg-neutral-white border-b border-neutral-gray/30 px-6 py-4 sticky top-0 z-50 shadow-sm">
                <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
                    {/* Left: Title & Mode */}
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="lg:hidden p-3 bg-muted rounded-xl hover:text-primary transition-all"
                        >
                            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                        <div className="space-y-0.5">
                            <h1 className="text-xl font-black text-foreground font-display tracking-tight leading-none">{examConfig.title}</h1>
                            <p className="text-[10px] font-black text-neutral-ink uppercase tracking-widest font-display">
                                {examConfig.level} <span className="mx-1">•</span> {examConfig.mode.replace("_", " ")}
                            </p>
                        </div>
                    </div>

                    {/* Center: Timer */}
                    <div
                        className={`
                            flex items-center gap-3 px-8 py-3 rounded-2xl font-black text-xl font-display  transition-all duration-500
                            ${timerStyles}
                        `}
                    >
                        <Clock size={22} className={isTimeLow ? "animate-pulse" : ""} />
                        {formattedTime}
                    </div>

                    {/* Right: Controls */}
                    <div className="flex items-center gap-6">
                        {/* Display Mode Toggle */}
                        <div className="hidden md:flex items-center gap-1.5 p-1.5 bg-muted rounded-2xl border border-border/50">
                            <button
                                onClick={() => setDisplayMode("FOCUS")}
                                className={`p-2.5 rounded-xl transition-all duration-500 ${displayMode === "FOCUS" ? "bg-card text-primary " : "text-neutral-ink hover:text-foreground"}`}
                                title="Focus Mode"
                            >
                                <LayoutGrid size={20} />
                            </button>
                            <button
                                onClick={() => setDisplayMode("SCROLL")}
                                className={`p-2.5 rounded-xl transition-all duration-500 ${displayMode === "SCROLL" ? "bg-card text-primary " : "text-neutral-ink hover:text-foreground"}`}
                                title="Scroll Mode"
                            >
                                <AlignJustify size={20} />
                            </button>
                        </div>

                        {/* Submit Button */}
                        {!isSubmitted ? (
                            <button
                                onClick={() => setShowSubmitConfirm(true)}
                                className="flex items-center gap-3 px-8 py-4 bg-foreground text-background font-black rounded-2xl hover:opacity-90 active:scale-95 transition-all  font-display uppercase tracking-widest text-xs"
                            >
                                <Send size={18} />
                                Submit
                            </button>
                        ) : (
                            <button
                                onClick={handleViewResults}
                                className="flex items-center gap-3 px-8 py-4 bg-primary text-white font-black rounded-2xl hover:opacity-90 active:scale-95 transition-all  font-display uppercase tracking-widest text-xs"
                            >
                                <CheckCircle2 size={18} />
                                View Results
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* ===== MAIN CONTENT ===== */}
            <div ref={contentRef} className="flex-1 flex min-h-0">
                <aside
                    className={`
                        fixed lg:sticky lg:top-[5.5rem] lg:h-[calc(100vh-5.5rem)] inset-y-0 lg:inset-y-auto left-0 lg:left-auto z-40 w-80 
                        transform transition-all duration-500 lg:transform-none select-none
                        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                        bg-neutral-beige lg:bg-transparent border-r border-neutral-gray lg:border-none
                    `}
                >
                    <div className="px-6 py-8 h-full flex flex-col gap-10">
                        {/* Stats Summary */}
                        <div className="bg-neutral-white rounded-2xl p-8 border border-neutral-gray/30 shadow-md space-y-6">
                            <div className="flex items-end justify-between">
                                <h3 className="text-4xl font-black text-foreground font-display leading-none">
                                    {currentIndex + 1}<span className="text-neutral-ink italic mx-1">/</span><span className="text-xl text-neutral-ink">{questions.length}</span>
                                </h3>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest font-display">Active Question</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-700 ease-out"
                                    style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-muted/30 rounded-2xl space-y-1">
                                    <p className="text-[9px] font-black text-primary/50 uppercase tracking-widest font-display">Answered</p>
                                    <p className="text-xl font-black text-primary font-display">{answeredCount}</p>
                                </div>
                                <div className="p-4 bg-muted/30 rounded-2xl space-y-1">
                                    <p className="text-[9px] font-black text-secondary/50 uppercase tracking-widest font-display">Flagged</p>
                                    <p className="text-xl font-black text-secondary font-display">{flaggedCount}</p>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Grid */}
                        <div className="flex-1 bg-neutral-white rounded-2xl p-8 border border-neutral-gray/30 shadow-md flex flex-col overflow-hidden">
                            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] font-display mb-6">Question Map</h3>
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                <div className="grid grid-cols-4 gap-3">
                                    {questions.map((q, index) => {
                                        const status = getQuestionStatus(q.id);
                                        const isCurrent = index === currentIndex;

                                        let style = "bg-neutral-beige text-neutral-ink hover:bg-neutral-gray/20 font-black";
                                        if (status === "ANSWERED") style = "bg-primary/20 text-primary-strong hover:bg-primary/30 font-black shadow-sm";
                                        if (status === "FLAGGED") style = "bg-primary text-white font-black shadow-lg shadow-primary/20";
                                        if (isCurrent) style = "bg-primary-strong text-white scale-110 ring-4 ring-primary/20 font-black shadow-xl";

                                        if (isSubmitted) {
                                            const userAnswer = answers[q.id]?.selectedOptionId;
                                            const isCorrect = userAnswer === q.correctOptionId;
                                            if (userAnswer) {
                                                style = isCorrect
                                                    ? "bg-emerald-500 text-white font-black"
                                                    : "bg-destructive text-white font-black";
                                            }
                                            if (isCurrent) style += " ring-4 ring-foreground/20";
                                        }

                                        return (
                                            <button
                                                key={q.id}
                                                onClick={() => goToQuestion(index)}
                                                className={`aspect-square rounded-xl text-xs transition-all duration-300 active:scale-90 font-display ${style} flex items-center justify-center`}
                                            >
                                                {index + 1}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="p-4 bg-muted/20 rounded-2xl border border-border/30">
                            <div className="flex flex-wrap gap-4 justify-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-muted/50" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-neutral-ink font-display">Idle</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-primary/20" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-neutral-ink font-display">Passed</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-neutral-ink font-display">Flagged</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* ===== QUESTION AREA ===== */}
                <main className="flex-1 p-6 md:p-12">
                    {displayMode === "FOCUS" ? (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <FocusModeView
                                question={currentQuestion}
                                questionIndex={currentIndex}
                                totalQuestions={questions.length}
                                selectedOptionId={answers[currentQuestion.id]?.selectedOptionId || null}
                                isFlagged={flagged.has(currentQuestion.id)}
                                isSubmitted={isSubmitted}
                                onSelectAnswer={(optionId) => handleSelectAnswer(currentQuestion.id, optionId)}
                                onToggleFlag={() => handleToggleFlag(currentQuestion.id)}
                                onPrevious={() => goToQuestion(currentIndex - 1)}
                                onNext={() => goToQuestion(currentIndex + 1)}
                            />
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                            <ScrollModeView
                                questions={questions}
                                answers={answers}
                                flagged={flagged}
                                isSubmitted={isSubmitted}
                                onSelectAnswer={handleSelectAnswer}
                                onToggleFlag={handleToggleFlag}
                            />
                        </div>
                    )}
                </main>
            </div>

            {/* ===== SUBMIT CONFIRMATION MODAL ===== */}
            {showSubmitConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/80  animate-in fade-in duration-300">
                    <div className="bg-card rounded-2xl p-12 max-w-lg w-full  border border-border space-y-10 animate-in zoom-in-95 duration-500">
                        <div className="text-center space-y-6">
                            <div className="w-24 h-24 mx-auto bg-primary/5 rounded-2xl flex items-center justify-center ">
                                <Send size={44} className="text-primary animate-bounce-slow" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-4xl font-black text-foreground font-display tracking-tight">Finalized?</h3>
                                <p className="text-muted-foreground font-bold leading-relaxed">
                                    Ready to submit your work? You've confirmed <span className="text-foreground">{answeredCount}</span> out of <span className="text-foreground">{questions.length}</span> questions.
                                </p>
                            </div>
                        </div>

                        {questions.length - answeredCount > 0 && (
                            <div className="p-4 bg-destructive/5 rounded-2xl border border-destructive/20 flex items-center gap-4">
                                <AlertTriangle className="text-destructive shrink-0" size={24} />
                                <p className="text-destructive font-black text-xs uppercase tracking-widest font-display">
                                    Attention: {questions.length - answeredCount} questions are still empty!
                                </p>
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowSubmitConfirm(false)}
                                className="flex-1 px-8 py-5 bg-muted text-muted-foreground font-black rounded-2xl hover:text-foreground transition-all font-display uppercase tracking-widest text-xs active:scale-95"
                            >
                                Continue Work
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="flex-1 px-8 py-5 bg-foreground text-background font-black rounded-2xl hover:opacity-90 transition-all  font-display uppercase tracking-widest text-xs active:scale-95"
                            >
                                Submit Exam
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// FOCUS MODE VIEW
// ============================================================================

interface FocusModeViewProps {
    question: Question;
    questionIndex: number;
    totalQuestions: number;
    selectedOptionId: string | null;
    isFlagged: boolean;
    isSubmitted: boolean;
    onSelectAnswer: (optionId: string) => void;
    onToggleFlag: () => void;
    onPrevious: () => void;
    onNext: () => void;
}

function FocusModeView({
    question,
    questionIndex,
    totalQuestions,
    selectedOptionId,
    isFlagged,
    isSubmitted,
    onSelectAnswer,
    onToggleFlag,
    onPrevious,
    onNext,
}: FocusModeViewProps) {
    return (
        <div className="max-w-4xl mx-auto space-y-10">
            {/* Integrated Question Card */}
            <div className="bg-card rounded-2xl p-10 md:p-14 border border-border space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 relative overflow-hidden group/card shadow-xl shadow-primary/5">
                {/* Background Deco */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-primary/2 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover/card:bg-primary/5 transition-colors duration-1000" />

                {/* Question Header */}
                <div className="flex items-center justify-between border-b border-border/50 pb-8 relative z-10">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] font-display">Sequence</p>
                        <p className="text-xl font-black text-foreground font-display">
                            Question {questionIndex + 1} <span className="text-neutral-ink italic mx-1">/</span> <span className="text-neutral-ink">{totalQuestions}</span>
                        </p>
                    </div>

                    <button
                        onClick={onToggleFlag}
                        disabled={isSubmitted}
                        className={`
                            flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest font-display transition-all duration-300
                            ${isFlagged ? "bg-secondary text-white shadow-lg shadow-secondary/20" : "bg-muted/50 text-muted-foreground hover:text-foreground border border-border/30"}
                            ${isSubmitted ? "opacity-30 cursor-not-allowed" : "active:scale-95"}
                        `}
                    >
                        <Flag size={16} fill={isFlagged ? "currentColor" : "none"} />
                        {isFlagged ? "Flagged" : "Flag Question"}
                    </button>
                </div>

                {/* Passage Segment */}
                {question.passage && (
                    <div className="bg-muted/20 rounded-2xl p-10 text-xl font-jp leading-[2] tracking-tight border border-border/50 relative group/passage italic text-foreground/80">
                        <div className="flex items-center gap-3 text-primary/40 mb-4">
                            <BookOpen size={20} />
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] font-display">Japanese Context</h4>
                        </div>
                        {question.passage}
                    </div>
                )}

                {/* Question Content */}
                <div className="relative">
                    <div className="flex items-center gap-3 text-primary/40 mb-4">
                        <HelpCircle size={20} />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] font-display">Question Prompt</h4>
                    </div>
                    <p className="text-2xl font-black text-foreground font-jp leading-relaxed group-hover/card:text-primary transition-colors">
                        {question.content}
                    </p>
                </div>

                {/* Answer Options Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
                    {question.options.map((option, idx) => {
                        const isSelected = selectedOptionId === option.id;
                        const isCorrect = option.id === question.correctOptionId;

                        let style = "bg-card border-border/50 hover:border-primary/30 hover:bg-muted/20";

                        if (isSelected && !isSubmitted) {
                            style = "bg-primary/5 border-primary text-primary shadow-lg shadow-primary/10";
                        }

                        if (isSubmitted) {
                            if (isCorrect) {
                                style = "bg-emerald-500 text-white border-transparent scale-[1.02] z-10 shadow-lg shadow-emerald-500/20";
                            } else if (isSelected && !isCorrect) {
                                style = "bg-destructive text-white border-transparent opacity-80 shadow-lg shadow-destructive/20";
                            } else {
                                style = "bg-muted/30 border-border opacity-40";
                            }
                        }

                        return (
                            <button
                                key={option.id}
                                onClick={() => onSelectAnswer(option.id)}
                                disabled={isSubmitted}
                                className={`
                                    relative w-full text-left p-6 rounded-2xl border transition-all duration-500 flex items-center gap-6 group/opt
                                    ${style}
                                    ${isSubmitted ? "cursor-default" : "cursor-pointer active:scale-95"}
                                `}
                            >
                                <span
                                    className={`
                                        w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 font-display transition-all duration-500
                                        ${isSelected && !isSubmitted ? "bg-primary text-white rotate-12" : "bg-muted text-neutral-ink group-hover/opt:bg-primary/10 group-hover/opt:text-primary"}
                                        ${isSubmitted && isCorrect ? "bg-white text-emerald-500" : ""}
                                        ${isSubmitted && isSelected && !isCorrect ? "bg-white text-destructive" : ""}
                                    `}
                                >
                                    {String.fromCharCode(65 + idx)}
                                </span>
                                <span className="font-bold text-lg font-jp">{option.text}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Explanation (shown after submission) */}
            {isSubmitted && (
                <div className="bg-grammar/5 border border-grammar/20 rounded-2xl p-10 space-y-6 animate-in slide-in-from-top-4 duration-700">
                    <div className="flex items-center gap-3 text-grammar">
                        <Sparkles size={20} />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] font-display">Deep Explanation</h4>
                    </div>
                    <div className="flex items-start gap-6">
                        <p className="text-lg font-bold text-grammar/80 leading-relaxed italic">
                            "{question.explanation}"
                        </p>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-10 border-t border-border/50">
                <button
                    onClick={onPrevious}
                    disabled={questionIndex === 0}
                    className={`
                        flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest font-display transition-all duration-300
                        ${questionIndex === 0 ? "opacity-30 cursor-not-allowed" : "bg-muted text-muted-foreground hover:text-foreground active:scale-95"}
                    `}
                >
                    <ChevronLeft size={20} />
                    Previous
                </button>
                <button
                    onClick={onNext}
                    disabled={questionIndex === totalQuestions - 1}
                    className={`
                        flex items-center gap-3 px-10 py-5 bg-foreground text-background font-black rounded-2xl hover:opacity-90 active:scale-95 transition-all  font-display uppercase tracking-widest text-xs
                        ${questionIndex === totalQuestions - 1 ? "opacity-30 cursor-not-allowed" : ""}
                    `}
                >
                    Next Question
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
}

// ============================================================================
// SCROLL MODE VIEW
// ============================================================================

interface ScrollModeViewProps {
    questions: Question[];
    answers: Record<string, UserAnswer>;
    flagged: Set<string>;
    isSubmitted: boolean;
    onSelectAnswer: (questionId: string, optionId: string) => void;
    onToggleFlag: (questionId: string) => void;
}

function ScrollModeView({
    questions,
    answers,
    flagged,
    isSubmitted,
    onSelectAnswer,
    onToggleFlag,
}: ScrollModeViewProps) {
    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-24">
            {questions.map((question, idx) => {
                const selectedOptionId = answers[question.id]?.selectedOptionId || null;
                const isFlagged = flagged.has(question.id);

                return (
                    <div
                        key={question.id}
                        id={`question-${idx}`}
                        className="bg-card rounded-2xl p-10 md:p-14 border border-border scroll-mt-32 space-y-10 group/card transition-all duration-500 hover:shadow-xl hover:shadow-primary/5 relative overflow-hidden"
                    >
                        {/* Background Deco */}
                        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/2 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover/card:bg-primary/5 transition-colors duration-1000" />

                        {/* Question Header */}
                        <div className="flex items-center justify-between border-b border-border/50 pb-8 relative z-10">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] font-display">Sequence</p>
                                <p className="text-xl font-black text-foreground font-display">Question {idx + 1}</p>
                            </div>

                            <button
                                onClick={() => onToggleFlag(question.id)}
                                disabled={isSubmitted}
                                className={`
                                    flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest font-display transition-all duration-300
                                    ${isFlagged ? "bg-secondary text-white shadow-lg shadow-secondary/20" : "bg-muted/50 text-muted-foreground hover:text-foreground border border-border/30"}
                                    ${isSubmitted ? "opacity-30 cursor-not-allowed" : "active:scale-95"}
                                `}
                            >
                                <Flag size={16} fill={isFlagged ? "currentColor" : "none"} />
                                {isFlagged ? "Flagged" : "Flag"}
                            </button>
                        </div>

                        {/* Passage Segment */}
                        {question.passage && (
                            <div className="bg-muted/20 rounded-2xl p-10 text-xl font-jp leading-[2] tracking-tight border border-border/50 relative group/passage italic text-foreground/80">
                                <div className="flex items-center gap-3 text-primary/40 mb-4">
                                    <BookOpen size={20} />
                                    <span className="text-[10px] font-black uppercase tracking-widest font-display">Context</span>
                                </div>
                                {question.passage}
                            </div>
                        )}

                        {/* Question Content */}
                        <div className="relative">
                            <h3 className="text-2xl font-black text-foreground font-jp leading-relaxed group-hover/card:text-primary transition-colors">
                                {question.content}
                            </h3>
                        </div>

                        {/* Options Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 relative z-10">
                            {question.options.map((option, optIdx) => {
                                const selectedOptionId = answers[question.id]?.selectedOptionId || null;
                                const isSelected = selectedOptionId === option.id;
                                const isCorrect = option.id === question.correctOptionId;

                                let style = "bg-card border-border/50 hover:border-primary/30 hover:bg-muted/20";

                                if (isSelected && !isSubmitted) {
                                    style = "bg-primary/5 border-primary text-primary shadow-lg shadow-primary/10";
                                }

                                if (isSubmitted) {
                                    if (isCorrect) {
                                        style = "bg-emerald-500 text-white border-transparent scale-[1.02] z-10 shadow-lg shadow-emerald-500/20";
                                    } else if (isSelected) {
                                        style = "bg-destructive text-white border-transparent opacity-80 shadow-lg shadow-destructive/20";
                                    } else {
                                        style = "bg-muted/20 border-border opacity-30";
                                    }
                                }

                                return (
                                    <button
                                        key={option.id}
                                        onClick={() => onSelectAnswer(question.id, option.id)}
                                        disabled={isSubmitted}
                                        className={`w-full text-left p-6 rounded-2xl border transition-all duration-500 flex items-center gap-6 group/opt ${style} ${isSubmitted ? "cursor-default" : "cursor-pointer active:scale-95"}`}
                                    >
                                        <span className={`
                                            w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 font-display transition-all duration-500
                                            ${isSelected && !isSubmitted ? "bg-primary text-white rotate-12" : "bg-muted text-neutral-ink group-hover/opt:bg-primary/10 group-hover/opt:text-primary"}
                                            ${isSubmitted && isCorrect ? "bg-white text-emerald-500" : ""}
                                            ${isSubmitted && isSelected && !isCorrect ? "bg-white text-destructive" : ""}
                                        `}>
                                            {String.fromCharCode(65 + optIdx)}
                                        </span>
                                        <span className="font-bold text-lg font-jp">{option.text}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Explanation */}
                        {isSubmitted && (
                            <div className="mt-8 p-10 bg-grammar/5 border border-grammar/20 rounded-2xl animate-in fade-in duration-700">
                                <div className="flex items-center gap-3 text-grammar mb-4">
                                    <Sparkles size={20} />
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] font-display">Deep Explanation</h4>
                                </div>
                                <p className="text-lg font-bold text-grammar/80 leading-relaxed italic">
                                    "{question.explanation}"
                                </p>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
