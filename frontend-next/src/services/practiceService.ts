/**
 * Practice Service - Unified API client for practice nodes
 * Connects to the new unified /e-api/v1/practice/* endpoints
 */

import {
    PracticeNode,
    PracticeAttempt,
    Question,
    FilterState
} from '@/types/practice';
import { authFetch } from '@/lib/authFetch';
import Cookies from 'js-cookie';

const API_BASE = '/e-api/v1/practice';

/**
 * Fetch all practice nodes with optional filtering
 */
export async function getNodes(
    filters: FilterState,
    isAuthenticated: boolean = false
): Promise<{ nodes: PracticeNode[], total: number }> {
    try {
        const params = new URLSearchParams();

        // Visibility filter
        if (filters.access && filters.access !== 'ALL') {
            params.append('visibility', filters.access.toLowerCase());
        }

        // Add filters
        if (filters.levels && filters.levels.length > 0) {
            params.append('levels', filters.levels.join(','));
        }
        if (filters.mode && filters.mode !== 'ALL') {
            params.append('mode', filters.mode);
        }
        if (filters.skills && filters.skills.length > 0) {
            params.append('skills', filters.skills.join(','));
        }

        const url = `${API_BASE}/nodes${params.toString() ? '?' + params.toString() : ''}`;
        const response = await authFetch(url);

        if (!response.ok) {
            console.error('Failed to fetch practice nodes:', response.status);
            return { nodes: [], total: 0 };
        }

        const data = await response.json();

        // Inject personal data if authenticated
        let nodes: PracticeNode[] = data.nodes || [];

        if (isAuthenticated && nodes.length > 0) {
            try {
                const attemptsResponse = await authFetch(`${API_BASE}/attempts`);
                if (attemptsResponse.ok) {
                    const attemptsData = await attemptsResponse.json();
                    const attempts = attemptsData.attempts || [];

                    nodes = nodes.map(node => {
                        const nodeAttempts = attempts.filter((a: any) => a.nodeId === node.id);
                        if (nodeAttempts.length > 0) {
                            const best = Math.max(...nodeAttempts.map((a: any) => a.percentage));
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
                }
            } catch (e) {
                console.warn('Failed to fetch attempts:', e);
            }
        }

        return {
            nodes,
            total: data.total || nodes.length
        };
    } catch (error) {
        console.error('Error fetching practice nodes:', error);
        return { nodes: [], total: 0 };
    }
}

/**
 * Fetch a specific node with its questions for a practice session
 */
export async function getNodeSessionData(id: string): Promise<{ node: PracticeNode, questions: Question[] }> {
    const response = await authFetch(`${API_BASE}/nodes/${id}`);

    if (!response.ok) {
        throw new Error('Practice node not found');
    }

    const data = await response.json();

    return {
        node: data.node,
        questions: data.questions
    };
}

/**
 * Submit an attempt for a practice node
 */
export async function saveAttempt(attempt: PracticeAttempt): Promise<{
    attemptId: string;
    result: any;
}> {
    // GUEST HANDLING
    const token = typeof window !== 'undefined' ? (localStorage.getItem('accessToken') || Cookies.get('accessToken')) : null;
    if (!token) {
        try {
            // Re-fetch questions to grade securely (or reliably)
            const { questions } = await getNodeSessionData(attempt.nodeId);
            let correct = 0;
            const total = questions.length;

            Object.values(attempt.answers).forEach(ans => {
                const q = questions.find(q => q.id === ans.questionId);
                if (q && q.correctOptionId === ans.selectedOptionId) {
                    correct++;
                }
            });

            const percentage = Math.round((correct / total) * 100) || 0;
            const isPassed = percentage >= 60;

            const mockResult = {
                score: correct * 10, // Mock score
                rank: percentage >= 90 ? 'S' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 60 ? 'C' : 'D',
                correctCount: correct,
                totalCards: total,
                maxStreak: 0,
                xpEarned: 0,
                coinsEarned: 0,
                streakExtended: false,
                stats: [
                    { label: "Accuracy", value: `${percentage}%`, icon: "Target" },
                    { label: "Completion", value: `${correct}/${total}`, icon: "CheckCircle2" },
                    { label: "Time", value: `${attempt.timeTakenSeconds}s`, icon: "Clock" }
                ],
                achievements: [],
                feedback: {
                    title: isPassed ? "Neural Convergence" : "System Recalibration",
                    message: isPassed ? "Your cognitive patterns show strong alignment with the target syllabus. Stability is optimal." : "Pattern recognition is below threshold. Recommend iterative reinforcement protocols.",
                    suggestions: [
                        "Examine the 'Optimization Vectors' below for specific breakdowns",
                        "Use FOCUS mode to minimize linguistic noise during sessions",
                        "Sign in to unlock achievement commendations"
                    ]
                },
                answers: Object.values(attempt.answers).map(a => {
                    const q = questions.find(q => q.id === a.questionId);
                    return {
                        questionId: a.questionId,
                        isCorrect: q?.correctOptionId === a.selectedOptionId,
                        selectedOptionId: a.selectedOptionId
                    };
                })
            };

            if (typeof window !== 'undefined') {
                sessionStorage.setItem('guest-practice-result', JSON.stringify(mockResult));
            }

            return {
                attemptId: 'guest-attempt',
                result: mockResult
            };
        } catch (e) {
            console.error("Guest grading failed", e);
            // Fallback
            return { attemptId: 'guest-attempt', result: { percentage: 0 } };
        }
    }

    const response = await authFetch(`${API_BASE}/nodes/${attempt.nodeId}/submit`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            answers: Object.values(attempt.answers).map(a => ({
                questionId: a.questionId,
                selectedOptionId: a.selectedOptionId
            })),
            timeSpentSeconds: attempt.timeTakenSeconds || 0
        })
    });

    if (!response.ok) {
        throw new Error('Failed to save attempt');
    }

    return response.json();
}

