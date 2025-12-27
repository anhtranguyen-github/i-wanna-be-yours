import { authFetch } from '@/lib/authFetch';

const API_BASE = '/e-api/v1/share';

class ShareService {
    /**
     * Generate a shareable link for a content item
     */
    async generateShareLink(type: 'flashcard-deck' | 'practice-arena' | 'quoot-arena', id: string, expiresInHours?: number) {
        const response = await authFetch(`${API_BASE}/${type}/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ expiresInHours })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to generate share link');
        }

        return response.json();
    }

    /**
     * Resolve a share link to get content data
     */
    async resolveShare(shareId: string) {
        const response = await authFetch(`${API_BASE}/${shareId}`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to resolve share link');
        }

        return response.json();
    }
}

export const shareService = new ShareService();
export default shareService;
