import React from 'react';

export type TagType = 'category' | 'level' | 'skill' | 'source';

export interface Tag {
    id: string;       // Unique identifier (e.g., "kanji", "n3", "reading")
    label: string;    // Display label (e.g., "Kanji", "N3", "Reading")
    type: TagType;    // Type for filtering UI
    color?: string;   // Optional color for visual distinction
}

// Predefined tags (can be extended)
export const ALL_TAGS: Tag[] = [
    // Category tags
    { id: 'kanji', label: 'Kanji', type: 'category', color: 'rose' },
    { id: 'vocabulary', label: 'Vocabulary', type: 'category', color: 'emerald' },
    { id: 'grammar', label: 'Grammar', type: 'category', color: 'sky' },
    { id: 'personal', label: 'Personal', type: 'category', color: 'violet' },

    // Level tags (JLPT)
    { id: 'n5', label: 'N5', type: 'level', color: 'green' },
    { id: 'n4', label: 'N4', type: 'level', color: 'lime' },
    { id: 'n3', label: 'N3', type: 'level', color: 'yellow' },
    { id: 'n2', label: 'N2', type: 'level', color: 'orange' },
    { id: 'n1', label: 'N1', type: 'level', color: 'red' },

    // Skill tags
    { id: 'beginner', label: 'Beginner', type: 'skill', color: 'teal' },
    { id: 'intermediate', label: 'Intermediate', type: 'skill', color: 'amber' },
    { id: 'advanced', label: 'Advanced', type: 'skill', color: 'red' },

    // Source/Type tags
    { id: 'essential', label: 'Essential', type: 'source', color: 'indigo' },
    { id: 'suru-verbs', label: 'Suru Verbs', type: 'source', color: 'purple' },
    { id: 'sentence-mining', label: 'Sentence Mining', type: 'source', color: 'pink' },
    { id: 'verbs', label: 'Verbs', type: 'source', color: 'cyan' },
];

// Helper to get tag by ID
export const getTagById = (id: string): Tag | undefined =>
    ALL_TAGS.find(t => t.id === id);

// Helper to get all tags of a specific type
export const getTagsByType = (type: TagType): Tag[] =>
    ALL_TAGS.filter(t => t.type === type);
