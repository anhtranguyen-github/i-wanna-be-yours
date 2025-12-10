export interface Artifact {
    id?: string;
    type: "mindmap" | "flashcard" | "vocabulary" | "analysis" | "document" | "image" | "file" | "task";
    content: any;
    title?: string;
}

export interface Task {
    id?: string;
    title: string;
    description: string;
    status?: "pending" | "completed";
}

export interface Suggestion {
    text: string;
}

export interface Message {
    role: "user" | "ai" | "assistant";
    content: string;
    attachments?: Artifact[];
    tasks?: Task[];
    suggestions?: Suggestion[];
}

export interface Conversation {
    id: string;
    title: string;
}

export interface Resource {
    id: string;
    title: string;
    type?: string;
    content?: string;
}
