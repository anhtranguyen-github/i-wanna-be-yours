/**
 * Practice Service - Unified API client for all practice nodes (JLPT & Quiz)
 */

import {
    PracticeNode,
    PracticeAttempt,
    Question,
    FilterState,
    PracticeMode,
    JLPTLevel,
    SkillType,
    PracticeAttempt as EvaluationResult
} from '@/types/practice';
import * as jlptService from './jlptService';
export { jlptService };
import * as quizService from './quizService';
import { authFetch } from '@/lib/authFetch';

// Migration/Helper: Map ExamConfig to PracticeNode
export const mapExamToNode = (exam: any): PracticeNode => {
    // If it's already a PracticeNode structure, just return it (or shallow copy)
    if (exam.tags && exam.stats) {
        return exam as PracticeNode;
    }

    return {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        mode: exam.mode,
        tags: {
            level: exam.level || exam.tags?.level || 'N3',
            skills: exam.skills || exam.tags?.skills || [],
            origin: exam.origin || exam.tags?.origin || 'system',
            isStrict: exam.mode === 'FULL_EXAM'
        },
        stats: {
            questionCount: exam.questionCount || exam.stats?.questionCount || 0,
            timeLimitMinutes: exam.timeLimitMinutes || exam.stats?.timeLimitMinutes,
        },
        segments: (exam.sections || exam.segments)?.map((s: any) => ({
            id: s.id,
            title: s.name || s.title,
            skills: s.skills || (s.skill ? [s.skill] : []),
            questionCount: s.questionCount,
            timeLimitMinutes: s.timeLimitMinutes,
            breakAfterMinutes: s.breakAfterMinutes
        }))
    };
};

// Migration/Helper: Map QuizListItem to PracticeNode
export const mapQuizToNode = (quiz: any): PracticeNode => {
    if (quiz.tags && quiz.stats) return quiz as PracticeNode;

    return {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        mode: 'QUIZ',
        tags: {
            level: (quiz.jlpt_level || quiz.tags?.level) as JLPTLevel,
            skills: (quiz.tags?.skills || [quiz.category as SkillType]),
            category: quiz.category || quiz.tags?.category,
            origin: (quiz.origin || quiz.tags?.origin || 'system') as any
        },
        stats: {
            questionCount: quiz.question_count || quiz.stats?.questionCount || 0,
            timeLimitSeconds: quiz.time_limit_seconds || quiz.stats?.timeLimitSeconds,
            timeLimitMinutes: (quiz.time_limit_seconds || quiz.stats?.timeLimitSeconds)
                ? Math.floor((quiz.time_limit_seconds || quiz.stats?.timeLimitSeconds) / 60)
                : (quiz.stats?.questionCount) ? Math.floor(quiz.stats.questionCount * 1.5) : 30 // Fallback
        }
    };
};

/**
 * Fetch all nodes from all sources (System Exams, Custom Exams, Quizzes)
 * @param filters - Filter criteria
 * @param isAuthenticated - If true, fetch user-specific data (exams and attempts)
 */
