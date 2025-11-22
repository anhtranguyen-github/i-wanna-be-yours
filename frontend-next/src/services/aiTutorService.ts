import { v4 as uuidv4 } from 'uuid';

export interface Message {
    id: string;
    role: 'user' | 'ai';
    text: string;
    timestamp?: number;
}

export interface Conversation {
    _id: string;
    title: string;
    messages: Message[];
    updated_at: number;
    tags?: string[];
}

export interface Resource {
    _id: string;
    type: 'note' | 'link' | 'document';
    content: string;
    title: string;
    created_at: number;
}

const API_BASE_URL = 'http://localhost:5400';

class AITutorService {
    // --- Conversations (LocalStorage) ---

    async getConversations(search?: string, tag?: string): Promise<Conversation[]> {
        const stored = localStorage.getItem('hanabira_conversations');
        let convos: Conversation[] = stored ? JSON.parse(stored) : [];

        // Sort by updated_at desc
        convos.sort((a, b) => b.updated_at - a.updated_at);

        if (search) {
            const lower = search.toLowerCase();
            convos = convos.filter(c => c.title.toLowerCase().includes(lower));
        }
        // Tag filtering could be implemented here if tags were fully supported
        return convos;
    }

    async getConversation(id: string): Promise<Conversation> {
        const convos = await this.getConversations();
        const found = convos.find(c => c._id === id);
        if (!found) throw new Error('Conversation not found');
        return found;
    }

    async createConversation(title: string): Promise<Conversation> {
        const newConvo: Conversation = {
            _id: uuidv4(),
            title,
            messages: [],
            updated_at: Date.now(),
        };
        const convos = await this.getConversations();
        convos.unshift(newConvo);
        this._saveConversations(convos);
        return newConvo;
    }

    async deleteConversation(id: string): Promise<void> {
        let convos = await this.getConversations();
        convos = convos.filter(c => c._id !== id);
        this._saveConversations(convos);
    }

    async addMessage(convoId: string, role: 'user' | 'ai', text: string): Promise<Message> {
        const convos = await this.getConversations();
        const idx = convos.findIndex(c => c._id === convoId);
        if (idx === -1) throw new Error('Conversation not found');

        const msg: Message = {
            id: uuidv4(),
            role,
            text,
            timestamp: Date.now(),
        };

        convos[idx].messages.push(msg);
        convos[idx].updated_at = Date.now();
        this._saveConversations(convos);
        return msg;
    }

    private _saveConversations(convos: Conversation[]) {
        localStorage.setItem('hanabira_conversations', JSON.stringify(convos));
    }

    // --- Resources (LocalStorage) ---

    async getResources(): Promise<Resource[]> {
        const stored = localStorage.getItem('hanabira_resources');
        return stored ? JSON.parse(stored) : [];
    }

    async createResource(type: 'note' | 'link' | 'document', content: string, title: string): Promise<Resource> {
        const res: Resource = {
            _id: uuidv4(),
            type,
            content,
            title,
            created_at: Date.now(),
        };
        const list = await this.getResources();
        list.unshift(res);
        this._saveResources(list);
        return res;
    }

    async deleteResource(id: string): Promise<void> {
        let list = await this.getResources();
        list = list.filter(r => r._id !== id);
        this._saveResources(list);
    }

    async uploadFile(file: File): Promise<{ url: string }> {
        // Mock upload - in real app, upload to server/S3
        // For now, we'll just use a fake local URL or base64 if small enough, 
        // but let's just return a placeholder to satisfy the UI.
        console.log('Uploading file:', file.name);
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ url: `[File: ${file.name}]` });
            }, 500);
        });
    }

    private _saveResources(list: Resource[]) {
        localStorage.setItem('hanabira_resources', JSON.stringify(list));
    }

    // --- Chat API (Backend) ---

    async streamChat(query: string, thinking: boolean = false): Promise<ReadableStreamDefaultReader<Uint8Array>> {
        const response = await fetch(`${API_BASE_URL}/chat/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
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
