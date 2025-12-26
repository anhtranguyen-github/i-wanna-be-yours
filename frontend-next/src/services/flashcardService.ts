import { authFetch } from '@/lib/authFetch';

const API_BASE = '/e-api/v1/flashcards';

class FlashcardService {
    // Deck Management
    async fetchFlashcardDecks() {
        const response = await authFetch(`${API_BASE}/decks`);
        if (!response.ok) throw new Error('Failed to fetch flashcard decks');
        return response.json();
    }

    async fetchFlashcardDeckById(id: string) {
        const response = await authFetch(`${API_BASE}/decks/${id}`);
        if (!response.ok) throw new Error('Failed to fetch flashcard deck');
        return response.json();
    }

    async createFlashcardDeck(deck: any) {
        const response = await authFetch(`${API_BASE}/decks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(deck)
        });
        if (!response.ok) throw new Error('Failed to create flashcard deck');
        return response.json();
    }

    // --- Study & SRS ---

    async getDueFlashcards() {
        // Updated to use Express endpoint
        const response = await authFetch(`${API_BASE}/study/due`);
        if (!response.ok) throw new Error('Failed to fetch due cards');
        return response.json();
    }

    async answerCard(cardId: string, quality: number) {
        // Updated to use Express endpoint
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

// Individual exports for components that prefer them
export const fetchFlashcardDecks = () => flashcardService.fetchFlashcardDecks();
export const fetchFlashcardDeckById = (id: string) => flashcardService.fetchFlashcardDeckById(id);
export const createFlashcardDeck = (deck: any) => flashcardService.createFlashcardDeck(deck);
