"use client";

import React from 'react';
import ComplexFlashcardModalKanjiFlask from "../../components/ComplexFlashcardModalKanjiFlask";
import ComplexFlashcardModalVocabFlaskSentenceMining from "../../components/ComplexFlashcardModalVocabFlaskSentenceMining";
import ComplexFlashcardModalVocabFlask from "../../components/ComplexFlashcardModalVocabFlask";
import ComplexFlashcardModalGrammarFlask from "../../components/ComplexFlashcardModalGrammarFlask";

// Debug logging
console.log("Imports Check:", {
    Kanji: ComplexFlashcardModalKanjiFlask,
    VocabMining: ComplexFlashcardModalVocabFlaskSentenceMining,
    VocabFlask: ComplexFlashcardModalVocabFlask,
    GrammarFlask: ComplexFlashcardModalGrammarFlask
});

export type DeckCategory = 'kanji' | 'vocabulary' | 'grammar' | 'personal';

export interface DeckDefinition {
    id: string; // Unique ID for key
    title: string;
    description: string;
    category: DeckCategory;
    level?: string;
    component?: React.ReactNode; // The modal component to render
    actionLink?: string; // Or a link if it's a page navigation
    locked?: boolean; // If true, requires login (logic handled in renderer)
}

// Helper to generate public deck definitions
export const getPublicDecks = (userId: string | null): DeckDefinition[] => {
    const effectiveUserId = userId || "";
    const decks: DeckDefinition[] = [];

    // --- Vocabulary ---
    decks.push({
        id: 'vocab-sentence-mining',
        title: 'Sentence Mining: Verbs',
        description: 'Context-based vocabulary learning.',
        category: 'vocabulary',
        level: 'Mixed',
        component: <ComplexFlashcardModalVocabFlaskSentenceMining
            userId={effectiveUserId}
            collectionName="vocabulary"
            p_tag="sentence_mining"
            s_tag="verbs-1"
        />
    });

    const vocabLevels = [
        "verbs-1", "verbs-2", "verbs-3", "verbs-4",
        "verbs-5", "verbs-6", "verbs-7", "verbs-8"
    ];
    vocabLevels.forEach((part, index) => {
        decks.push({
            id: `vocab-essential-${part}`,
            title: `Essential Verbs Vol. ${index + 1}`,
            description: 'Core 600 Essential Japanese Verbs',
            category: 'vocabulary',
            level: 'Beginner',
            component: <ComplexFlashcardModalVocabFlask
                userId={effectiveUserId}
                collectionName="words"
                p_tag="essential_600_verbs"
                s_tag={part}
            />
        });
    });

    const suruVocabLevels = [
        "verbs-1", "verbs-2", "verbs-3", "verbs-4", "verbs-5", "verbs-6"
    ];
    suruVocabLevels.forEach((part, index) => {
        decks.push({
            id: `vocab-suru-${part}`,
            title: `Suru Verbs Vol. ${index + 1}`,
            description: 'Essential Suru Verbs',
            category: 'vocabulary',
            level: 'Beginner',
            component: <ComplexFlashcardModalVocabFlask
                userId={effectiveUserId}
                collectionName="words"
                p_tag="suru_essential_600_verbs"
                s_tag={part}
            />
        });
    });

    // --- Grammar ---
    const grammarLevels = ["JLPT_N5", "JLPT_N4", "JLPT_N3", "JLPT_N2", "JLPT_N1"];
    grammarLevels.forEach((level) => {
        decks.push({
            id: `grammar-${level}`,
            title: `Grammar ${level.replace('_', ' ')}`,
            description: `Complete grammar guide for ${level.replace('_', ' ')}`,
            category: 'grammar',
            level: level.split('_')[1],
            component: <ComplexFlashcardModalGrammarFlask
                userId={effectiveUserId}
                collectionName="grammars"
                p_tag={level}
                s_tag="all"
            />
        });
    });

    // --- Kanji ---
    // N3
    const n3Parts = ["part_1", "part_2", "part_3", "part_4", "part_5", "part_6"];
    n3Parts.forEach((part, idx) => {
        decks.push({
            id: `kanji-n3-${part}`,
            title: `Kanji N3 Part ${idx + 1}`,
            description: 'Intermediate Kanji readings',
            category: 'kanji',
            level: 'N3',
            component: <ComplexFlashcardModalKanjiFlask
                userId={effectiveUserId}
                collectionName="kanji"
                p_tag="JLPT_N3"
                s_tag={part}
            />
        });
    });

    // N4
    const n4Parts = ["part_1", "part_2", "part_3"];
    n4Parts.forEach((part, idx) => {
        decks.push({
            id: `kanji-n4-${part}`,
            title: `Kanji N4 Part ${idx + 1}`,
            description: 'Upper Beginner Kanji',
            category: 'kanji',
            level: 'N4',
            component: <ComplexFlashcardModalKanjiFlask
                userId={effectiveUserId}
                collectionName="kanji"
                p_tag="JLPT_N4"
                s_tag={part}
            />
        });
    });

    // N5
    decks.push({
        id: `kanji-n5-part1`,
        title: `Kanji N5 Part 1`,
        description: 'Basic Kanji',
        category: 'kanji',
        level: 'N5',
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
            category: 'personal',
            actionLink: '/flashcards/study'
        },
        {
            id: 'personal-inbox',
            title: 'Inbox',
            description: 'New cards waiting for your review.',
            category: 'personal',
            actionLink: '/flashcards/manage?filter=inbox'
        },
        {
            id: 'personal-manage',
            title: 'Deck Manager',
            description: 'Create, edit, and Organize your cards.',
            category: 'personal',
            actionLink: '/flashcards/manage'
        }
    ];
};
