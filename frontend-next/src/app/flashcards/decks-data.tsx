"use client";

import React from 'react';
import ComplexFlashcardModalKanjiFlask from "../../components/ComplexFlashcardModalKanjiFlask";
import ComplexFlashcardModalVocabFlaskSentenceMining from "../../components/ComplexFlashcardModalVocabFlaskSentenceMining";
import ComplexFlashcardModalVocabFlask from "../../components/ComplexFlashcardModalVocabFlask";
import ComplexFlashcardModalGrammarFlask from "../../components/ComplexFlashcardModalGrammarFlask";

// ==================== Tag System ====================
// Tags are the unified way to categorize and filter decks
// Each tag has a type (category, level, skill, source) for UI organization

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

// ==================== Deck Definition ====================

export interface DeckDefinition {
    id: string;                 // Unique ID for key
    title: string;
    description: string;
    tags: string[];             // Array of tag IDs (unified filtering)
    component?: React.ReactNode; // The modal component to render
    actionLink?: string;        // Or a link if it's a page navigation
    locked?: boolean;           // If true, requires login
    cardCount?: number;         // Optional: number of cards in deck
    apiParams?: {               // Metadata for fetching data
        collection: string;
        p_tag: string;
        s_tag: string;
    };
}

export const getDeckById = (id: string): DeckDefinition | undefined => {
    // We pass null for userId as we only need static definition here
    return getPublicDecks(null).find(d => d.id === id);
};

// ==================== Deck Generators ====================

export const getPublicDecks = (userId: string | null): DeckDefinition[] => {
    const effectiveUserId = userId || "";
    const decks: DeckDefinition[] = [];

    // --- Sentence Mining ---
    decks.push({
        id: 'vocab-sentence-mining',
        title: 'Sentence Mining: Verbs',
        description: 'Context-based vocabulary learning with real sentences.',
        tags: ['vocabulary', 'sentence-mining', 'verbs', 'intermediate'],
        apiParams: { collection: 'vocabulary', p_tag: 'sentence_mining', s_tag: 'verbs-1' },
        component: <ComplexFlashcardModalVocabFlaskSentenceMining
            userId={effectiveUserId}
            collectionName="vocabulary"
            p_tag="sentence_mining"
            s_tag="verbs-1"
            deckId="vocab-sentence-mining"
        />
    });

    // --- Essential Verbs ---
    const vocabLevels = [
        "verbs-1", "verbs-2", "verbs-3", "verbs-4",
        "verbs-5", "verbs-6", "verbs-7", "verbs-8"
    ];
    vocabLevels.forEach((part, index) => {
        const id = `vocab-essential-${part}`;
        const title = `Essential Verbs Vol. ${index + 1}`;
        const description = 'Core 600 Essential Japanese Verbs for everyday use.';
        decks.push({
            id: id,
            title: title,
            description: description,
            tags: ['vocabulary', 'verbs', 'essential', 'beginner'],
            apiParams: { collection: 'words', p_tag: 'essential_600_verbs', s_tag: part },
            component: <ComplexFlashcardModalVocabFlask
                userId={effectiveUserId}
                collectionName="words"
                p_tag="essential_600_verbs"
                s_tag={part}
                deckId={id}
                deckTitle={title}
                deckDescription={description}
            />
        });
    });

    // --- Suru Verbs ---
    const suruVocabLevels = [
        "verbs-1", "verbs-2", "verbs-3", "verbs-4", "verbs-5", "verbs-6"
    ];
    suruVocabLevels.forEach((part, index) => {
        const id = `vocab-suru-${part}`;
        const title = `Suru Verbs Vol. ${index + 1}`;
        const description = 'Essential する-verbs commonly used in Japanese.';

        decks.push({
            id: id,
            title: title,
            description: description,
            tags: ['vocabulary', 'suru-verbs', 'intermediate'],
            apiParams: { collection: 'words', p_tag: 'suru_essential_600_verbs', s_tag: part },
            component: <ComplexFlashcardModalVocabFlask
                userId={effectiveUserId}
                collectionName="words"
                p_tag="suru_essential_600_verbs"
                s_tag={part}
                deckId={id}
                deckTitle={title}
                deckDescription={description}
            />
        });
    });

    // --- Grammar by JLPT Level ---
    const grammarLevels = [
        { p_tag: "JLPT_N5", tagId: "n5" },
        { p_tag: "JLPT_N4", tagId: "n4" },
        { p_tag: "JLPT_N3", tagId: "n3" },
        { p_tag: "JLPT_N2", tagId: "n2" },
        { p_tag: "JLPT_N1", tagId: "n1" },
    ];

    grammarLevels.forEach((level) => {
        ['grammar_1', 'grammar_2', 'grammar_3', 'grammar_4', 'grammar_5', 'grammar_6'].forEach((part, index) => {
            const id = `grammar-${level.tagId}-part${index + 1}`;
            decks.push({
                id: id,
                title: `${level.p_tag.replace('JLPT_', '')} Grammar Part ${index + 1}`,
                description: `Master ${level.p_tag.replace('JLPT_', '')} grammar points part ${index + 1}.`,
                tags: ['grammar', level.tagId],
                apiParams: { collection: 'grammar', p_tag: level.p_tag, s_tag: part },
                component: <ComplexFlashcardModalGrammarFlask
                    userId={effectiveUserId}
                    collectionName="grammar"
                    p_tag={level.p_tag}
                    s_tag={part}
                    deckId={id}
                />
            });
        });
    });

    // --- Kanji N3 ---
    const n3Parts = ["part_1", "part_2", "part_3", "part_4", "part_5", "part_6"];
    n3Parts.forEach((part, idx) => {
        decks.push({
            id: `kanji-n3-${part}`,
            title: `Kanji N3 Part ${idx + 1}`,
            description: 'Intermediate Kanji readings and meanings.',
            tags: ['kanji', 'n3', 'intermediate'],
            component: <ComplexFlashcardModalKanjiFlask
                userId={effectiveUserId}
                collectionName="kanji"
                p_tag="JLPT_N3"
                s_tag={part}
            />
        });
    });

    // --- Kanji N4 ---
    const n4Parts = ["part_1", "part_2", "part_3"];
    n4Parts.forEach((part, idx) => {
        decks.push({
            id: `kanji-n4-${part}`,
            title: `Kanji N4 Part ${idx + 1}`,
            description: 'Upper Beginner Kanji for everyday reading.',
            tags: ['kanji', 'n4', 'beginner'],
            component: <ComplexFlashcardModalKanjiFlask
                userId={effectiveUserId}
                collectionName="kanji"
                p_tag="JLPT_N4"
                s_tag={part}
            />
        });
    });

    // --- Kanji N5 ---
    decks.push({
        id: `kanji-n5-part1`,
        title: `Kanji N5 Part 1`,
        description: 'Basic foundational Kanji for beginners.',
        tags: ['kanji', 'n5', 'beginner'],
        component: <ComplexFlashcardModalKanjiFlask
            userId={effectiveUserId}
            collectionName="kanji"
            p_tag="JLPT_N5"
            s_tag="part_1"
        />
    });

    return decks;
};

