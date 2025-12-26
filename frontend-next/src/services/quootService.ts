import { authFetch } from '@/lib/authFetch';

const API_BASE = '/e-api/v1/quoot';

export async function fetchQuootArenas() {
    const response = await authFetch(`${API_BASE}/arenas`);
    if (!response.ok) throw new Error('Failed to fetch quoot arenas');
    return response.json();
}

export async function fetchQuootArenaById(id: string) {
    const response = await authFetch(`${API_BASE}/arenas/${id}`);
    if (!response.ok) throw new Error('Failed to fetch quoot arena');
    return response.json();
}

export async function createQuootArena(arena: any) {
    const response = await authFetch(`${API_BASE}/arenas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(arena)
    });
    if (!response.ok) throw new Error('Failed to create quoot arena');
    return response.json();
}

export async function submitQuootResult(arenaId: string, result: {
    score: number;
    correctCount: number;
    maxStreak: number;
    totalCards: number;
}) {
    const response = await authFetch(`${API_BASE}/arenas/${arenaId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
    });
    if (!response.ok) throw new Error('Failed to submit quoot result');
    return response.json();
}

export async function fetchQuootAttemptResult(attemptId: string) {
    const response = await authFetch(`${API_BASE}/attempts/${attemptId}`);
    if (!response.ok) throw new Error('Failed to fetch quoot attempt result');
    return response.json();
}

export const quootService = {
    fetchQuootArenas,
    fetchQuootArenaById,
    createQuootArena,
    submitQuootResult,
    fetchQuootAttemptResult
};
