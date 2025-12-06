import { Conversation, Message, Resource } from "@/types/aiTutorTypes";
import Cookies from 'js-cookie';
import { v4 as uuidv4 } from 'uuid';

const API_BASE_URL = 'http://localhost:5400';

class AITutorService {
    // --- Conversations (Backend) ---

    private getHeaders() {
        const token = Cookies.get('accessToken');
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
        };
    }

    async getConversations(search?: string, tag?: string): Promise<Conversation[]> {
        const res = await fetch(`${API_BASE_URL}/chat/conversations`, {
            headers: this.getHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch conversations');
        const data = await res.json();
        let convos: Conversation[] = data.conversations || [];

        if (search) {
            const lower = search.toLowerCase();
            convos = convos.filter((c: Conversation) => c.title.toLowerCase().includes(lower));
        }
        return convos;
    }

    async getConversation(id: string): Promise<Conversation> {
        // First try to get metadata from list (optimization)
        // In a real app we might skip this or use a cache
        const res = await fetch(`${API_BASE_URL}/chat/history?conversation_id=${id}`, {
            headers: this.getHeaders()
        });

        if (!res.ok) throw new Error('Failed to fetch history');
        const data = await res.json();

        // Map backend messages to frontend format
        const messages: Message[] = (data.history || []).map((m: any) => ({
            id: uuidv4(), // Backend might not send ID, generate one for React key
            role: m.speaker === 'USER' ? 'user' : 'ai',
            text: m.text,
            timestamp: new Date(m.timestamp).getTime()
        }));

        return {
            _id: id,
            title: 'Conversation', // Ideally fetch title if not in list
            messages,
            updated_at: Date.now()
        };
    }

    async createConversation(title: string, initialMessage?: string): Promise<Conversation> {
        const newConvo: Conversation = {
            _id: uuidv4(),
            title,
            messages: [],
            updated_at: Date.now(),
        };

        if (initialMessage) {
            newConvo.messages.push({
                id: uuidv4(),
                role: 'user',
                text: initialMessage,
                timestamp: Date.now()
            });
        }

        return newConvo;
    }

    async deleteConversation(id: string): Promise<void> {
        await fetch(`${API_BASE_URL}/chat/conversations/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
    }

    async addMessage(convoId: string, role: 'user' | 'ai', text: string): Promise<Message> {
        // Mostly for local/optimistic updates if needed, logic handled partly by stream
        return {
            id: uuidv4(),
            role,
            text,
            timestamp: Date.now(),
        };
    }

    // --- Resources (Backend) ---

    async getResources(): Promise<Resource[]> {
        const res = await fetch(`${API_BASE_URL}/resources`, {
            headers: this.getHeaders()
        });
        if (!res.ok) return [];
        const data = await res.json();

        return (data.resources || []).map((r: any) => ({
            _id: r.resource_id,
            type: r.type,
            content: r.content,
            title: r.title,
            created_at: new Date(r.created_at).getTime()
        }));
    }

    async createResource(type: 'note' | 'link' | 'document', content: string, title: string): Promise<Resource> {
        const res = await fetch(`${API_BASE_URL}/resources`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ type, content, title })
        });

        if (!res.ok) throw new Error('Failed to create resource');
        const data = await res.json();
        const r = data.resource;

        return {
            _id: r.resource_id,
            type: r.type,
            content: r.content,
            title: r.title,
            created_at: new Date(r.created_at).getTime()
        };
    }

    async deleteResource(id: string): Promise<void> {
        await fetch(`${API_BASE_URL}/resources/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
    }

    async uploadFile(file: File): Promise<{ url: string }> {
        console.log('Uploading file:', file.name);
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ url: `[File: ${file.name}]` });
            }, 500);
        });
    }

    // --- Chat API (Backend) ---

    async streamChat(query: string, thinking: boolean = false): Promise<ReadableStreamDefaultReader<Uint8Array>> {
        const token = Cookies.get('accessToken');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/chat/stream`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                query,
                thinking,
            }),
        });

        if (!response.ok || !response.body) {
            throw new Error('Failed to connect to chat stream');
        }

        return response.body.getReader();
    }
}

export const aiTutorService = new AITutorService();
