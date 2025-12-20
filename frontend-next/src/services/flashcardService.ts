import Cookies from 'js-cookie';

const API_BASE_URL = '/f-api';

class FlashcardService {

    // Auth Helper
    private async getCurrentUser() {
        try {
            const res = await fetch('/api/auth/me'); // Assuming next-auth internal API
            if (!res.ok) return null;
            const data = await res.json();
            return data.user;
        } catch (e) {
            console.error("Failed to get current user", e);
            return null;
        }
    }

    // --- Personal Cards ---

    async createPersonalCard(card: { front: string; back: string; tags?: string[]; deck_name?: string }) {
        const user = await this.getCurrentUser();
        if (!user) throw new Error("User must be logged in");

        // Determine type from tags (first category tag found)
        const categoryTags = ['kanji', 'vocabulary', 'grammar'];
        const cardType = card.tags?.find(t => categoryTags.includes(t)) || 'vocabulary';

        const payload = {
            userId: user.id,
            front: card.front,
            back: card.back,
            type: cardType,
            deck_name: card.deck_name || 'Inbox',
            tags: card.tags || [],
            creator: 'user'
        };

        const res = await fetch(`/f-api/v1/cards/personal`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to create card');
        }

        return await res.json();
    }

    async updatePersonalCard(id: string, updates: any) {
        const res = await fetch(`/f-api/v1/cards/personal/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        if (!res.ok) throw new Error('Failed to update card');
        return await res.json();
    }

    async deletePersonalCard(id: string) {
        const res = await fetch(`/f-api/v1/cards/personal/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Failed to delete card');
        return await res.json();
    }

    // --- Study ---

    async getDueFlashcards() {
        const user = await this.getCurrentUser();
        if (!user) {
            // Guest mode: return sample deck
            console.log("Guest user: fetching sample deck");
            const res = await fetch(`/f-api/v1/public/sample`);
            if (!res.ok) throw new Error('Failed to fetch sample cards');
            return await res.json();
        }

        const res = await fetch(`/f-api/v1/study/due?userId=${user.id}`);
        if (!res.ok) throw new Error('Failed to fetch due cards');

        return await res.json();
    }

    async answerCard(cardId: string, quality: number) {
        const user = await this.getCurrentUser();
        // user check optional if backend doesn't require it for answer (we use cardId), 
        // but cleaner to ensure auth

        const res = await fetch(`/f-api/v1/study/answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cardId, quality })
        });
        if (!res.ok) throw new Error('Failed to submit answer');
        return await res.json();
    }
}

export const flashcardService = new FlashcardService();
