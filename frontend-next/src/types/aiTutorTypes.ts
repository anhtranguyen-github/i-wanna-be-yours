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

import { Artifact } from '@/types/artifact';
export type { Artifact };
// Removed local Artifact definitions in favor of unified types from @/types/artifact
// export type ArtifactType = ...
// export interface Artifact = ...
// export interface ArtifactActions = ...

export interface ArtifactActions {
    canSaveToLibrary?: boolean;
    canAddToExistingDeck?: boolean;
    canCreateNewDeck?: boolean;
    canStartInline?: boolean;
    canNavigateToExamPage?: boolean;
    canEditBeforeSave?: boolean;
    canSaveForLater?: boolean;
}

export interface FlashcardData {
    description?: string;
    cards: FlashcardCard[];
}

export interface FlashcardCard {
    id?: string;
    front: string;
    back: string;
    reading?: string;
    example?: string;
    tags?: string[];
}

export interface QuizData {
    description?: string;
    showExplanations?: boolean;
    passingScore?: number;
    questions: QuizQuestion[];
}

export interface QuizQuestion {
    id: string;
    type: string;
    content: string;
    passage?: string;
    audioUrl?: string;
    options: { id: string; text: string }[];
    correctAnswer: string;
    explanation?: string;
}

export interface ExamData {
    description?: string;
    passingScore?: number;
    sections: ExamSection[];
}

export interface ExamSection {
    name: string;
    questions: QuizQuestion[];
}

export interface VocabularyData {
    items: VocabularyItem[];
}

export interface VocabularyItem {
    word: string;
    reading?: string;
    definition: string;
    example?: string;
}

export interface MindmapData {
    root: { id: string; label: string };
    nodes: MindmapNode[];
}

export interface MindmapNode {
    id: string;
    label: string;
    parent?: string;
}

export interface TaskData {
    task: {
        title: string;
        description: string;
        status: string;
        dueDate?: string | null;
    };
}

// === Legacy types for backwards compatibility ===

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

