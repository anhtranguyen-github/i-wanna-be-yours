
export interface SidebarMetadata {
    group?: string;
    status?: 'new' | 'viewed' | 'completed';
    default_open?: boolean;
}

export type ArtifactType = 'flashcard' | 'flashcard_single' | 'flashcard_deck' | 'quiz' | 'exam' | 'note' | 'mindmap' | 'vocabulary' | 'task' | 'summary' | 'audio';

export interface Artifact {
    id: string; // Mongo ID
    type: ArtifactType;
    title: string;
    data: any; // Flexible content
    metadata: SidebarMetadata & Record<string, any>;
    createdAt: string;
    conversationId?: string;
    messageId?: string;
    savedToLibrary?: boolean;
    actions?: any;
}

// Specific Data Structures (optional, for type guards)
export interface FlashcardDeckData {
    title: string;
    cards: Array<{ front: string; back: string; reading?: string; example?: string }>;
}

export interface QuizData {
    title: string;
    questions: Array<any>;
    quizType?: 'quiz' | 'exam';
}
