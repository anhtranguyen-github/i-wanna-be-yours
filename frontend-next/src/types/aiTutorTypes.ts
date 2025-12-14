export interface Message {
    id: string;
    role: 'user' | 'ai';
    text: string;
    timestamp?: number;
}

export interface Conversation {
    _id: string; // We will cast backend int ID to string for consistency
    sessionId?: string; // Backend session ID
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
