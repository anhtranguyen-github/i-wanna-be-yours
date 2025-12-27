import { authFetch } from '@/lib/authFetch';
import Cookies from 'js-cookie';

const API_BASE = '/e-api/v1/flashcards';

class FlashcardService {
    // Set Management
    async fetchFlashcardSets(filters?: { levels?: string[]; skills?: string[]; access?: string }) {
        const params = new URLSearchParams();
        if (filters?.levels?.length) params.append('levels', filters.levels.join(','));
        if (filters?.skills?.length) params.append('skills', filters.skills.join(','));
        if (filters?.access && filters.access !== 'ALL') params.append('visibility', filters.access.toLowerCase());

        const response = await authFetch(`${API_BASE}/sets?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch flashcard sets');
        return response.json();
    }

    async fetchFlashcardSetById(id: string) {
        const response = await authFetch(`${API_BASE}/sets/${id}`);
        if (!response.ok) throw new Error('Failed to fetch flashcard set');
        return response.json();
    }

    async createFlashcardSet(set: any) {
        const response = await authFetch(`${API_BASE}/sets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(set)
        });
        if (!response.ok) throw new Error('Failed to create flashcard set');
        return response.json();
    }

    // --- Study & SRS ---

    async getDueFlashcards(deckId?: string) {
        const params = new URLSearchParams();
        if (deckId) params.append('deckId', deckId);

        const response = await authFetch(`${API_BASE}/study/due?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch due cards');
        return response.json();
    }

    async answerCard(cardId: string, quality: number) {
        const response = await authFetch(`${API_BASE}/study/answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cardId, quality })
        });
        if (!response.ok) throw new Error('Failed to submit answer');
        return response.json();
    }
    async deletePersonalCard(id: string) {
        const response = await authFetch(`${API_BASE}/cards/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete card');
        return response.json();
    }
    async updatePersonalCard(id: string, updates: any) {
        const response = await authFetch(`${API_BASE}/cards/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        if (!response.ok) throw new Error('Failed to update card');
        return response.json();
    }

    async createPersonalCard(card: { front: string; back: string; tags: string[] }) {
        const response = await authFetch(`${API_BASE}/cards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(card)
        });
        if (!response.ok) throw new Error('Failed to create card');
        return response.json();
    }

    async updateFlashcardSet(id: string, updates: any) {
        const response = await authFetch(`${API_BASE}/sets/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        if (!response.ok) throw new Error('Failed to update flashcard set');
        return response.json();
    }

    async cloneFlashcardSet(id: string): Promise<{ id: string; message: string }> {
        const response = await authFetch(`${API_BASE}/sets/${id}/clone`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error('Failed to clone flashcard set');
        return response.json();
    }

    async deleteFlashcardSet(id: string) {
        const response = await authFetch(`${API_BASE}/sets/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete flashcard set');
        return response.json();
    }

    async getMyTags(): Promise<{ tags: string[] }> {
        const response = await authFetch(`${API_BASE}/my-tags`);
        if (!response.ok) throw new Error('Failed to fetch custom tags');
        return response.json();
    }
}

export const flashcardService = new FlashcardService();

export const fetchFlashcardSets = (filters?: { levels?: string[]; skills?: string[]; access?: string }) => flashcardService.fetchFlashcardSets(filters);
export const fetchFlashcardSetById = (id: string) => flashcardService.fetchFlashcardSetById(id);
export const fetchDeckById = fetchFlashcardSetById; // Alias for backward compatibility
export const createFlashcardSet = (set: any) => flashcardService.createFlashcardSet(set);
export const updateFlashcardSet = (id: string, updates: any) => flashcardService.updateFlashcardSet(id, updates);
export const cloneFlashcardSet = (id: string) => flashcardService.cloneFlashcardSet(id);
export const deleteFlashcardSet = (id: string) => flashcardService.deleteFlashcardSet(id);
export const getFlashcardMyTags = () => flashcardService.getMyTags();


