/**
 * Strategy Service
 * 
 * Provides APIs for SMART Goals, OKRs, PACT Commitments, 
 * Context Tracking, Priority Matrix, and Review Cycles.
 */

const API_BASE_URL = '/s-api/v1';

export const strategyService = {
    // --- CONTENT MASTERY (PHASE 0) ---
    getMasteryStats: async (userId: string) => {
        const res = await fetch(`${API_BASE_URL}/mastery/stats?user_id=${userId}`);
        return res.json();
    },
    getDueItems: async (userId: string) => {
        const res = await fetch(`${API_BASE_URL}/mastery/due?user_id=${userId}`);
        return res.json();
    },
    startLearning: async (contentType: string, contentId: string, userId: string) => {
        const res = await fetch(`${API_BASE_URL}/mastery/${contentType}/${contentId}/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId })
        });
        return res.json();
    },
    logReview: async (data: {
        user_id: string;
        content_type: string;
        content_id: string;
        is_correct: boolean;
        difficulty: string;
        interaction_type?: string;
    }) => {
        const res = await fetch(`${API_BASE_URL}/mastery/review`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },

    // --- SMART GOALS (PHASE 1) ---
    getSmartGoals: async (userId: string) => {
        const res = await fetch(`${API_BASE_URL}/smart-goals/?user_id=${userId}`);
        return res.json();
    },
    createSmartGoal: async (data: any) => {
        const res = await fetch(`${API_BASE_URL}/smart-goals/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },
    toggleGoalCriteria: async (goalId: string, criteriaId: string) => {
        const res = await fetch(`${API_BASE_URL}/smart-goals/${goalId}/criteria/${criteriaId}/toggle`, {
            method: 'POST'
        });
        return res.json();
    },

    // --- OKRs (PHASE 2) ---
    getOKRs: async (userId: string) => {
        const res = await fetch(`${API_BASE_URL}/okr/objectives?user_id=${userId}`);
        return res.json();
    },
    createOKR: async (data: any) => {
        const res = await fetch(`${API_BASE_URL}/okr/objectives`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },
    refreshOKR: async (okrId: string) => {
        const res = await fetch(`${API_BASE_URL}/okr/objectives/${okrId}/refresh`, {
            method: 'POST'
        });
        return res.json();
    },

    // --- PACT (PHASE 3) ---
    getPactCommitment: async (userId: string) => {
        const res = await fetch(`${API_BASE_URL}/pact/commitment?user_id=${userId}`);
        return res.json();
    },
    upsertPactCommitment: async (data: any) => {
        const res = await fetch(`${API_BASE_URL}/pact/commitment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },
    completePactAction: async (actionId: string, userId: string, data: any) => {
        const res = await fetch(`${API_BASE_URL}/pact/actions/${actionId}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, user_id: userId })
        });
        return res.json();
    },

    getPactDailyStatus: async (userId: string) => {
        const res = await fetch(`${API_BASE_URL}/pact/daily-status?user_id=${userId}`);
        return res.json();
    },

    // --- CONTEXT (PHASE 4) ---
    submitCheckin: async (data: any) => {
        const res = await fetch(`${API_BASE_URL}/context/checkin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },
    getLatestCheckin: async (userId: string) => {
        const res = await fetch(`${API_BASE_URL}/context/checkin/latest?user_id=${userId}`);
        return res.json();
    },
    linkSessionToContext: async (checkinId: string, sessionId: string) => {
        const res = await fetch(`${API_BASE_URL}/context/checkin/${checkinId}/link-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId })
        });
        return res.json();
    },

    // --- PRIORITY MATRIX (PHASE 5) ---
    getPriorityMatrix: async (userId: string) => {
        const res = await fetch(`${API_BASE_URL}/priority-matrix/?user_id=${userId}`);
        return res.json();
    },
    recalculatePriorityMatrix: async (userId: string) => {
        const res = await fetch(`${API_BASE_URL}/priority-matrix/recalculate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId })
        });
        return res.json();
    },

    // --- REVIEWS (PHASE 6) ---
    generateReview: async (userId: string, cycleType: string) => {
        const res = await fetch(`${API_BASE_URL}/reviews/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, cycle_type: cycleType })
        });
        return res.json();
    },
    getLatestReview: async (userId: string, cycleType: string) => {
        const res = await fetch(`${API_BASE_URL}/reviews/latest?user_id=${userId}&cycle_type=${cycleType}`);
        return res.json();
    }
};
