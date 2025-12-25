/**
 * JLPT Service - Frontend API client for JLPT exam functionality
 */

import { ExamAttempt, UserCreatedExam, ExamConfig, Question, SkillBreakdown, UserAnswer } from '@/types/practice';

const API_BASE = '/e-api/v1';

// === Local Storage Helpers ===

const STORAGE_KEYS = {
    attempts: 'hanachan_jlpt_attempts',
    userExams: 'hanachan_jlpt_user_exams',
};

/**
 * Get all attempts from localStorage
 */
export function getLocalAttempts(): ExamAttempt[] {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.attempts);
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
}

/**
 * Save attempt to localStorage
 */
export function saveLocalAttempt(attempt: ExamAttempt): void {
    try {
        const attempts = getLocalAttempts();
        attempts.unshift(attempt); // Add to front (newest first)
        // Keep only last 50 attempts
        const trimmed = attempts.slice(0, 50);
        localStorage.setItem(STORAGE_KEYS.attempts, JSON.stringify(trimmed));
    } catch (e) {
        console.warn('Could not save attempt to localStorage:', e);
    }
}

/**
 * Get all user exams from localStorage
 */
export function getLocalUserExams(): UserCreatedExam[] {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.userExams);
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
}

/**
 * Save user exam to localStorage
 */
export function saveLocalUserExam(exam: UserCreatedExam): void {
    try {
        const exams = getLocalUserExams();
        exams.unshift(exam);
        localStorage.setItem(STORAGE_KEYS.userExams, JSON.stringify(exams));
    } catch (e) {
        console.warn('Could not save exam to localStorage:', e);
    }
}

/**
 * Update user exam in localStorage
 */
export function updateLocalUserExam(examId: string, updates: Partial<UserCreatedExam>): void {
    try {
        const exams = getLocalUserExams();
        const index = exams.findIndex(e => e.id === examId);
        if (index !== -1) {
            exams[index] = { ...exams[index], ...updates };
            localStorage.setItem(STORAGE_KEYS.userExams, JSON.stringify(exams));
        }
    } catch (e) {
        console.warn('Could not update exam in localStorage:', e);
    }
}

/**
 * Delete user exam from localStorage
 */
export function deleteLocalUserExam(examId: string): void {
    try {
        const exams = getLocalUserExams();
        const filtered = exams.filter(e => e.id !== examId);
        localStorage.setItem(STORAGE_KEYS.userExams, JSON.stringify(filtered));
    } catch (e) {
        console.warn('Could not delete exam from localStorage:', e);
    }
}

// === Exam Result Calculation ===

export interface CalculateResultOptions {
    examId: string;
    examTitle: string;
    examMode: 'QUIZ' | 'SINGLE_EXAM' | 'FULL_EXAM';
    level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
    questions: Question[];
    answers: Record<string, UserAnswer>;
    startedAt: Date;
    completedAt: Date;
}

/**
 * Calculate exam result from user answers
 */
