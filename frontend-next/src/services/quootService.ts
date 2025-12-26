import { authFetch } from '@/lib/authFetch';

const API_BASE = '/e-api/v1/quoot';

export async function fetchQuootDecks() {
    const response = await authFetch(`${API_BASE}/decks`);
    if (!response.ok) throw new Error('Failed to fetch quoot decks');
    return response.json();
}

export async function fetchQuootDeckById(id: string) {
    const response = await authFetch(`${API_BASE}/decks/${id}`);
    if (!response.ok) throw new Error('Failed to fetch quoot deck');
    return response.json();
}

export async function createQuootDeck(deck: any) {
    const response = await authFetch(`${API_BASE}/decks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deck)
    });
    if (!response.ok) throw new Error('Failed to create quoot deck');
    return response.json();
}