export async function getNodes(filters: FilterState, isAuthenticated: boolean = false): Promise<{ nodes: PracticeNode[], total: number }> {
    try {
        // 1. Fetch System Exams from API
        let nodes: PracticeNode[] = [];
        try {
            const systemExamsResponse = await authFetch('/e-api/v1/jlpt/exams?is_public=true');
            if (systemExamsResponse.ok) {
                const data = await systemExamsResponse.json();
                nodes = data.exams.map(mapExamToNode);
            }
        } catch (e) {
            console.warn('Failed to fetch system exams from API:', e);
        }

        // 2. Fetch User Custom Exams (only if authenticated and filters allow)
        if (isAuthenticated && (filters.mode === 'ALL' || filters.mode === 'FULL_EXAM' || filters.mode === 'SINGLE_EXAM')) {
            try {
                const userExams = await jlptService.getUserExams();
                const userNodes = userExams.exams.map(e => mapExamToNode(e.config || e));
                const existingIds = new Set(nodes.map(n => n.id));
                nodes = [...nodes, ...userNodes.filter(n => !existingIds.has(n.id))];
            } catch (e) { console.warn('Failed to fetch user exams:', e); }
        }

        // 3. Fetch System Quizzes (if filters allow)
        if (filters.mode === 'ALL' || filters.mode === 'QUIZ') {
            try {
                const quizResponse = await quizService.getQuizzes({
                    level: filters.level === 'ALL' ? undefined : filters.level,
                    category: filters.skill === 'ALL' ? undefined : filters.skill,
                });
                nodes = [...nodes, ...quizResponse.quizzes.map(mapQuizToNode)];
            } catch (e) { console.warn('Failed to fetch quizzes:', e); }
        }

        // 4. Apply filters (Post-fetch filtering for combined results)
        let filteredNodes = nodes.filter(node => {
            const modeMatch = filters.mode === 'ALL' || node.mode === filters.mode;
            const levelMatch = filters.level === 'ALL' || node.tags.level === filters.level;
            const skillMatch = filters.skill === 'ALL' || node.tags.skills.includes(filters.skill as SkillType);

            // Advanced filters
            const timingMatch = !filters.timing || filters.timing === 'ALL' ||
                (filters.timing === 'TIMED' ? !!node.stats.timeLimitMinutes : !node.stats.timeLimitMinutes);

            const originMatch = !filters.origin || filters.origin === 'ALL' ||
                (filters.origin === 'system' ? node.tags.origin === 'system' : node.tags.origin !== 'system');

            return modeMatch && levelMatch && skillMatch && timingMatch && originMatch;
        });

        // 5. Inject Personal Data (only if authenticated)
        if (isAuthenticated) {
            try {
                const { attempts } = await jlptService.getAttempts();
                filteredNodes = filteredNodes.map(node => {
                    const nodeAttempts = (attempts as any[]).filter(a => (a.nodeId || a.examId) === node.id);
                    if (nodeAttempts.length > 0) {
                        const best = Math.max(...nodeAttempts.map(a => a.scorePercentage));
                        const lastAttempt = nodeAttempts[nodeAttempts.length - 1];
                        return {
                            ...node,
                            personalData: {
                                hasCompleted: true,
                                bestScore: best,
                                attemptCount: nodeAttempts.length,
                                status: best >= 60 ? 'PASSED' : 'FAILED',
                                lastAttemptedAt: lastAttempt.completedAt
                            }
                        };
                    }
                    return {
                        ...node,
                        personalData: {
                            hasCompleted: false,
                            attemptCount: 0,
                            status: 'NEW'
                        }
                    };
                });
            } catch (e) {
                console.warn('Failed to fetch attempts from API:', e);
            }
        }

        return {
            nodes: filteredNodes,
            total: filteredNodes.length
        };
    } catch (error) {
        console.error('Error fetching practice nodes:', error);
        return { nodes: [], total: 0 };
    }
}

/**
 * Fetch a specific node and its questions
 */
export async function getNodeSessionData(id: string, mode?: PracticeMode): Promise<{ node: PracticeNode, questions: Question[] }> {
    // This would typically involve fetching metadata then questions
    // For now, using legacy logic
    if (id.startsWith('quiz-') || mode === 'QUIZ') {
        const quiz = await quizService.getQuiz(id);
        const node = mapQuizToNode(quiz);
        // Map QuizQuestion to Practice Question structure
        const questions: Question[] = quiz.questions.map(q => ({
            id: q.question_id,
            type: q.question_type as any,
            content: q.content.prompt,
            passage: q.content.passage,
            options: q.content.options?.map((opt, i) => ({ id: `${q.question_id}-${i}`, text: opt })) || [],
            correctOptionId: String(q.content.correct_answer), // Note: Simplified
            explanation: '',
            tags: node.tags
        }));
        return { node, questions };
    } else {
        // JLPT logic (System or User Exams)
        try {
            const exam = await jlptService.getExam(id);
            const node = mapExamToNode(exam.config || exam);
            return { node, questions: exam.questions };
        } catch (e) {
            console.error("Failed to fetch exam session data:", e);
            throw new Error('Exam not found');
        }
    }
}

/**
 * Save an attempt
 */
export async function saveAttempt(attempt: PracticeAttempt): Promise<void> {
    if (attempt.mode === 'QUIZ') {
        // Map to submission format
        const quizAnswers: Record<string, string | string[]> = {};
        Object.values(attempt.answers).forEach(a => {
            if (a.selectedOptionId) quizAnswers[a.questionId] = a.selectedOptionId;
        });
        await quizService.submitQuiz(attempt.nodeId, quizAnswers);
    } else {
        await jlptService.saveAttempt(attempt as any);
    }
}

export const practiceService = {
    getNodes,
    getNodeSessionData,
    saveAttempt,
    mapExamToNode,
    mapQuizToNode,
    jlptService
};
