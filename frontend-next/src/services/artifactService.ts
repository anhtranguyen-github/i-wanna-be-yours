/**
 * Artifact Service - Frontend API client for artifact management.
 * Communicates with Hanachan backend for CRUD operations on artifacts.
 */

const API_BASE = '/h-api/artifacts';

export interface Artifact {
    _id?: string;
    userId?: string;
    conversationId?: string;
    messageId?: string;
    type: string;
    title: string;
    data: Record<string, any>;
    metadata?: Record<string, any>;
    createdAt?: string;
    updatedAt?: string;
    savedToLibrary?: boolean;
    source?: string;
    actions?: Record<string, boolean>;
}

export interface ArtifactListResponse {
    artifacts: Artifact[];
    count: number;
    skip?: number;
    limit?: number;
}

class ArtifactServiceClass {
    private userId: string | null = null;

    /**
     * Set the current user ID for all requests.
     */
    setUserId(userId: string) {
        this.userId = userId;
    }

    /**
     * Get the current user ID.
     */
    getUserId(): string {
        if (!this.userId) {
            // Try to get from localStorage or default
            this.userId = localStorage.getItem('userId') || 'anonymous';
        }
        return this.userId;
    }

    private getHeaders(): HeadersInit {
        return {
            'Content-Type': 'application/json',
        };
    }

    /**
     * Create a new artifact.
     */
    async createArtifact(
        type: string,
        title: string,
        data: Record<string, any>,
        metadata?: Record<string, any>,
        conversationId?: string
    ): Promise<Artifact> {
        const response = await fetch(API_BASE, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                userId: this.getUserId(),
                type,
                title,
                data,
                metadata: metadata || {},
                conversationId,
                savedToLibrary: false,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to create artifact: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Get artifact by ID.
     */
    async getArtifact(artifactId: string): Promise<Artifact | null> {
        const response = await fetch(`${API_BASE}/${artifactId}?userId=${this.getUserId()}`, {
            headers: this.getHeaders(),
        });

        if (response.status === 404) {
            return null;
        }

        if (!response.ok) {
            throw new Error(`Failed to get artifact: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * List user's artifacts with optional filters.
     */
    async getUserArtifacts(
        type?: string,
        savedOnly?: boolean,
        limit?: number,
        skip?: number
    ): Promise<ArtifactListResponse> {
        const params = new URLSearchParams();
        params.set('userId', this.getUserId());
        if (type) params.set('type', type);
        if (savedOnly) params.set('savedToLibrary', 'true');
        if (limit) params.set('limit', String(limit));
        if (skip) params.set('skip', String(skip));

        const response = await fetch(`${API_BASE}?${params}`, {
            headers: this.getHeaders(),
        });

        if (!response.ok) {
            throw new Error(`Failed to list artifacts: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Get user's flashcard decks (for deck selector).
     */
    async getUserDecks(): Promise<Artifact[]> {
        const result = await this.getUserArtifacts('flashcard_deck', true);
        return result.artifacts;
    }

    /**
     * Save artifact to user's library.
     */
    async saveToLibrary(artifactId: string): Promise<boolean> {
        const response = await fetch(`${API_BASE}/${artifactId}/save`, {
            method: 'PATCH',
            headers: this.getHeaders(),
            body: JSON.stringify({
                userId: this.getUserId(),
            }),
        });

        if (!response.ok) {
            console.error('Failed to save to library:', response.statusText);
            return false;
        }

        const data = await response.json();
        return data.success === true;
    }

    /**
     * Add cards to an existing flashcard deck.
     */
    async addCardsToDeck(deckId: string, cards: Record<string, any>[]): Promise<boolean> {
        const response = await fetch(`${API_BASE}/${deckId}/cards`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                userId: this.getUserId(),
                cards,
            }),
        });

        if (!response.ok) {
            console.error('Failed to add cards to deck:', response.statusText);
            return false;
        }

        const data = await response.json();
        return data.success === true;
    }

    /**
     * Update artifact fields.
     */
    async updateArtifact(artifactId: string, updates: Record<string, any>): Promise<boolean> {
        const response = await fetch(`${API_BASE}/${artifactId}`, {
            method: 'PATCH',
            headers: this.getHeaders(),
            body: JSON.stringify({
                userId: this.getUserId(),
                ...updates,
            }),
        });

        if (!response.ok) {
            console.error('Failed to update artifact:', response.statusText);
            return false;
        }

        const data = await response.json();
        return data.success === true;
    }

    /**
     * Delete artifact.
     */
    async deleteArtifact(artifactId: string): Promise<boolean> {
        const response = await fetch(`${API_BASE}/${artifactId}?userId=${this.getUserId()}`, {
            method: 'DELETE',
            headers: this.getHeaders(),
        });

        if (!response.ok) {
            console.error('Failed to delete artifact:', response.statusText);
            return false;
        }

        const data = await response.json();
        return data.success === true;
    }

    /**
     * Get all artifacts from a conversation.
     */
    async getConversationArtifacts(conversationId: string): Promise<Artifact[]> {
        const response = await fetch(
            `${API_BASE}/conversation/${conversationId}?userId=${this.getUserId()}`,
            {
                headers: this.getHeaders(),
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to get conversation artifacts: ${response.statusText}`);
        }

        const data = await response.json();
        return data.artifacts;
    }

    /**
     * Create a new deck from cards (single flashcard -> new deck).
     */
    async createDeckFromCards(
        title: string,
        cards: Record<string, any>[],
        metadata?: Record<string, any>
    ): Promise<Artifact> {
        return this.createArtifact('flashcard_deck', title, { cards }, metadata);
    }
}

// Export singleton instance
export const artifactService = new ArtifactServiceClass();
