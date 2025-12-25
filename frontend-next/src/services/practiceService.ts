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
import * as quizService from './quizService';
import { mockExamConfigs } from '@/data/mockPractice';

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
                : (quiz.stats?.timeLimitMinutes)
        }
    };
};

/**
 * Fetch all nodes from all sources (System Exams, Custom Exams, Quizzes)
 */
export async function getNodes(filters: FilterState): Promise<{ nodes: PracticeNode[], total: number }> {
    try {
        // 1. Fetch from mock for now (System Exams)
        let nodes = mockExamConfigs.map(mapExamToNode);

        // 2. Fetch User Custom Exams (if filters allow)
        if (filters.mode === 'ALL' || filters.mode === 'FULL_EXAM' || filters.mode === 'SINGLE_EXAM') {
            try {
                const userExams = await jlptService.getLocalUserExams();
                nodes = [...nodes, ...userExams.map(e => mapExamToNode(e.config || e))];
            } catch (e) { console.warn('Failed to fetch local user exams:', e); }
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

            const originMatch = !filters.origin || filters.origin === 'ALL' || node.tags.origin === filters.origin;

            return modeMatch && levelMatch && skillMatch && timingMatch && originMatch;
        });

        // 5. Inject Personal Data (Mocking for now)
        const attempts = jlptService.getLocalAttempts();
        filteredNodes = filteredNodes.map(node => {
            const nodeAttempts = (attempts as any[]).filter(a => (a.nodeId || a.examId) === node.id);
            if (nodeAttempts.length > 0) {
                const best = Math.max(...nodeAttempts.map(a => a.scorePercentage));
                return {
                    ...node,
                    personalData: {
                        hasCompleted: true,
                        bestScore: best,
                        attemptCount: nodeAttempts.length,
                        status: best >= 60 ? 'PASSED' : 'FAILED',
                        lastAttemptedAt: nodeAttempts[0].completedAt
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
export async function getNodeSessionData(id: string, mode: PracticeMode): Promise<{ node: PracticeNode, questions: Question[] }> {
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
        // JLPT logic
        const mockConfig = mockExamConfigs.find(e => e.id === id);
        if (mockConfig) {
            const node = mapExamToNode(mockConfig);
            // We'd need the generateMockQuestions logic here or imported
            const questions = await import('@/data/mockPractice').then(m => m.getQuestionsForExam(id));
            return { node, questions };
        }
        throw new Error('Node not found');
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
        jlptService.saveLocalAttempt(attempt as any);
    }
}
