import { authFetch } from '@/lib/authFetch';

const API_BASE = '/e-api/v1/flashcards';

class FlashcardService {
    // Set Management
    async fetchFlashcardSets() {
        const response = await authFetch(`${API_BASE}/sets`);
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

    async getDueFlashcards() {
        const response = await authFetch(`${API_BASE}/study/due`);
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
}

export const flashcardService = new FlashcardService();

export const fetchFlashcardSets = () => flashcardService.fetchFlashcardSets();
export const fetchFlashcardSetById = (id: string) => flashcardService.fetchFlashcardSetById(id);
export const createFlashcardSet = (set: any) => flashcardService.createFlashcardSet(set);
