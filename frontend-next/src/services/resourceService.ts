
import { authFetch } from '@/lib/authFetch';

const FLASK_API = '/f-api';

export interface Resource {
    id: string;
    userId?: string;
    title: string;
    description?: string;
    type: 'document' | 'image' | 'audio';
    mimeType?: string;
    fileSize?: number;
    filePath?: string;
    tags?: string[];
    createdAt?: string;
    updatedAt?: string;
    ingestionStatus?: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface ResourceListResponse {
    resources: Resource[];
    total: number;
    limit: number;
    offset: number;
}

export const resourceService = {
    async upload(file: File, userId?: string, tags?: string[]): Promise<Resource> {
        const formData = new FormData();
        formData.append('file', file);
        if (userId) formData.append('userId', userId);
        if (tags) {
            tags.forEach(t => formData.append('tags', t));
        }

        const res = await authFetch(`${FLASK_API}/v1/resources/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: 'Upload failed' }));
            throw new Error(error.error || 'Upload failed');
        }
        return res.json();
    },

    async list(params?: { userId?: string; type?: string; limit?: number; offset?: number }): Promise<ResourceListResponse> {
        const query = new URLSearchParams();
        if (params?.userId) query.set('userId', params.userId);
        if (params?.type) query.set('type', params.type);
        if (params?.limit) query.set('limit', String(params.limit));
        if (params?.offset) query.set('offset', String(params.offset));

        const res = await authFetch(`${FLASK_API}/v1/resources?${query}`);
        if (!res.ok) throw new Error('Failed to fetch resources');
        return res.json();
    },

    async get(id: string): Promise<Resource> {
        const res = await authFetch(`${FLASK_API}/v1/resources/${id}`);
        if (!res.ok) throw new Error('Resource not found');
        return res.json();
    },

    async update(id: string, data: Partial<Resource>): Promise<void> {
        const res = await authFetch(`${FLASK_API}/v1/resources/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Update failed');
    },

    async delete(id: string): Promise<void> {
        const res = await authFetch(`${FLASK_API}/v1/resources/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
    },

    async search(query: string, userId?: string): Promise<Resource[]> {
        const params = new URLSearchParams({ q: query });
        if (userId) params.set('userId', userId);
        const res = await authFetch(`${FLASK_API}/v1/resources/search?${params}`);
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        return data.resources;
    },

    getDownloadUrl(id: string): string {
        return `${FLASK_API}/v1/resources/${id}/download`;
    }
};
