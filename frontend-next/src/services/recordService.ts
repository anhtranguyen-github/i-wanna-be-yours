import { authFetch } from '@/lib/authFetch';
import { v4 as uuidv4 } from 'uuid';
import Cookies from 'js-cookie';

const API_BASE = (process.env.NEXT_PUBLIC_EXPRESS_API_URL || '/e-api') + '/v1';

export interface RecordPayload {
    itemType: 'PRACTICE' | 'FLASHCARD' | 'QUOOT';
    itemId: string;
    itemTitle?: string;
    score?: number;
    status: 'STARTED' | 'COMPLETED' | 'ABANDONED';
    sessionId?: string;
    duration?: number;
    details?: any;
}

export async function saveRecord(payload: RecordPayload) {
    // Check for auth token to identify guest vs user
    const token = typeof window !== 'undefined'
        ? (localStorage.getItem('accessToken') || Cookies.get('accessToken'))
        : null;

    if (!token) {
        // Guest mode: do not save record
        return;
    }

    try {
        await authFetch(`${API_BASE}/records`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            skipAuthCheck: true // Double safety
        } as any);
    } catch (err) {
        console.error('Failed to save record:', err);
    }
}

export async function startSession(itemType: RecordPayload['itemType'], itemId: string, itemTitle?: string) {
    const sessionId = uuidv4();
    const payload: RecordPayload = {
        itemType,
        itemId,
        itemTitle,
        status: 'STARTED',
        sessionId
    };
    await saveRecord(payload);
    return sessionId;
}

export async function fetchHistory(limit = 20, offset = 0) {
    const token = typeof window !== 'undefined'
        ? (localStorage.getItem('accessToken') || Cookies.get('accessToken'))
        : null;

    if (!token) return [];

    const res = await authFetch(`${API_BASE}/records/history?limit=${limit}&offset=${offset}`);
    if (!res.ok) throw new Error('Failed to fetch history');
    return res.json();
}
