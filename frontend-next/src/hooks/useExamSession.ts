"use client";

import { useState, useCallback, useMemo } from "react";
import { Question, UserAnswer, QuestionStatus, DisplayMode, ExamConfig } from "@/types/practice";

interface UseExamSessionOptions {
    examConfig: ExamConfig;
    questions: Question[];
}

interface UseExamSessionReturn {
    // State
    currentIndex: number;
    answers: Record<string, UserAnswer>;
    flagged: Set<string>;
    displayMode: DisplayMode;
    isSubmitted: boolean;

    // Computed
    currentQuestion: Question | null;
    answeredCount: number;
    flaggedCount: number;
    unansweredCount: number;
    progress: number; // 0-100

    // Actions
    goToQuestion: (index: number) => void;
    goToNext: () => void;
    goToPrevious: () => void;
    selectAnswer: (questionId: string, optionId: string) => void;
    toggleFlag: (questionId: string) => void;
    setDisplayMode: (mode: DisplayMode) => void;
    submit: () => void;
    getQuestionStatus: (questionId: string) => QuestionStatus;

    // Results (after submission)
    calculateResults: () => SessionResults | null;
}

interface SessionResults {
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    unanswered: number;
    scorePercentage: number;
    passed: boolean;
    questionResults: QuestionResult[];
}

interface QuestionResult {
    questionId: string;
    isCorrect: boolean;
    userAnswer: string | null;
    correctAnswer: string;
}

/**
 * Custom hook for managing exam session state
 */
export function useExamSession({
    examConfig,
    questions,
}: UseExamSessionOptions): UseExamSessionReturn {
    // Core State
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, UserAnswer>>({});
    const [flagged, setFlagged] = useState<Set<string>>(new Set());
    const [displayMode, setDisplayMode] = useState<DisplayMode>("FOCUS");
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Current question
    const currentQuestion = useMemo(() => {
        return questions[currentIndex] || null;
    }, [questions, currentIndex]);

    // Counts
    const answeredCount = useMemo(() => {
        return Object.values(answers).filter((a) => a.selectedOptionId).length;
    }, [answers]);

    const flaggedCount = useMemo(() => {
        return flagged.size;
    }, [flagged]);

    const unansweredCount = useMemo(() => {
        return questions.length - answeredCount;
    }, [questions.length, answeredCount]);

    const progress = useMemo(() => {
        if (questions.length === 0) return 0;
        return Math.round((answeredCount / questions.length) * 100);
    }, [answeredCount, questions.length]);

    // Navigation
    const goToQuestion = useCallback(
        (index: number) => {
            if (index >= 0 && index < questions.length) {
                setCurrentIndex(index);
            }
        },
        [questions.length]
    );

    const goToNext = useCallback(() => {
        setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1));
    }, [questions.length]);

    const goToPrevious = useCallback(() => {
        setCurrentIndex((prev) => Math.max(prev - 1, 0));
    }, []);

    // Answer handling
    const selectAnswer = useCallback(
        (questionId: string, optionId: string) => {
            if (isSubmitted) return;

            setAnswers((prev) => ({
                ...prev,
                [questionId]: {
                    questionId,
                    selectedOptionId: optionId,
                    timeSpentSeconds: 0,
                },
            }));
        },
        [isSubmitted]
    );

    // Flag handling
    const toggleFlag = useCallback(
        (questionId: string) => {
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
        },
        [isSubmitted]
    );

    // Get question status
    const getQuestionStatus = useCallback(
        (questionId: string): QuestionStatus => {
            if (flagged.has(questionId)) return "FLAGGED";
            if (answers[questionId]?.selectedOptionId) return "ANSWERED";
            return "UNANSWERED";
        },
        [answers, flagged]
    );

    // Submit
    const submit = useCallback(() => {
        setIsSubmitted(true);
    }, []);

    // Calculate results
    const calculateResults = useCallback((): SessionResults | null => {
        if (!isSubmitted) return null;

        const questionResults: QuestionResult[] = questions.map((q) => {
            const userAnswer = answers[q.id]?.selectedOptionId || null;
            const isCorrect = userAnswer === q.correctOptionId;
            return {
                questionId: q.id,
                isCorrect,
                userAnswer,
                correctAnswer: q.correctOptionId,
            };
        });

        const correctAnswers = questionResults.filter((r) => r.isCorrect).length;
        const incorrectAnswers = questionResults.filter((r) => r.userAnswer && !r.isCorrect).length;
        const unanswered = questionResults.filter((r) => !r.userAnswer).length;

        return {
            totalQuestions: questions.length,
            correctAnswers,
            incorrectAnswers,
            unanswered,
            scorePercentage: Math.round((correctAnswers / questions.length) * 100),
            passed: correctAnswers / questions.length >= 0.6,
            questionResults,
        };
    }, [isSubmitted, questions, answers]);

    return {
        currentIndex,
        answers,
        flagged,
        displayMode,
        isSubmitted,
        currentQuestion,
        answeredCount,
        flaggedCount,
        unansweredCount,
        progress,
        goToQuestion,
        goToNext,
        goToPrevious,
        selectAnswer,
        toggleFlag,
        setDisplayMode,
        submit,
        getQuestionStatus,
        calculateResults,
    };
}
