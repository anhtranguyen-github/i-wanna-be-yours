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
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <AlertTriangle size={48} className="mx-auto mb-4 text-amber-500" />
                    <h2 className="text-xl font-bold text-slate-700 mb-2">Exam Not Found</h2>
                    <p className="text-slate-500 mb-6">The requested exam could not be loaded.</p>
                    <button
                        onClick={() => router.push("/jlpt")}
                        className="px-6 py-3 bg-brand-green text-white font-bold rounded-xl"
                    >
                        Back to Practice
                    </button>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* ===== TOP BAR ===== */}
            <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-50">
                <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
                    {/* Left: Title & Mode */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
                        >
                            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                        <div>
                            <h1 className="font-bold text-brand-dark">{examConfig.title}</h1>
                            <p className="text-xs text-slate-500">{examConfig.level} · {examConfig.mode.replace("_", " ")}</p>
                        </div>
                    </div>

                    {/* Center: Timer */}
                    <div
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-lg
                            ${timerStyles}
                        `}
                    >
                        <Clock size={20} />
                        {formattedTime}
                    </div>

                    {/* Right: Controls */}
                    <div className="flex items-center gap-2">
                        {/* Display Mode Toggle */}
                        <div className="hidden sm:flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                            <button
                                onClick={() => setDisplayMode("FOCUS")}
                                className={`p-2 rounded-md transition-colors ${displayMode === "FOCUS" ? "bg-white shadow text-brand-green" : "text-slate-400 hover:text-slate-600"}`}
                                title="Focus Mode"
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                onClick={() => setDisplayMode("SCROLL")}
                                className={`p-2 rounded-md transition-colors ${displayMode === "SCROLL" ? "bg-white shadow text-brand-green" : "text-slate-400 hover:text-slate-600"}`}
                                title="Scroll Mode"
                            >
                                <AlignJustify size={18} />
                            </button>
                        </div>

                        {/* Submit Button */}
                        {!isSubmitted ? (
                            <button
                                onClick={() => setShowSubmitConfirm(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-brand-green text-white font-bold rounded-xl hover:bg-brand-green/90 transition-colors"
                            >
                                <Send size={18} />
                                <span className="hidden sm:inline">Submit</span>
                            </button>
                        ) : (
                            <button
                                onClick={handleViewResults}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
                            >
                                <CheckCircle2 size={18} />
                                <span className="hidden sm:inline">View Results</span>
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* ===== MAIN CONTENT ===== */}
            <div ref={contentRef} className="flex-1 flex">
                <aside
                    className={`
                        fixed lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] inset-y-0 lg:inset-y-auto left-0 lg:left-auto z-30 w-64 lg:w-80 
                        transform transition-transform duration-300 lg:transform-none
                        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                        pt-16 lg:pt-0 lg:pl-6
                    `}
                >
                    <div className="p-4 h-full bg-white lg:rounded-2xl lg:border lg:border-slate-200 lg:shadow-sm flex flex-col">
                        {/* Test Info */}
                        <div className="mb-4 pb-4 border-b border-slate-100">
                            <p className="text-sm text-slate-500">
                                Question <span className="font-bold text-brand-dark">{currentIndex + 1}</span> of{" "}
                                <span className="font-bold text-brand-dark">{questions.length}</span>
                            </p>
                            <div className="mt-2 flex gap-4 text-xs">
                                <span className="text-emerald-600">✓ {answeredCount} answered</span>
                                <span className="text-amber-600">⚑ {flaggedCount} flagged</span>
                            </div>
                        </div>

                        {/* Question Grid */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="grid grid-cols-5 gap-2">
                                {questions.map((q, index) => {
                                    const status = getQuestionStatus(q.id);
                                    const isCurrent = index === currentIndex;

                                    let bgColor = "bg-slate-100 text-slate-600";
                                    if (status === "ANSWERED") bgColor = "bg-emerald-100 text-emerald-700";
                                    if (status === "FLAGGED") bgColor = "bg-amber-100 text-amber-700";
                                    if (isCurrent) bgColor = "bg-brand-green text-white";

                                    if (isSubmitted) {
                                        const userAnswer = answers[q.id]?.selectedOptionId;
                                        const isCorrect = userAnswer === q.correctOptionId;
                                        if (userAnswer) {
                                            bgColor = isCorrect
                                                ? "bg-emerald-500 text-white"
                                                : "bg-red-500 text-white";
                                        }
                                        if (isCurrent) bgColor += " ring-2 ring-brand-dark ring-offset-2";
                                    }

                                    return (
                                        <button
                                            key={q.id}
                                            onClick={() => goToQuestion(index)}
                                            className={`w-10 h-10 rounded-lg font-bold text-sm transition-all hover:scale-105 ${bgColor}`}
                                        >
                                            {index + 1}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
                            <div className="flex flex-wrap gap-3">
                                <span className="flex items-center gap-1">
                                    <span className="w-3 h-3 rounded bg-slate-100" /> Unanswered
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-3 h-3 rounded bg-emerald-100" /> Answered
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-3 h-3 rounded bg-amber-100" /> Flagged
                                </span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* ===== QUESTION AREA ===== */}
                <main className="flex-1 p-6 lg:p-8">
                    {displayMode === "FOCUS" ? (
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

            {/* ===== SUBMIT CONFIRMATION MODAL ===== */}
            {showSubmitConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
                                <AlertTriangle size={32} className="text-amber-600" />
                            </div>
                            <h3 className="text-xl font-bold text-brand-dark mb-2">Submit Exam?</h3>
                            <p className="text-slate-500 text-sm">
                                You have answered <strong>{answeredCount}</strong> of{" "}
                                <strong>{questions.length}</strong> questions.
                                {questions.length - answeredCount > 0 && (
                                    <span className="text-amber-600 block mt-1">
                                        {questions.length - answeredCount} questions are unanswered!
                                    </span>
                                )}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowSubmitConfirm(false)}
                                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="flex-1 px-4 py-3 bg-brand-green text-white font-bold rounded-xl hover:bg-brand-green/90 transition-colors"
                            >
                                Submit
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
        <div className="max-w-3xl mx-auto">
            {/* Question Header */}
            <div className="flex items-center justify-between mb-6">
                <span className="text-sm font-medium text-slate-500">
                    Question {questionIndex + 1} / {totalQuestions}
                </span>
                <button
                    onClick={onToggleFlag}
                    disabled={isSubmitted}
                    className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                        ${isFlagged ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}
                        ${isSubmitted ? "opacity-50 cursor-not-allowed" : ""}
                    `}
                >
                    <Flag size={16} />
                    {isFlagged ? "Flagged" : "Flag"}
                </button>
            </div>

            {/* Passage (if reading question) */}
            {question.passage && (
                <div className="mb-6 p-6 bg-slate-100 rounded-2xl border border-slate-200">
                    <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                        {question.passage}
                    </p>
                </div>
            )}

            {/* Question Content */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm">
                <p className="text-lg text-brand-dark whitespace-pre-line leading-relaxed">
                    {question.content}
                </p>
            </div>

            {/* Answer Options */}
            <div className="space-y-3 mb-8">
                {question.options.map((option, idx) => {
                    const isSelected = selectedOptionId === option.id;
                    const isCorrect = option.id === question.correctOptionId;

                    let optionStyle = "bg-white border-slate-200 hover:border-brand-green hover:bg-emerald-50";
                    if (isSelected && !isSubmitted) {
                        optionStyle = "bg-emerald-50 border-brand-green ring-2 ring-brand-green/20";
                    }
                    if (isSubmitted) {
                        if (isCorrect) {
                            optionStyle = "bg-emerald-100 border-emerald-500";
                        } else if (isSelected && !isCorrect) {
                            optionStyle = "bg-red-100 border-red-500";
                        }
                    }

                    return (
                        <button
                            key={option.id}
                            onClick={() => onSelectAnswer(option.id)}
                            disabled={isSubmitted}
                            className={`
                                w-full text-left p-4 rounded-xl border-2 transition-all duration-200
                                ${optionStyle}
                                ${isSubmitted ? "cursor-default" : "cursor-pointer"}
                            `}
                        >
                            <div className="flex items-start gap-3">
                                <span
                                    className={`
                                        w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0
                                        ${isSelected ? "bg-brand-green text-white" : "bg-slate-100 text-slate-600"}
                                        ${isSubmitted && isCorrect ? "bg-emerald-500 text-white" : ""}
                                        ${isSubmitted && isSelected && !isCorrect ? "bg-red-500 text-white" : ""}
                                    `}
                                >
                                    {String.fromCharCode(65 + idx)}
                                </span>
                                <span className="text-brand-dark">{option.text}</span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Explanation (shown after submission) */}
            {isSubmitted && (
                <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-2xl">
                    <div className="flex items-start gap-3">
                        <HelpCircle size={20} className="text-blue-600 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-bold text-blue-800 mb-2">Explanation</h4>
                            <p className="text-sm text-blue-700">{question.explanation}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={onPrevious}
                    disabled={questionIndex === 0}
                    className={`
                        flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-colors
                        ${questionIndex === 0 ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-slate-200 text-slate-700 hover:bg-slate-300"}
                    `}
                >
                    <ChevronLeft size={20} />
                    Previous
                </button>
                <button
                    onClick={onNext}
                    disabled={questionIndex === totalQuestions - 1}
                    className={`
                        flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-colors
                        ${questionIndex === totalQuestions - 1 ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-brand-green text-white hover:bg-brand-green/90"}
                    `}
                >
                    Next
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
        <div className="max-w-3xl mx-auto space-y-8">
            {questions.map((question, idx) => {
                const selectedOptionId = answers[question.id]?.selectedOptionId || null;
                const isFlagged = flagged.has(question.id);

                return (
                    <div
                        key={question.id}
                        id={`question-${idx}`}
                        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm scroll-mt-32"
                    >
                        {/* Question Header */}
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-bold text-slate-500">Question {idx + 1}</span>
                            <button
                                onClick={() => onToggleFlag(question.id)}
                                disabled={isSubmitted}
                                className={`
                                    flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors
                                    ${isFlagged ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}
                                `}
                            >
                                <Flag size={14} />
                                {isFlagged ? "Flagged" : "Flag"}
                            </button>
                        </div>

                        {/* Passage */}
                        {question.passage && (
                            <div className="mb-4 p-4 bg-slate-50 rounded-xl text-sm text-slate-600 whitespace-pre-line">
                                {question.passage}
                            </div>
                        )}

                        {/* Question */}
                        <p className="text-brand-dark mb-4 whitespace-pre-line">{question.content}</p>

                        {/* Options */}
                        <div className="space-y-2">
                            {question.options.map((option, optIdx) => {
                                const isSelected = selectedOptionId === option.id;
                                const isCorrect = option.id === question.correctOptionId;

                                let optionStyle = "bg-slate-50 border-slate-200 hover:border-brand-green";
                                if (isSelected && !isSubmitted) {
                                    optionStyle = "bg-emerald-50 border-brand-green";
                                }
                                if (isSubmitted) {
                                    if (isCorrect) optionStyle = "bg-emerald-100 border-emerald-500";
                                    else if (isSelected) optionStyle = "bg-red-100 border-red-500";
                                }

                                return (
                                    <button
                                        key={option.id}
                                        onClick={() => onSelectAnswer(question.id, option.id)}
                                        disabled={isSubmitted}
                                        className={`w-full text-left p-3 rounded-lg border transition-all ${optionStyle}`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-white border flex items-center justify-center text-xs font-bold">
                                                {String.fromCharCode(65 + optIdx)}
                                            </span>
                                            <span className="text-sm">{option.text}</span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Explanation */}
                        {isSubmitted && (
                            <div className="mt-4 p-4 bg-blue-50 rounded-xl text-sm text-blue-700">
                                <strong>Explanation:</strong> {question.explanation}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
