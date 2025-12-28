import { Conversation, Message, Resource as TypeResource } from "@/types/aiTutorTypes";
import { Artifact } from "@/types/artifact";
import Cookies from 'js-cookie';
import { authFetch } from '@/lib/authFetch';

export interface Resource extends TypeResource {
    ingestionStatus?: 'pending' | 'processing' | 'completed' | 'failed';
}

class AITutorService {
    public readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/h-api';

    // --- Auth Helper ---
    private async getCurrentUser() {
        try {
            const res = await fetch('/api/auth/me');
            if (!res.ok) return null;
            const data = await res.json();
            return data.user;
        } catch (e) {
            console.error("Failed to get current user", e);
            return null;
        }
    }

    private getHeaders() {
        const token = Cookies.get('accessToken');
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
        };
    }

    private mapArtifact(r: any): Artifact {
        // Try multiple possible ID fields from different backend responses
        // Priority: id > artifactId > _id > responseId > timestamp fallback
        const id = r.id?.toString()
            || r.artifactId?.toString()
            || r._id?.toString()
            || r.responseId?.toString();

        // If no ID found, generate a deterministic one based on content
        // This allows mock agents to work while logging a warning
        const finalId = id || `artifact-${r.type}-${Date.now()}`;

        if (!id) {
            console.warn('[aiTutorService] Artifact missing standard ID, using fallback:', finalId, r);
        }

        return {
            id: finalId,
            type: r.type,
            title: r.content?.title || r.title || r.type || 'Untitled',
            data: r.content?.flashcards || r.content?.quiz || r.content?.vocabulary || r.content || r.data,
            metadata: { ...r.metadata },
            createdAt: r.created_at || new Date().toISOString()
        };
    }

    private mapMessage(m: any): Message {
        // Use server ID or create deterministic ID based on content
        const id = m.id?.toString() || m._id?.toString() || `msg-${m.created_at || Date.now()}`;
        return {
            id,
            role: m.role as any,
            content: m.content,
            timestamp: m.created_at ? new Date(m.created_at).getTime() : Date.now(),
            artifacts: (m.artifacts || []).map((a: any) => this.mapArtifact(a)),
            attachments: m.contextConfiguration?.resources?.map((r: any) => ({
                id: r.id || r._id,
                title: r.title,
                type: r.type,
                size: r.size
            }))
        };
    }

    // --- Conversations (Backend) ---

    async getConversations(search?: string, tag?: string): Promise<Conversation[]> {
        const user = await this.getCurrentUser();
        if (!user) return [];

        const res = await authFetch(`${this.API_BASE_URL}/conversations/user/${user.id}`, {
            headers: this.getHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch conversations');
        const conversationsRaw = await res.json();

        let convos: Conversation[] = conversationsRaw.map((c: any) => ({
            _id: c.sessionId || c.id.toString(), // Prefer SessionUUID
            sessionId: c.sessionId,
            title: c.title || 'Untitled',
            messages: c.lastMessage ? [this.mapMessage(c.lastMessage)] : [],
            updated_at: c.updatedAt ? new Date(c.updatedAt).getTime() : Date.now()
        }));

        if (search) {
            const lower = search.toLowerCase();
            convos = convos.filter((c: Conversation) => c.title.toLowerCase().includes(lower));
        }
        return convos;
    }

    async getConversation(id: string): Promise<Conversation> {
        const res = await authFetch(`${this.API_BASE_URL}/conversations/${id}`, {
            headers: this.getHeaders()
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `Failed to fetch history (${res.status})`);
        }
        const data = await res.json();

        const messages: Message[] = (data.history || []).map((m: any) => this.mapMessage(m));

        return {
            _id: data.sessionId || data.id.toString(), // Prefer SessionUUID
            sessionId: data.sessionId,
            title: data.title || 'Conversation',
            messages,
            updated_at: data.updatedAt ? new Date(data.updatedAt).getTime() : Date.now()
        };
    }

    async createConversation(title: string, initialMessage?: string): Promise<Conversation> {
        const user = await this.getCurrentUser();
        if (!user) throw new Error("User must be logged in");

        const res = await authFetch(`${this.API_BASE_URL}/conversations/`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                userId: user.id,
                title: title
            })
        });

        if (!res.ok) throw new Error("Failed to create conversation");
        const c = await res.json();

        return {
            _id: c.sessionId || c.id.toString(), // Prefer SessionUUID
            sessionId: c.sessionId,
            title: c.title,
            messages: [],
            updated_at: Date.now(),
        };
    }

    async deleteConversation(id: string): Promise<void> {
        console.warn("Delete conversation not implemented in backend yet.");
    }

    async addMessage(convoId: string, role: 'user' | 'assistant' | 'system', text: string): Promise<Message> {
        const res = await authFetch(`${this.API_BASE_URL}/conversations/${convoId}/messages`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                role: role,
                content: text
            })
        });

        if (!res.ok) throw new Error("Failed to add message");
        const m = await res.json();

        return this.mapMessage(m);
    }

    // --- Resources (Backend) ---

    async getResources(): Promise<Resource[]> {
        const res = await authFetch(`${this.API_BASE_URL}/resources/`, {
            headers: this.getHeaders()
        });
        if (!res.ok) return [];
        const data = await res.json();

        return (Array.isArray(data) ? data : []).map((r: any) => ({
            _id: r.id.toString(),
            type: r.type,
            content: r.content,
            title: r.title,
            created_at: new Date(r.createdAt || Date.now()).getTime(),
            ingestionStatus: r.ingestionStatus
        }));
    }

    async getResource(id: string): Promise<Resource | null> {
        try {
            const res = await authFetch(`${this.API_BASE_URL}/resources/${id}`, {
                headers: this.getHeaders()
            });
            if (!res.ok) return null;
            const r = await res.json();
            return {
                _id: r.id.toString(),
                type: r.type,
                content: r.content,
                title: r.title,
                created_at: new Date(r.createdAt || Date.now()).getTime(),
                ingestionStatus: r.ingestionStatus
            };
        } catch (e) { return null; }
    }

    async createResource(type: string, content: string, title: string): Promise<Resource> {
        const res = await authFetch(`${this.API_BASE_URL}/resources/`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ type, content, title })
        });

        if (!res.ok) throw new Error('Failed to create resource');
        const r = await res.json();

        return {
            _id: r.id.toString(),
            type: r.type,
            content: r.content,
            title: r.title,
            created_at: new Date(r.createdAt || Date.now()).getTime()
        };
    }

    async deleteResource(id: string): Promise<void> {
        await authFetch(`${this.API_BASE_URL}/resources/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
    }

    async uploadFile(file: File): Promise<{ id: string; url: string }> {
        const formData = new FormData();
        formData.append('file', file);

        const user = await this.getCurrentUser();
        if (user) {
            formData.append('userId', user.id);
        }

        const headers = this.getHeaders();
        // @ts-ignore
        delete headers['Content-Type'];

        const response = await authFetch(`/f-api/v1/resources/upload`, {
            method: 'POST',
            headers: headers,
            body: formData
        });

        if (!response.ok) throw new Error("Upload failed");
        const data = await response.json();
        // Flask returns { id: "mongo_id", title: "filename", ... }
        // The URL field for download is constructed via another endpoint, 
        // but for now we can just return the ID as the URL or empty string if not strictly needed immediately by UI for simple display
        // Chat UI might use 'url' to display a link?
        // Helper to trigger ingestion
        const triggerIngestion = async (id: string) => {
            try {
                // Determine API endpoint - use Hanachan API
                // Assuming internal proxy or direct call
                const ingestRes = await authFetch(`${this.API_BASE_URL}/resource/ingest/${id}`, {
                    method: 'POST',
                    headers: this.getHeaders()
                });
                if (!ingestRes.ok) console.warn("Failed to auto-trigger ingestion", id);
            } catch (e) { console.error("Ingestion trigger error", e); }
        };

        // Trigger background ingestion immediately
        triggerIngestion(data.id);

        return { id: data.id, url: data.filePath || "" };
    }

    // --- Chat API (Backend) ---

    async streamChat(query: string, thinking: boolean = false, conversationId?: string, sessionId?: string, resourceIds: string[] = [], resources: any[] = []): Promise<{ reader: ReadableStreamDefaultReader<Uint8Array>; artifacts: Artifact[]; conversationId?: string }> {
        const user = await this.getCurrentUser();
        if (!user) throw new Error("User not logged in");
        if (!sessionId) throw new Error("Session ID missing");

        const response = await fetch(`${this.API_BASE_URL}/agent/stream`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                session_id: sessionId,
                user_id: user.id,
                prompt: query,
                context_config: {
                    resource_ids: resourceIds,
                    resources: resources
                }
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to initiate neural stream');
        }

        // Note: For now, in Alpha, artifacts are sent separately or parsed from stream if needed.
        // We return the reader directly from the fetch response.
        return {
            reader: response.body!.getReader(),
            artifacts: [], // Stream handles text only for now in this path
            conversationId: conversationId
        };
    }
}

export const aiTutorService = new AITutorService();
