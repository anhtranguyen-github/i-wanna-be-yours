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

        // Determine public vs personal
        if (filters.access === 'PERSONAL' && isAuthenticated) {
            // Fetching personal nodes - don't add is_public
        } else {
            params.append('is_public', 'true');
        }

        // Add filters
        if (filters.level && filters.level !== 'ALL') {
            params.append('level', filters.level);
        }
        if (filters.mode && filters.mode !== 'ALL') {
            params.append('mode', filters.mode);
        }
        if (filters.skill && filters.skill !== 'ALL') {
            params.append('skill', filters.skill);
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
    score: number;
    maxScore: number;
    percentage: number;
    status: string;
}> {
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
 * Get user's attempt history
 */
export async function getAttempts(): Promise<{ attempts: any[], total: number }> {
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
    level?: string;
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

// Export as object for named import compatibility
export const practiceService = {
    getNodes,
    getNodeSessionData,
    saveAttempt,
    getAttempts,
    createNode,
    deleteNode
};