/**
 * Get a specific attempt's unified result
 */
export async function getAttemptResult(attemptId: string): Promise<any> {
    if (attemptId === 'guest-attempt') {
        if (typeof window !== 'undefined') {
            const stored = sessionStorage.getItem('guest-practice-result');
            if (stored) return JSON.parse(stored);
        }
        return { percentage: 0 };
    }

    const response = await authFetch(`${API_BASE}/attempts/${attemptId}`);
    if (!response.ok) {
        throw new Error('Failed to fetch attempt result');
    }
    return response.json();
}

/**
 * Get user's attempt history
 */
export async function getAttempts(): Promise<{ attempts: any[], total: number }> {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('accessToken') || Cookies.get('accessToken')) : null;
    if (!token) return { attempts: [], total: 0 };

    const response = await authFetch(`${API_BASE}/attempts`);

    if (!response.ok) {
        throw new Error('Failed to fetch attempts');
    }

    return response.json();
}

/**
 * Create a new practice node
 */
export async function createNode(node: {
    title: string;
    description?: string;
    mode?: string;
    levels?: string[];
    skills?: string[];
    timeLimitMinutes?: number;
    questions: Array<{
        content: string;
        options: Array<{ id: string; text: string }>;
        correctOptionId: string;
        explanation?: string;
    }>;
    isPublic?: boolean;
}): Promise<{ id: string }> {
    const response = await authFetch(`${API_BASE}/nodes`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(node)
    });

    if (!response.ok) {
        throw new Error('Failed to create practice node');
    }

    return response.json();
}

/**
 * Delete a practice node
 */
export async function deleteNode(id: string): Promise<void> {
    const response = await authFetch(`${API_BASE}/nodes/${id}`, {
        method: 'DELETE'
    });

    if (!response.ok) {
        throw new Error('Failed to delete practice node');
    }
}

/**
 * Update an existing practice node
 */
export async function updateNode(id: string, updates: Partial<PracticeNode>): Promise<{ id: string }> {
    const response = await authFetch(`${API_BASE}/nodes/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
    });

    if (!response.ok) {
        throw new Error('Failed to update practice node');
    }

    return response.json();
}

/**
 * Clone a practice node to user's collection
 */
export async function cloneNode(id: string): Promise<{ id: string; message: string }> {
    const response = await authFetch(`${API_BASE}/nodes/${id}/clone`, {
        method: 'POST'
    });

    if (!response.ok) {
        throw new Error('Failed to clone practice node');
    }

    return response.json();
}

/**
 * Get user's custom tags from practice nodes
 */
export async function getPracticeMyTags(): Promise<{ tags: string[] }> {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('accessToken') || Cookies.get('accessToken')) : null;
    if (!token) return { tags: [] };

    const response = await authFetch(`${API_BASE}/my-tags`);

    if (!response.ok) {
        throw new Error('Failed to fetch custom tags');
    }

    return response.json();
}

// Export as object for named import compatibility
export const practiceService = {
    getNodes,
    getNodeSessionData,
    saveAttempt,
    getAttemptResult,
    getAttempts,
    createNode,
    deleteNode,
    updateNode,
    cloneNode,
    getPracticeMyTags
};

