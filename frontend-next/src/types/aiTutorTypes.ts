export interface Message {
    id: string;
    role: 'user' | 'ai';
    text: string;
    timestamp?: number;
    artifacts?: Artifact[];
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

// === Artifact Types for AI-Generated Content ===

export interface Artifact {
    type: 'flashcard' | 'quiz' | 'vocabulary' | 'mindmap' | 'task' | 'audio';
    title: string;
    data: FlashcardArtifact | QuizArtifact | VocabularyArtifact | MindmapArtifact | TaskArtifact | unknown;
}

export interface FlashcardArtifact {
    id?: number;
    title: string;
    level?: string;
    skill?: string;
    cards: { front: string; back: string }[];
}

export interface QuizArtifact {
    id?: number;
    title: string;
    description?: string;
    quizType: 'quiz' | 'exam' | 'practice';
    level?: string;
    skill?: string;
    timeLimitMinutes?: number;
    questionCount?: number;
    questions: QuizQuestionArtifact[];
}

export interface QuizQuestionArtifact {
    type: string;
    content: string;
    passage?: string;
    audioUrl?: string;
    options: { id: string; text: string }[];
    correctAnswer: string;
    explanation: string;
    skill?: string;
    difficulty?: number;
}

export interface VocabularyArtifact {
    id?: number;
    title: string;
    items: { word: string; definition: string; example?: string }[];
}

export interface MindmapArtifact {
    id?: number;
    title: string;
    nodes: { id: string; label: string; parentId?: string; children?: unknown[] }[];
}

export interface TaskArtifact {
    title: string;
    description: string;
    status: string;
}
