
import { Artifact } from "@/types/artifact";

const API_BASE = '/h-api';
// Or use the proxy
const API_PROXY = '/h-api';

export const artifactService = {
    async listByConversation(conversationId: string, userId?: string): Promise<Artifact[]> {
        const query = new URLSearchParams();
        if (userId) query.set('userId', userId);

        const res = await fetch(`${API_PROXY}/artifacts/conversation/${conversationId}?${query}`);
        if (!res.ok) throw new Error('Failed to fetch artifacts');

        const data = await res.json();
        return data.artifacts.map((a: any) => ({
            id: a._id,
            type: a.type,
            title: a.title,
            data: a.data,
            metadata: a.metadata || {},
            createdAt: a.createdAt,
            conversationId: a.conversationId,
            messageId: a.messageId,
            savedToLibrary: a.savedToLibrary
        }));
    },

    async get(artifactId: string, userId?: string): Promise<Artifact> {
        const query = new URLSearchParams();
        if (userId) query.set('userId', userId);

        const res = await fetch(`${API_PROXY}/artifacts/${artifactId}?${query}`);
        if (!res.ok) throw new Error('Failed to fetch artifact');

        const a = await res.json();
        return {
            id: a._id,
            type: a.type,
            title: a.title,
            data: a.data,
            metadata: a.metadata || {},
            createdAt: a.createdAt,
            conversationId: a.conversationId,
            messageId: a.messageId,
            savedToLibrary: a.savedToLibrary
        };
    },

    async update(artifactId: string, userId: string, updates: Partial<Artifact>): Promise<void> {
        const res = await fetch(`${API_PROXY}/artifacts/${artifactId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, ...updates })
        });
        if (!res.ok) throw new Error('Failed to update artifact');
    }
};