export const getPersonalDecks = (): DeckDefinition[] => {
    return [
        {
            id: 'personal-study',
            title: 'Study Due Cards',
            description: 'Your personalized Spaced Repetition queue.',
            tags: ['personal'],
            actionLink: '/flashcards/study'
        },
        {
            id: 'personal-inbox',
            title: 'Inbox',
            description: 'New cards waiting for your review.',
            tags: ['personal'],
            actionLink: '/flashcards/manage?filter=inbox'
        },
        {
            id: 'personal-manage',
            title: 'Deck Manager',
            description: 'Create, edit, and organize your cards.',
            tags: ['personal'],
            actionLink: '/flashcards/manage'
        }
    ];
};

// ==================== Filter Helpers ====================

/**
 * Filter decks by matching ANY of the provided tag IDs
 */
export const filterDecksByTags = (decks: DeckDefinition[], tagIds: string[]): DeckDefinition[] => {
    if (tagIds.length === 0) return decks;
    return decks.filter(deck =>
        tagIds.some(tagId => deck.tags.includes(tagId))
    );
};

/**
 * Filter decks by matching ALL of the provided tag IDs
 */
export const filterDecksByAllTags = (decks: DeckDefinition[], tagIds: string[]): DeckDefinition[] => {
    if (tagIds.length === 0) return decks;
    return decks.filter(deck =>
        tagIds.every(tagId => deck.tags.includes(tagId))
    );
};

/**
 * Get all unique tags used across a list of decks
 */
export const getUsedTags = (decks: DeckDefinition[]): Tag[] => {
    const usedTagIds = new Set<string>();
    decks.forEach(deck => deck.tags.forEach(t => usedTagIds.add(t)));
    return ALL_TAGS.filter(tag => usedTagIds.has(tag.id));
};

/**
 * Search decks by title, description, or tag labels
 */
export const searchDecks = (decks: DeckDefinition[], query: string): DeckDefinition[] => {
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) return decks;

    return decks.filter(deck => {
        const matchTitle = deck.title.toLowerCase().includes(lowerQuery);
        const matchDesc = deck.description.toLowerCase().includes(lowerQuery);
        const matchTags = deck.tags.some(tagId => {
            const tag = getTagById(tagId);
            return tag?.label.toLowerCase().includes(lowerQuery);
        });
        return matchTitle || matchDesc || matchTags;
    });
};
