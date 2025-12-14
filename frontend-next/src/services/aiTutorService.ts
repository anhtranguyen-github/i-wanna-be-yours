import { Conversation, Message, Resource } from "@/types/aiTutorTypes";
import Cookies from 'js-cookie';
import { v4 as uuidv4 } from 'uuid';

const API_BASE_URL = 'http://localhost:5400';

class AITutorService {
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

    // --- Conversations (Backend) ---

    async getConversations(search?: string, tag?: string): Promise<Conversation[]> {
        const user = await this.getCurrentUser();
        if (!user) return []; // Or throw error

        const res = await fetch(`${API_BASE_URL}/conversations/user/${user.id}`, {
            headers: this.getHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch conversations');
        const conversationsRaw = await res.json(); // Array of dicts

        // Map backend format to frontend Conversation interface
        let convos: Conversation[] = conversationsRaw.map((c: any) => ({
            _id: c.id.toString(),
            sessionId: c.sessionId,
            title: c.title || 'Untitled',
            messages: c.lastMessage ? [{
                id: c.lastMessage.id?.toString() || uuidv4(),
                role: c.lastMessage.role,
                text: c.lastMessage.content,
                timestamp: new Date(c.lastMessage.created_at || Date.now()).getTime()
            }] : [],
            updated_at: c.updatedAt ? new Date(c.updatedAt).getTime() : Date.now()
        }));

        if (search) {
            const lower = search.toLowerCase();
            convos = convos.filter((c: Conversation) => c.title.toLowerCase().includes(lower));
        }
        return convos;
    }

    async getConversation(id: string): Promise<Conversation> {
        const res = await fetch(`${API_BASE_URL}/conversations/${id}`, {
            headers: this.getHeaders()
        });

        if (!res.ok) throw new Error('Failed to fetch history');
        const data = await res.json();

        // data is { id, sessionId, title, history: [...], ... }
        const messages: Message[] = (data.history || []).map((m: any) => ({
            id: m.id?.toString() || uuidv4(),
            role: m.role,
            text: m.content,
            timestamp: m.created_at ? new Date(m.created_at).getTime() : Date.now()
        }));

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

        const res = await fetch(`${API_BASE_URL}/conversations/`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                userId: user.id,
                title: title
            })
        });

        if (!res.ok) throw new Error("Failed to create conversation");
        const c = await res.json();

        // If initial message, we might want to send it immediately?
        // But the UI usually handles sending the first message.
        // For now, return the empty conversation.

        return {
            _id: c.id.toString(),
            sessionId: c.sessionId,
            title: c.title,
            messages: [],
            updated_at: Date.now(),
        };
    }

    async deleteConversation(id: string): Promise<void> {
        // Backend might not have DELETE endpoint yet, based on routes/conversation.py
        // Assuming it doesn't exist yet, we'll log it.
        console.warn("Delete conversation not implemented in backend yet.");
        /*
        await fetch(`${API_BASE_URL}/conversations/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        */
    }

    async addMessage(convoId: string, role: 'user' | 'ai', text: string): Promise<Message> {
        // This is called by UI for optimistic updates.
        // Actual persistence happens in streamChat for 'ai' role (wait, no)
        // or 'sendMessage' for user.
        // But wait, the UI calls this to SAVE the AI message after streaming?
        // If we use 'invoke', backend saves it.
        // So this might be redundant or valid only for manual user messages?
        // Let's implement it calling POST /conversations/<id>/messages

        const res = await fetch(`${API_BASE_URL}/conversations/${convoId}/messages`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                role: role,
                content: text
            })
        });

        if (!res.ok) throw new Error("Failed to add message");
        const m = await res.json();

        return {
            id: m.id?.toString() || uuidv4(),
            role: role,
            text: text,
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

        // Backend returns array directly
        return (Array.isArray(data) ? data : []).map((r: any) => ({
            _id: r.id.toString(),
            type: r.type,
            content: r.content,
            title: r.title,
            created_at: new Date(r.createdAt || Date.now()).getTime()
        }));
    }

    async createResource(type: 'note' | 'link' | 'document', content: string, title: string): Promise<Resource> {
        const res = await fetch(`${API_BASE_URL}/resources`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ type, content, title })
        });

        if (!res.ok) throw new Error('Failed to create resource');
        const r = await res.json(); // Backend returns object directly

        return {
            _id: r.id.toString(),
            type: r.type,
            content: r.content,
            title: r.title,
            created_at: new Date(r.createdAt || Date.now()).getTime()
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

    // Modified to accept conversationId and sessionId, and simulate streaming
    async streamChat(query: string, thinking: boolean = false, conversationId?: string, sessionId?: string): Promise<ReadableStreamDefaultReader<Uint8Array>> {
        const user = await this.getCurrentUser();
        if (!user) throw new Error("User not logged in");
        if (!sessionId) throw new Error("Session ID missing");

        const response = await fetch(`${API_BASE_URL}/agent/invoke`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                session_id: sessionId,
                user_id: user.id,
                prompt: query,
                // context_config could be added here
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to invoke agent');
        }

        const data = await response.json();
        // data matches AgentResponse Pydantic model
        // responses: Array of { type: 'text', content: '...' }
        // We only care about the text content for the stream simulation for now.

        const textContent = data.responses.find((r: any) => r.type === 'text')?.content || "No response content.";

        // Simulate streaming
        const stream = new ReadableStream({
            start(controller) {
                const encoder = new TextEncoder();
                // Simulate chunks for better feel? Or just one big chunk.
                // One chunk is fine for functionality.
                controller.enqueue(encoder.encode(textContent));
                controller.close();
            }
        });

        return stream.getReader();
    }
}

export const aiTutorService = new AITutorService();
