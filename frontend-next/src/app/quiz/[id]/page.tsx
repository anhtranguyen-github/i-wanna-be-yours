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
    ArrowLeft
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import { getQuiz, submitQuiz, Quiz, QuizSubmissionResult } from "@/services/quizService";
import { useGlobalAuth } from "@/context/GlobalAuthContext";
import Link from "next/link";

export default function QuizPlayerPage() {
    const router = useRouter();
    const params = useParams();
    const quizId = params?.id as string;
    const { user } = useUser();
    const { openAuth } = useGlobalAuth();

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
                setError("Failed to load quiz");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadQuiz();
    }, [quizId]);

    // Timer
    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0 || result) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev === null || prev <= 1) {
                    clearInterval(timer);
                    // Auto-submit when time runs out
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, result]);

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

    const handleSubmit = async () => {
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
            console.error("Submit failed:", err);
            setError("Failed to submit quiz");
        } finally {
            setSubmitting(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-brand-cream flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    // Error state
    if (error || !quiz) {
        return (
            <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center p-4">
                <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
                <p className="text-slate-600 mb-4">{error || "Quiz not found"}</p>
                <Link
                    href="/quiz"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                    Back to Quizzes
                </Link>
            </div>
        );
    }

    // Result view
    if (result) {
        return (
            <div className="min-h-screen bg-brand-cream py-10 px-4">
                <div className="max-w-2xl mx-auto">
                    {/* Result Card */}
                    <div className="bg-white rounded-2xl border-2 border-gray-100 p-8 text-center">
                        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${result.percentage >= 80
                            ? "bg-green-100 text-green-600"
                            : result.percentage >= 50
                                ? "bg-amber-100 text-amber-600"
                                : "bg-red-100 text-red-600"
                            }`}>
                            <CheckCircle size={40} />
                        </div>

                        <h1 className="text-3xl font-black text-brand-dark mb-2">
                            {result.percentage >= 80 ? "Great Job!" : result.percentage >= 50 ? "Good Effort!" : "Keep Practicing!"}
                        </h1>

                        <p className="text-slate-500 mb-6">{quiz.title}</p>

                        {/* Score */}
                        <div className="text-6xl font-black text-brand-dark mb-2">
                            {result.percentage}%
                        </div>
                        <p className="text-slate-500 mb-8">
                            {result.total_score} / {result.max_score} points
                        </p>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-slate-50 rounded-xl p-4">
                                <div className="text-2xl font-bold text-green-600">
                                    {result.answers.filter(a => a.is_correct).length}
                                </div>
                                <div className="text-sm text-slate-500">Correct</div>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-4">
                                <div className="text-2xl font-bold text-red-500">
                                    {result.answers.filter(a => !a.is_correct).length}
                                </div>
                                <div className="text-sm text-slate-500">Incorrect</div>
                            </div>
                        </div>

                        {/* Weak Areas */}
                        {result.weak_items.length > 0 && (
                            <div className="text-left mb-8">
                                <h3 className="font-bold text-brand-dark mb-3">Areas to Review:</h3>
                                <div className="space-y-2">
                                    {result.weak_items.slice(0, 5).map((item, i) => (
                                        <div key={i} className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm">
                                            {item.learning_point}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Guest message */}
                        {!user && (
                            <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-xl mb-6 text-sm">
                                <button onClick={() => openAuth('LOGIN')} className="font-bold underline">Log in</button> to save your progress and track your scores.
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 justify-center">
                            <Link
                                href="/quiz"
                                className="px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                            >
                                More Quizzes
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
                                className="px-6 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Quiz player
    return (
        <div className="min-h-screen bg-brand-cream">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
                <div className="max-w-3xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Link
                            href="/quiz"
                            className="flex items-center gap-2 text-slate-500 hover:text-brand-dark transition-colors"
                        >
                            <ArrowLeft size={20} />
                            <span className="text-sm font-medium">Exit</span>
                        </Link>

                        <div className="text-center">
                            <h2 className="font-bold text-brand-dark text-sm line-clamp-1">{quiz.title}</h2>
                            <p className="text-xs text-slate-400">
                                Question {currentIndex + 1} of {totalQuestions}
                            </p>
                        </div>

                        {timeLeft !== null && (
                            <div className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-bold ${timeLeft < 60 ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-600"
                                }`}>
                                <Clock size={16} />
                                {formatTime(timeLeft)}
                            </div>
                        )}
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Question */}
            <div className="max-w-3xl mx-auto px-4 py-8">
                {currentQuestion && (
                    <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 md:p-8">
                        {/* Passage (if reading comprehension) */}
                        {currentQuestion.content.passage && (
                            <div className="bg-slate-50 rounded-xl p-4 mb-6 text-sm leading-relaxed border-l-4 border-blue-400">
                                {currentQuestion.content.passage}
                            </div>
                        )}

                        {/* Question prompt */}
                        <h3 className="text-lg md:text-xl font-bold text-brand-dark mb-6">
                            {currentQuestion.content.prompt}
                        </h3>

                        {/* Options */}
                        {currentQuestion.content.options && (
                            <div className="space-y-3">
                                {currentQuestion.content.options.map((option, idx) => {
                                    const isSelected = answers[currentQuestion.question_id] === option;
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleAnswer(option)}
                                            className={`w-full p-4 rounded-xl text-left transition-all border-2 ${isSelected
                                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                                                }`}
                                        >
                                            <span className={`inline-block w-7 h-7 rounded-full mr-3 text-center leading-7 text-sm font-bold ${isSelected
                                                ? "bg-blue-500 text-white"
                                                : "bg-slate-100 text-slate-500"
                                                }`}>
                                                {String.fromCharCode(65 + idx)}
                                            </span>
                                            {option}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between mt-6">
                    <button
                        onClick={handlePrev}
                        disabled={currentIndex === 0}
                        className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-brand-dark disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={20} />
                        Previous
                    </button>

                    {/* Question dots */}
                    <div className="hidden md:flex items-center gap-1">
                        {quiz.questions.map((q, idx) => (
                            <button
                                key={q.question_id}
                                onClick={() => setCurrentIndex(idx)}
                                className={`w-3 h-3 rounded-full transition-all ${idx === currentIndex
                                    ? "bg-blue-500 scale-125"
                                    : answers[q.question_id]
                                        ? "bg-green-400"
                                        : "bg-slate-200"
                                    }`}
                            />
                        ))}
                    </div>

                    {currentIndex === totalQuestions - 1 ? (
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 disabled:opacity-50 transition-all"
                        >
                            {submitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send size={18} />
                            )}
                            Submit
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            className="flex items-center gap-2 px-4 py-2 text-blue-600 font-bold hover:text-blue-700 transition-colors"
                        >
                            Next
                            <ChevronRight size={20} />
                        </button>
                    )}
                </div>

                {/* Answer summary */}
                <div className="mt-8 text-center text-sm text-slate-400">
                    {answeredCount} of {totalQuestions} questions answered
                </div>
            </div>
        </div>
    );
}
