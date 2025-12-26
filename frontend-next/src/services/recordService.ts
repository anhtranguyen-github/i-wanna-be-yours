import { authFetch } from '@/lib/authFetch';
const API_BASE = (process.env.NEXT_PUBLIC_EXPRESS_API_URL || '/e-api') + '/v1';

export interface RecordPayload {
    itemType: 'PRACTICE' | 'FLASHCARD' | 'QUOOT';
    itemId: string;
    itemTitle?: string;
    score?: number;
    status: 'COMPLETED' | 'ABANDONED';
    details?: any;
}

export async function saveRecord(payload: RecordPayload) {
    try {
        await authFetch(`${API_BASE}/records`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (err) {
        console.error('Failed to save record:', err);
    }
}

export async function fetchHistory(limit = 20, offset = 0) {
    const res = await authFetch(`${API_BASE}/records/history?limit=${limit}&offset=${offset}`);
    if (!res.ok) throw new Error('Failed to fetch history');
    return res.json();
}
