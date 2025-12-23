"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Clock, Flag, ChevronLeft, ChevronRight, Send,
    AlignJustify, Target, Menu, X, AlertTriangle,
    CheckCircle2, HelpCircle
} from "lucide-react";
import { mockExamConfigs, getQuestionsForExam } from "@/data/mockPractice";
import { ExamConfig, Question, UserAnswer, DisplayMode, QuestionStatus } from "@/types/practice";

export default function ExamSessionPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params?.examId as string;

    const examConfig = useMemo(() => mockExamConfigs.find((e) => e.id === examId), [examId]);
    const questions = useMemo(() => (examId ? getQuestionsForExam(examId) : []), [examId]);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, UserAnswer>>({});
    const [flagged, setFlagged] = useState<Set<string>>(new Set());
    const [displayMode, setDisplayMode] = useState<DisplayMode>("FOCUS");
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

    useEffect(() => {
        if (examConfig?.timerMode !== "UNLIMITED" && examConfig?.timeLimitMinutes) {
            setTimeRemaining(examConfig.timeLimitMinutes * 60);
        }
    }, [examConfig]);

    useEffect(() => {
        if (isSubmitted || !timeRemaining || examConfig?.timerMode === "UNLIMITED") return;
        const interval = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) { clearInterval(interval); handleSubmit(); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [isSubmitted, examConfig?.timerMode]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

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
        if (index >= 0 && index < questions.length) setCurrentIndex(index);
    };

    const handleSubmit = () => { setIsSubmitted(true); setShowSubmitConfirm(false); };
    const handleViewResults = () => { router.push(`/practice/jlpt/result/${examId}`); };

    const answeredCount = Object.values(answers).filter((a) => a.selectedOptionId).length;
    const flaggedCount = flagged.size;

    if (!examConfig || questions.length === 0) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mb-6">
                    <AlertTriangle size={32} />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Exam Not Found</h2>
                <p className="text-muted-foreground mb-6">The requested exam could not be loaded.</p>
                <button onClick={() => router.push("/practice/jlpt")} className="px-6 py-3 bg-foreground text-background font-bold rounded-xl hover:bg-foreground/90 transition-colors">
                    Back to Practice
                </button>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];
    const isTimeLow = timeRemaining > 0 && timeRemaining <= 300;

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="bg-card border-b border-border px-6 py-4 sticky top-0 z-50">
                <div className="flex items-center justify-between max-w-[1920px] mx-auto gap-6">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden w-10 h-10 bg-muted hover:bg-muted/80 rounded-xl flex items-center justify-center transition-colors">
                            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                        <div>
                            <h1 className="text-lg font-bold text-foreground font-display">{examConfig.title}</h1>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-bold">{examConfig.level}</span>
                            </div>
                        </div>
                    </div>

                    {examConfig.timerMode !== "UNLIMITED" && (
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-lg ${isTimeLow ? "bg-destructive/10 text-destructive" : "bg-muted text-foreground"}`}>
                            <Clock size={18} />
                            <span>{formatTime(timeRemaining)}</span>
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-1 p-1 bg-muted rounded-xl">
                            <button onClick={() => setDisplayMode("FOCUS")} className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${displayMode === "FOCUS" ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                                <Target size={16} />
                            </button>
                            <button onClick={() => setDisplayMode("SCROLL")} className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${displayMode === "SCROLL" ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                                <AlignJustify size={16} />
                            </button>
                        </div>

                        {!isSubmitted ? (
                            <button onClick={() => setShowSubmitConfirm(true)} className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-background font-bold text-sm rounded-xl hover:bg-foreground/90 transition-colors">
                                <Send size={16} />
                                <span className="hidden sm:inline">Submit</span>
                            </button>
                        ) : (
                            <button onClick={handleViewResults} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-colors">
                                <CheckCircle2 size={16} />
                                <span className="hidden sm:inline">View Results</span>
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-card border-r border-border transform transition-transform lg:transform-none ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} pt-20 lg:pt-0`}>
                    <div className="p-6 h-full flex flex-col">
                        <div className="mb-6 pb-6 border-b border-border">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-bold text-muted-foreground">Progress</span>
                                <span className="text-sm font-bold text-foreground">{currentIndex + 1} / {questions.length}</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary transition-all" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
                            </div>
                            <div className="flex items-center gap-4 mt-4 text-xs font-bold text-muted-foreground">
                                <span className="text-primary">{answeredCount} answered</span>
                                <span className="text-secondary-foreground">{flaggedCount} flagged</span>
                            </div>
                        </div>

                        {/* Question Navigator */}
                        <div className="flex-1 overflow-y-auto mb-6">
                            <div className="grid grid-cols-5 gap-2">
                                {questions.map((q, index) => {
                                    const status = getQuestionStatus(q.id);
                                    const isCurrent = index === currentIndex;
                                    let colorClass = "bg-muted text-muted-foreground hover:bg-muted/80";
                                    if (status === "ANSWERED") colorClass = "bg-primary/10 text-primary border-primary/30";
                                    if (status === "FLAGGED") colorClass = "bg-secondary text-secondary-foreground";
                                    if (isCurrent) colorClass = "bg-foreground text-background";
                                    if (isSubmitted) {
                                        const userAnswer = answers[q.id]?.selectedOptionId;
                                        const isCorrect = userAnswer === q.correctOptionId;
                                        if (userAnswer) colorClass = isCorrect ? "bg-primary text-primary-foreground" : "bg-destructive text-destructive-foreground";
                                    }
                                    return (
                                        <button key={q.id} onClick={() => goToQuestion(index)} className={`aspect-square rounded-lg font-bold text-xs border transition-colors ${colorClass}`}>
                                            {index + 1}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="pt-4 border-t border-border">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-muted rounded" /><span className="text-muted-foreground">Unanswered</span></div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-primary/10 border border-primary/30 rounded" /><span className="text-muted-foreground">Answered</span></div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-secondary rounded" /><span className="text-muted-foreground">Flagged</span></div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-foreground rounded" /><span className="text-muted-foreground">Current</span></div>
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

            {/* Submit Confirmation Modal */}
            {showSubmitConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-background/80">
                    <div className="w-full max-w-md bg-card rounded-2xl p-8 border border-border text-center">
                        <h3 className="text-xl font-bold text-foreground mb-2">Submit Exam?</h3>
                        <p className="text-muted-foreground mb-6">You have answered {answeredCount} of {questions.length} questions.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowSubmitConfirm(false)} className="flex-1 py-3 bg-muted rounded-xl font-bold text-foreground hover:bg-muted/80 transition-colors">Cancel</button>
                            <button onClick={handleSubmit} className="flex-1 py-3 bg-foreground text-background rounded-xl font-bold hover:bg-foreground/90 transition-colors">Submit</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Focus Mode View
function FocusModeView({ question, questionIndex, totalQuestions, selectedOptionId, isFlagged, isSubmitted, onSelectAnswer, onToggleFlag, onPrevious, onNext }: {
    question: Question; questionIndex: number; totalQuestions: number; selectedOptionId: string | null; isFlagged: boolean; isSubmitted: boolean;
    onSelectAnswer: (optionId: string) => void; onToggleFlag: () => void; onPrevious: () => void; onNext: () => void;
}) {
    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <span className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold">{questionIndex + 1}</span>
                    <span className="text-sm text-muted-foreground">of {totalQuestions} questions</span>
                </div>
                <button onClick={onToggleFlag} disabled={isSubmitted} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${isFlagged ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"} ${isSubmitted ? "opacity-50 cursor-not-allowed" : ""}`}>
                    <Flag size={16} className={isFlagged ? "fill-current" : ""} />
                    {isFlagged ? "Flagged" : "Flag"}
                </button>
            </div>

            {/* Passage */}
            {question.passage && (
                <div className="p-6 bg-muted rounded-2xl">
                    <p className="text-lg font-jp text-foreground whitespace-pre-line leading-relaxed">{question.passage}</p>
                </div>
            )}

            {/* Question */}
            <div className="bg-card rounded-2xl border border-border p-8">
                <p className="text-xl font-bold text-foreground leading-relaxed">{question.content}</p>
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
                        <button key={option.id} onClick={() => onSelectAnswer(option.id)} disabled={isSubmitted} className={`w-full text-left p-5 rounded-xl border transition-colors flex items-center gap-4 ${optionClass} ${isSubmitted ? "cursor-default" : "cursor-pointer"}`}>
                            <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center font-bold text-sm shrink-0">{String.fromCharCode(65 + idx)}</span>
                            <span className="text-lg font-jp">{option.text}</span>
                        </button>
                    );
                })}
            </div>

            {/* Explanation */}
            {isSubmitted && (
                <div className="p-6 bg-muted rounded-2xl">
                    <div className="flex items-start gap-4">
                        <HelpCircle size={20} className="text-primary shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-bold text-foreground mb-1">Explanation</h4>
                            <p className="text-muted-foreground font-jp">{question.explanation}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 border-t border-border">
                <button onClick={onPrevious} disabled={questionIndex === 0} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-colors ${questionIndex === 0 ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-card border border-border text-foreground hover:border-primary/50"}`}>
                    <ChevronLeft size={18} /> Previous
                </button>
                <button onClick={onNext} disabled={questionIndex === totalQuestions - 1} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-colors ${questionIndex === totalQuestions - 1 ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-foreground text-background hover:bg-foreground/90"}`}>
                    Next <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
}

// Scroll Mode View
function ScrollModeView({ questions, answers, flagged, isSubmitted, onSelectAnswer, onToggleFlag }: {
    questions: Question[]; answers: Record<string, UserAnswer>; flagged: Set<string>; isSubmitted: boolean;
    onSelectAnswer: (questionId: string, optionId: string) => void; onToggleFlag: (questionId: string) => void;
}) {
    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-32">
            {questions.map((question, idx) => {
                const selectedOptionId = answers[question.id]?.selectedOptionId || null;
                const isFlagged = flagged.has(question.id);

                return (
                    <div key={question.id} className="bg-card rounded-2xl border border-border p-8">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center font-bold text-sm">{idx + 1}</span>
                                {isSubmitted && (
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${answers[question.id]?.selectedOptionId === question.correctOptionId ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                                        {answers[question.id]?.selectedOptionId === question.correctOptionId ? "Correct" : "Incorrect"}
                                    </span>
                                )}
                            </div>
                            <button onClick={() => onToggleFlag(question.id)} disabled={isSubmitted} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${isFlagged ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"} ${isSubmitted ? "opacity-50" : ""}`}>
                                <Flag size={12} className={isFlagged ? "fill-current" : ""} />
                                {isFlagged ? "Flagged" : "Flag"}
                            </button>
                        </div>

                        {/* Passage */}
                        {question.passage && (
                            <div className="mb-6 p-5 bg-muted rounded-xl">
                                <p className="text-lg font-jp text-foreground whitespace-pre-line">{question.passage}</p>
                            </div>
                        )}

                        {/* Question */}
                        <p className="text-xl font-bold text-foreground mb-6">{question.content}</p>

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
                                    <button key={option.id} onClick={() => onSelectAnswer(question.id, option.id)} disabled={isSubmitted} className={`w-full text-left p-4 rounded-xl border transition-colors flex items-center gap-3 ${optionClass}`}>
                                        <span className="w-7 h-7 bg-card rounded-lg flex items-center justify-center font-bold text-xs shrink-0">{String.fromCharCode(65 + optIdx)}</span>
                                        <span className="font-jp">{option.text}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Explanation */}
                        {isSubmitted && (
                            <div className="mt-6 p-5 bg-muted rounded-xl">
                                <div className="flex items-start gap-3">
                                    <HelpCircle size={16} className="text-primary shrink-0 mt-0.5" />
                                    <p className="text-sm text-muted-foreground font-jp">{question.explanation}</p>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