export function calculateExamResult(options: CalculateResultOptions): ExamAttempt {
    const { examId, examTitle, examMode, level, questions, answers, startedAt, completedAt } = options;

    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let unansweredQuestions = 0;

    // Track by skill
    const skillStats: Record<string, { total: number; correct: number }> = {};

    for (const question of questions) {
        const skill = question.tags.skills[0] || 'VOCABULARY';
        if (!skillStats[skill]) {
            skillStats[skill] = { total: 0, correct: 0 };
        }
        skillStats[skill].total++;

        const userAnswer = answers[question.id];
        if (!userAnswer || !userAnswer.selectedOptionId) {
            unansweredQuestions++;
        } else if (userAnswer.selectedOptionId === question.correctOptionId) {
            correctAnswers++;
            skillStats[skill].correct++;
        } else {
            incorrectAnswers++;
        }
    }

    const totalQuestions = questions.length;
    const scorePercentage = totalQuestions > 0
        ? Math.round((correctAnswers / totalQuestions) * 100)
        : 0;

    // JLPT passing score is typically 60%
    const passed = scorePercentage >= 60;

    // Calculate time taken
    const timeTakenSeconds = Math.floor(
        (new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000
    );

    // Build skill breakdown
    const skillBreakdown: SkillBreakdown[] = Object.entries(skillStats).map(([skill, stats]) => ({
        skill: skill as 'VOCABULARY' | 'GRAMMAR' | 'READING' | 'LISTENING',
        totalQuestions: stats.total,
        correctAnswers: stats.correct,
        percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    }));

    return {
        id: `attempt-${Date.now()}`,
        nodeId: examId,
        nodeTitle: examTitle,
        mode: examMode as any,
        tags: {
            level: level as any,
            skills: Object.keys(skillStats) as any[],
            origin: 'system'
        },
        totalQuestions,
        correctAnswers,
        incorrectAnswers,
        unansweredQuestions,
        scorePercentage,
        passed,
        startedAt: startedAt.toISOString(),
        completedAt: completedAt.toISOString(),
        timeTakenSeconds,
        skillBreakdown,
        answers,
    } as any;
}

// === API Functions (for authenticated users) ===

/**
 * Fetch user's exam attempts from API
 */
export async function getAttempts(options?: {
    limit?: number;
    offset?: number;
}): Promise<{ attempts: ExamAttempt[]; total: number }> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', String(options.limit));
    if (options?.offset) params.append('offset', String(options.offset));

    const response = await fetch(`${API_BASE}/jlpt/attempts?${params.toString()}`);

    if (!response.ok) {
        throw new Error('Failed to fetch attempts');
    }

    return response.json();
}

/**
 * Save exam attempt to API
 */
export async function saveAttempt(attempt: ExamAttempt): Promise<{ id: string }> {
    const response = await fetch(`${API_BASE}/jlpt/attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attempt),
    });

    if (!response.ok) {
        throw new Error('Failed to save attempt');
    }

    return response.json();
}

/**
 * Fetch user's custom exams from API
 */
export async function getUserExams(options?: {
    limit?: number;
    offset?: number;
}): Promise<{ exams: UserCreatedExam[]; total: number }> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', String(options.limit));
    if (options?.offset) params.append('offset', String(options.offset));

    const response = await fetch(`${API_BASE}/jlpt/exams?${params.toString()}`);

    if (!response.ok) {
        throw new Error('Failed to fetch user exams');
    }

    return response.json();
}

/**
 * Create a new custom exam via API
 */
export async function createExam(exam: {
    config: Omit<ExamConfig, 'id'>;
    questions: Question[];
    origin: 'manual' | 'chatbot';
    isPublic: boolean;
}): Promise<{ id: string }> {
    const response = await fetch(`${API_BASE}/jlpt/exams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exam),
    });

    if (!response.ok) {
        throw new Error('Failed to create exam');
    }

    return response.json();
}

/**
 * Update an existing custom exam
 */
export async function updateExam(
    examId: string,
    updates: Partial<UserCreatedExam>
): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE}/jlpt/exams/${examId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
    });

    if (!response.ok) {
        throw new Error('Failed to update exam');
    }

    return response.json();
}

/**
 * Delete a custom exam
 */
export async function deleteExam(examId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE}/jlpt/exams/${examId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error('Failed to delete exam');
    }

    return response.json();
}

/**
 * Get a specific exam (including public exams)
 */
export async function getExam(examId: string): Promise<UserCreatedExam> {
    const response = await fetch(`${API_BASE}/jlpt/exams/${examId}`);

    if (!response.ok) {
        throw new Error('Exam not found');
    }

    return response.json();
}

// === AI Generation (placeholder) ===

export interface GenerateQuestionsOptions {
    level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
    skills: ('VOCABULARY' | 'GRAMMAR' | 'READING' | 'LISTENING')[];
    count: number;
    prompt?: string;
}

/**
 * Generate questions via AI
 */
export async function generateQuestions(
    options: GenerateQuestionsOptions
): Promise<Question[]> {
    const response = await fetch(`${API_BASE}/jlpt/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
    });

    if (!response.ok) {
        throw new Error('Failed to generate questions');
    }

    const data = await response.json();
    return data.questions;
}
