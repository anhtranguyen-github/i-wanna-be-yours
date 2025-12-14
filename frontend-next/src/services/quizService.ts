/**
 * Quiz Service - Frontend API client for quiz functionality
 */

export interface QuizQuestion {
    question_id: string;
    question_type: string;
    content: {
        prompt: string;
        passage?: string;
        options?: string[];
        correct_answer?: string | string[];
    };
    points: number;
}

export interface Quiz {
    id: string;
    title: string;
    description: string;
    origin: 'system' | 'chatbot' | 'manual';
    jlpt_level: string;
    category: string;
    time_limit_seconds: number | null;
    questions: QuizQuestion[];
    question_count?: number;
    created_at?: string;
}

export interface QuizListItem {
    id: string;
    title: string;
    description: string;
    origin: string;
    jlpt_level: string;
    category: string;
    time_limit_seconds: number | null;
    question_count: number;
    created_at: string;
}

export interface AnswerResult {
    question_id: string;
    user_answer: string | string[] | null;
    is_correct: boolean;
    points_earned: number;
    points_possible: number;
}

export interface WeakItem {
    flashcard_id: string | null;
    learning_point: string;
    question_type: string;
}

export interface QuizSubmissionResult {
    attempt_id: string | null;
    total_score: number;
    max_score: number;
    percentage: number;
    answers: AnswerResult[];
    weak_items: WeakItem[];
    message: string;
}

export interface QuizAttempt {
    id: string;
    quiz_id: string;
    quiz_title: string;
    quiz_origin: string;
    completed_at: string;
    total_score: number;
    max_score: number;
    percentage: number;
    time_spent_seconds: number;
    answers?: AnswerResult[];
    weak_items?: WeakItem[];
}

interface ListQuizzesResponse {
    quizzes: QuizListItem[];
    total: number;
    limit: number;
    offset: number;
}

interface ListAttemptsResponse {
    attempts: QuizAttempt[];
    total: number;
    limit: number;
    offset: number;
}

const API_BASE = '/f-api/v1';

/**
 * Fetch list of available quizzes
 */
export async function getQuizzes(options?: {
    level?: string;
    category?: string;
    origin?: string;
    limit?: number;
    offset?: number;
}): Promise<ListQuizzesResponse> {
    const params = new URLSearchParams();
    if (options?.level) params.append('level', options.level);
    if (options?.category) params.append('category', options.category);
    if (options?.origin) params.append('origin', options.origin);
    if (options?.limit) params.append('limit', String(options.limit));
    if (options?.offset) params.append('offset', String(options.offset));

    const url = `${API_BASE}/quizzes${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error('Failed to fetch quizzes');
    }

    return response.json();
}

/**
 * Fetch a single quiz for taking
 */
export async function getQuiz(quizId: string, includeAnswers = false): Promise<Quiz> {
    const url = `${API_BASE}/quizzes/${quizId}${includeAnswers ? '?include_answers=true' : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error('Quiz not found');
    }

    return response.json();
}

/**
 * Submit quiz answers
 */
export async function submitQuiz(
    quizId: string,
    answers: Record<string, string | string[]>,
    userId?: string,
    startedAt?: string
): Promise<QuizSubmissionResult> {
    const response = await fetch(`${API_BASE}/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_id: userId,
            answers,
            started_at: startedAt,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to submit quiz');
    }

    return response.json();
}

/**
 * Fetch user's quiz attempt history
 */
export async function getAttempts(
    userId: string,
    options?: { limit?: number; offset?: number }
): Promise<ListAttemptsResponse> {
    const params = new URLSearchParams();
    params.append('user_id', userId);
    if (options?.limit) params.append('limit', String(options.limit));
    if (options?.offset) params.append('offset', String(options.offset));

    const response = await fetch(`${API_BASE}/quiz-attempts?${params.toString()}`);

    if (!response.ok) {
        throw new Error('Failed to fetch attempts');
    }

    return response.json();
}

/**
 * Fetch a specific quiz attempt details
 */
export async function getAttempt(attemptId: string): Promise<QuizAttempt> {
    const response = await fetch(`${API_BASE}/quiz-attempts/${attemptId}`);

    if (!response.ok) {
        throw new Error('Attempt not found');
    }

    return response.json();
}

/**
 * Create a custom quiz
 */
export async function createQuiz(quiz: {
    title: string;
    description?: string;
    author_id: string;
    origin?: string;
    jlpt_level?: string;
    category?: string;
    time_limit_seconds?: number;
    is_public?: boolean;
    questions: Array<{
        question_type: string;
        content: {
            prompt: string;
            options?: string[];
            correct_answer: string | string[];
        };
        learning_points?: string[];
        points?: number;
    }>;
}): Promise<{ id: string; message: string }> {
    const response = await fetch(`${API_BASE}/quizzes`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(quiz),
    });

    if (!response.ok) {
        throw new Error('Failed to create quiz');
    }

    return response.json();
}
