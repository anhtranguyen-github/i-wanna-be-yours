import { Conversation, Message, Resource } from "@/types/aiTutorTypes";
import { Artifact } from "@/types/artifact";
import Cookies from 'js-cookie';
import { v4 as uuidv4 } from 'uuid';
import { authFetch } from '@/lib/authFetch';

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
        return {
            id: r.id?.toString() || r.artifactId || uuidv4(),
            type: r.type,
            title: r.content?.title || r.title || r.type,
            data: r.content?.flashcards || r.content?.quiz || r.content?.vocabulary || r.content || r.data,
            metadata: { ...r.metadata },
            createdAt: r.created_at || new Date().toISOString()
        };
    }

    private mapMessage(m: any): Message {
        return {
            id: m.id?.toString() || uuidv4(),
            role: m.role as any,
            content: m.content,
            timestamp: m.created_at ? new Date(m.created_at).getTime() : Date.now(),
            artifacts: (m.artifacts || []).map((a: any) => this.mapArtifact(a))
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
            _id: c.id.toString(),
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
            _id: data.id.toString(),
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
            _id: c.id.toString(),
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
            created_at: new Date(r.createdAt || Date.now()).getTime()
        }));
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
        return { id: data.id, url: data.filePath || "" };
    }

    // --- Chat API (Backend) ---

    async streamChat(query: string, thinking: boolean = false, conversationId?: string, sessionId?: string, resourceIds: string[] = []): Promise<{ reader: ReadableStreamDefaultReader<Uint8Array>; artifacts: Artifact[]; conversationId?: string }> {
        const user = await this.getCurrentUser();
        if (!user) throw new Error("User not logged in");
        if (!sessionId) throw new Error("Session ID missing");

        const response = await authFetch(`${this.API_BASE_URL}/agent/invoke`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                session_id: sessionId,
                user_id: user.id,
                prompt: query,
                context_config: {
                    resource_ids: resourceIds
                }
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to invoke agent');
        }

        const data = await response.json();
        const textContent = data.responses.find((r: any) => r.type === 'text')?.content || "No response content.";

        const artifacts: Artifact[] = data.responses
            .filter((r: any) => r.type !== 'text')
            .map((r: any) => this.mapArtifact(r));

        const stream = new ReadableStream({
            start(controller) {
                const encoder = new TextEncoder();
                controller.enqueue(encoder.encode(textContent));
                controller.close();
            }
        });

        return { reader: stream.getReader(), artifacts, conversationId: data.conversationId };
    }
}

export const aiTutorService = new AITutorService();
