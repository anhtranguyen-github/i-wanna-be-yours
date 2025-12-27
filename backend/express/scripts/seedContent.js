/**
 * Seed Content Script
 * Seeds official (global) content for flashcards, quoot, and practice
 */

const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const { FlashcardSet } = require('../models/FlashcardSet');
const { QuootArena } = require('../models/QuootArena');
const { PracticeNode } = require('../models/PracticeNode');

// =============================================================================
// OFFICIAL FLASHCARD SETS
// =============================================================================

const officialFlashcards = [
    {
        title: 'JLPT N5 Core Vocabulary',
        description: 'Essential vocabulary for JLPT N5 level - everyday words and expressions',
        icon: '📚',
        levels: ['N5'],
        visibility: 'global',
        creatorName: 'Hanachan',
        skills: ['VOCABULARY'],
        tags: ['jlpt', 'n5', 'vocabulary', 'beginner'],
        customTags: [],
        cards: [
            { front: '食べる', back: 'to eat', reading: 'たべる' },
            { front: '飲む', back: 'to drink', reading: 'のむ' },
            { front: '行く', back: 'to go', reading: 'いく' },
            { front: '来る', back: 'to come', reading: 'くる' },
            { front: '見る', back: 'to see, to watch', reading: 'みる' },
            { front: '聞く', back: 'to listen, to hear', reading: 'きく' },
            { front: '話す', back: 'to speak, to talk', reading: 'はなす' },
            { front: '読む', back: 'to read', reading: 'よむ' },
            { front: '書く', back: 'to write', reading: 'かく' },
            { front: '買う', back: 'to buy', reading: 'かう' },
            { front: '学校', back: 'school', reading: 'がっこう' },
            { front: '先生', back: 'teacher', reading: 'せんせい' },
            { front: '学生', back: 'student', reading: 'がくせい' },
            { front: '友達', back: 'friend', reading: 'ともだち' },
            { front: '家族', back: 'family', reading: 'かぞく' }
        ]
    },
    {
        title: 'JLPT N5 Kanji Basics',
        description: 'Fundamental kanji characters for JLPT N5',
        icon: '漢',
        levels: ['N5'],
        visibility: 'global',
        creatorName: 'Hanachan',
        skills: ['KANJI'],
        tags: ['jlpt', 'n5', 'kanji', 'beginner'],
        customTags: [],
        cards: [
            { front: '日', back: 'day, sun', reading: 'にち・ひ' },
            { front: '月', back: 'month, moon', reading: 'げつ・つき' },
            { front: '火', back: 'fire', reading: 'か・ひ' },
            { front: '水', back: 'water', reading: 'すい・みず' },
            { front: '木', back: 'tree, wood', reading: 'もく・き' },
            { front: '金', back: 'gold, money', reading: 'きん・かね' },
            { front: '土', back: 'earth, soil', reading: 'ど・つち' },
            { front: '山', back: 'mountain', reading: 'さん・やま' },
            { front: '川', back: 'river', reading: 'せん・かわ' },
            { front: '人', back: 'person', reading: 'じん・ひと' }
        ]
    },
    {
        title: 'JLPT N4 Vocabulary',
        description: 'Intermediate vocabulary for JLPT N4 level',
        icon: '📖',
        levels: ['N4'],
        visibility: 'global',
        creatorName: 'Hanachan',
        skills: ['VOCABULARY'],
        tags: ['jlpt', 'n4', 'vocabulary', 'intermediate'],
        customTags: [],
        cards: [
            { front: '経験', back: 'experience', reading: 'けいけん' },
            { front: '具合', back: 'condition, health', reading: 'ぐあい' },
            { front: '準備', back: 'preparation', reading: 'じゅんび' },
            { front: '説明', back: 'explanation', reading: 'せつめい' },
            { front: '予定', back: 'schedule, plan', reading: 'よてい' },
            { front: '会議', back: 'meeting', reading: 'かいぎ' },
            { front: '連絡', back: 'contact', reading: 'れんらく' },
            { front: '相談', back: 'consultation', reading: 'そうだん' },
            { front: '紹介', back: 'introduction', reading: 'しょうかい' },
            { front: '確認', back: 'confirmation', reading: 'かくにん' }
        ]
    },
    {
        title: 'JLPT N3 Grammar Patterns',
        description: 'Key grammar patterns for JLPT N3',
        icon: '📝',
        levels: ['N3'],
        visibility: 'global',
        creatorName: 'Hanachan',
        skills: ['GRAMMAR'],
        tags: ['jlpt', 'n3', 'grammar'],
        customTags: [],
        cards: [
            { front: '〜ようにする', back: 'to try to, to make sure to', reading: 'ようにする' },
            { front: '〜ことにする', back: 'to decide to', reading: 'ことにする' },
            { front: '〜ことになる', back: 'it has been decided that', reading: 'ことになる' },
            { front: '〜ばかり', back: 'just did, nothing but', reading: 'ばかり' },
            { front: '〜てしまう', back: 'completely, unfortunately', reading: 'てしまう' },
            { front: '〜ておく', back: 'to do in advance', reading: 'ておく' },
            { front: '〜てある', back: 'has been done (state)', reading: 'てある' },
            { front: '〜ている', back: 'is doing, has done', reading: 'ている' }
        ]
    }
];

// =============================================================================
// OFFICIAL QUOOT ARENAS
// =============================================================================

const officialQuootArenas = [
    {
        title: 'N5 Vocabulary Battle',
        description: 'Test your N5 vocabulary knowledge in a fast-paced battle',
        icon: '⚔️',
        levels: ['N5'],
        visibility: 'global',
        creatorName: 'Hanachan',
        skills: ['VOCABULARY'],
        customTags: [],
        cards: [
            { front: '学校', back: 'school', reading: 'がっこう', type: 'vocabulary' },
            { front: '先生', back: 'teacher', reading: 'せんせい', type: 'vocabulary' },
            { front: '学生', back: 'student', reading: 'がくせい', type: 'vocabulary' },
            { front: '友達', back: 'friend', reading: 'ともだち', type: 'vocabulary' },
            { front: '電車', back: 'train', reading: 'でんしゃ', type: 'vocabulary' },
            { front: '病院', back: 'hospital', reading: 'びょういん', type: 'vocabulary' },
            { front: '銀行', back: 'bank', reading: 'ぎんこう', type: 'vocabulary' },
            { front: '図書館', back: 'library', reading: 'としょかん', type: 'vocabulary' },
            { front: '郵便局', back: 'post office', reading: 'ゆうびんきょく', type: 'vocabulary' },
            { front: '駅', back: 'station', reading: 'えき', type: 'vocabulary' }
        ]
    },
    {
        title: 'Kanji Speed Challenge',
        description: 'How fast can you recognize these kanji?',
        icon: '漢',
        levels: ['N5'],
        visibility: 'global',
        creatorName: 'Hanachan',
        skills: ['KANJI'],
        customTags: [],
        cards: [
            { front: '一', back: 'one', reading: 'いち', type: 'kanji' },
            { front: '二', back: 'two', reading: 'に', type: 'kanji' },
            { front: '三', back: 'three', reading: 'さん', type: 'kanji' },
            { front: '四', back: 'four', reading: 'よん・し', type: 'kanji' },
            { front: '五', back: 'five', reading: 'ご', type: 'kanji' },
            { front: '六', back: 'six', reading: 'ろく', type: 'kanji' },
            { front: '七', back: 'seven', reading: 'なな・しち', type: 'kanji' },
            { front: '八', back: 'eight', reading: 'はち', type: 'kanji' },
            { front: '九', back: 'nine', reading: 'きゅう・く', type: 'kanji' },
            { front: '十', back: 'ten', reading: 'じゅう', type: 'kanji' }
        ]
    },
    {
        title: 'N4 Vocabulary Arena',
        description: 'Intermediate vocabulary challenge for N4 learners',
        icon: '🏆',
        levels: ['N4'],
        visibility: 'global',
        creatorName: 'Hanachan',
        skills: ['VOCABULARY'],
        customTags: [],
        cards: [
            { front: '経験', back: 'experience', reading: 'けいけん', type: 'vocabulary' },
            { front: '準備', back: 'preparation', reading: 'じゅんび', type: 'vocabulary' },
            { front: '説明', back: 'explanation', reading: 'せつめい', type: 'vocabulary' },
            { front: '予定', back: 'schedule', reading: 'よてい', type: 'vocabulary' },
            { front: '会議', back: 'meeting', reading: 'かいぎ', type: 'vocabulary' },
            { front: '連絡', back: 'contact', reading: 'れんらく', type: 'vocabulary' },
            { front: '相談', back: 'consultation', reading: 'そうだん', type: 'vocabulary' },
            { front: '紹介', back: 'introduction', reading: 'しょうかい', type: 'vocabulary' }
        ]
    }
];

// =============================================================================
// OFFICIAL PRACTICE NODES
// =============================================================================

const officialPracticeNodes = [
    {
        title: 'N5 Grammar Quick Quiz',
        description: 'Test your understanding of basic N5 grammar patterns',
        mode: 'QUIZ',
        levels: ['N5'],
        visibility: 'global',
        creatorName: 'Hanachan',
        origin: 'system',
        skills: ['GRAMMAR'],
        customTags: [],
        timeLimitMinutes: 10,
        questions: [
            {
                id: 'q1',
                type: 'MULTIPLE_CHOICE',
                content: 'Choose the correct particle: 私___学生です。',
                options: [
                    { id: 'a', text: 'は' },
                    { id: 'b', text: 'が' },
                    { id: 'c', text: 'を' },
                    { id: 'd', text: 'に' }
                ],
                correctOptionId: 'a',
                explanation: 'は is the topic marker particle used to indicate the topic of the sentence.'
            },
            {
                id: 'q2',
                type: 'MULTIPLE_CHOICE',
                content: 'Complete the sentence: 本___読みます。',
                options: [
                    { id: 'a', text: 'は' },
                    { id: 'b', text: 'が' },
                    { id: 'c', text: 'を' },
                    { id: 'd', text: 'に' }
                ],
                correctOptionId: 'c',
                explanation: 'を marks the direct object of an action verb.'
            },
            {
                id: 'q3',
                type: 'MULTIPLE_CHOICE',
                content: 'Which is correct? I go to school.',
                options: [
                    { id: 'a', text: '学校を行きます' },
                    { id: 'b', text: '学校に行きます' },
                    { id: 'c', text: '学校で行きます' },
                    { id: 'd', text: '学校が行きます' }
                ],
                correctOptionId: 'b',
                explanation: 'に indicates the direction/destination of movement verbs like 行く.'
            },
            {
                id: 'q4',
                type: 'MULTIPLE_CHOICE',
                content: 'Choose the correct form: Yesterday I ___.',
                options: [
                    { id: 'a', text: '食べます' },
                    { id: 'b', text: '食べました' },
                    { id: 'c', text: '食べて' },
                    { id: 'd', text: '食べる' }
                ],
                correctOptionId: 'b',
                explanation: '〜ました is the polite past tense form.'
            },
            {
                id: 'q5',
                type: 'MULTIPLE_CHOICE',
                content: 'Which particle indicates location of action?',
                options: [
                    { id: 'a', text: 'に' },
                    { id: 'b', text: 'で' },
                    { id: 'c', text: 'を' },
                    { id: 'd', text: 'が' }
                ],
                correctOptionId: 'b',
                explanation: 'で indicates the location where an action takes place.'
            }
        ]
    },
    {
        title: 'N5 Vocabulary Recognition',
        description: 'Can you match the meaning to the word?',
        mode: 'QUIZ',
        levels: ['N5'],
        visibility: 'global',
        creatorName: 'Hanachan',
        origin: 'system',
        skills: ['VOCABULARY'],
        customTags: [],
        timeLimitMinutes: 8,
        questions: [
            {
                id: 'v1',
                type: 'MULTIPLE_CHOICE',
                content: 'What does 食べる (たべる) mean?',
                options: [
                    { id: 'a', text: 'to drink' },
                    { id: 'b', text: 'to eat' },
                    { id: 'c', text: 'to sleep' },
                    { id: 'd', text: 'to walk' }
                ],
                correctOptionId: 'b',
                explanation: '食べる means "to eat".'
            },
            {
                id: 'v2',
                type: 'MULTIPLE_CHOICE',
                content: 'What does 飲む (のむ) mean?',
                options: [
                    { id: 'a', text: 'to eat' },
                    { id: 'b', text: 'to read' },
                    { id: 'c', text: 'to drink' },
                    { id: 'd', text: 'to write' }
                ],
                correctOptionId: 'c',
                explanation: '飲む means "to drink".'
            },
            {
                id: 'v3',
                type: 'MULTIPLE_CHOICE',
                content: 'What does 学校 (がっこう) mean?',
                options: [
                    { id: 'a', text: 'hospital' },
                    { id: 'b', text: 'school' },
                    { id: 'c', text: 'library' },
                    { id: 'd', text: 'station' }
                ],
                correctOptionId: 'b',
                explanation: '学校 means "school".'
            },
            {
                id: 'v4',
                type: 'MULTIPLE_CHOICE',
                content: 'What does 先生 (せんせい) mean?',
                options: [
                    { id: 'a', text: 'student' },
                    { id: 'b', text: 'friend' },
                    { id: 'c', text: 'teacher' },
                    { id: 'd', text: 'doctor' }
                ],
                correctOptionId: 'c',
                explanation: '先生 means "teacher".'
            }
        ]
    },
    {
        title: 'N4 Grammar Practice',
        description: 'Intermediate grammar patterns for N4 level',
        mode: 'QUIZ',
        levels: ['N4'],
        visibility: 'global',
        creatorName: 'Hanachan',
        origin: 'system',
        skills: ['GRAMMAR'],
        customTags: [],
        timeLimitMinutes: 15,
        questions: [
            {
                id: 'n4g1',
                type: 'MULTIPLE_CHOICE',
                content: 'Which grammar pattern means "I decided to..."?',
                options: [
                    { id: 'a', text: '〜ことにする' },
                    { id: 'b', text: '〜ことになる' },
                    { id: 'c', text: '〜ようにする' },
                    { id: 'd', text: '〜ようになる' }
                ],
                correctOptionId: 'a',
                explanation: '〜ことにする indicates a decision made by the speaker.'
            },
            {
                id: 'n4g2',
                type: 'MULTIPLE_CHOICE',
                content: 'Complete: 毎日運動する___しています。(I try to exercise every day)',
                options: [
                    { id: 'a', text: 'こと' },
                    { id: 'b', text: 'よう' },
                    { id: 'c', text: 'ため' },
                    { id: 'd', text: 'まま' }
                ],
                correctOptionId: 'b',
                explanation: '〜ようにする means "to try to do" or "to make sure to do".'
            },
            {
                id: 'n4g3',
                type: 'MULTIPLE_CHOICE',
                content: 'Which pattern indicates an action done in preparation?',
                options: [
                    { id: 'a', text: '〜てしまう' },
                    { id: 'b', text: '〜ておく' },
                    { id: 'c', text: '〜てある' },
                    { id: 'd', text: '〜ている' }
                ],
                correctOptionId: 'b',
                explanation: '〜ておく indicates doing something in advance/preparation.'
            }
        ]
    }
];

// =============================================================================
// MAIN SEED FUNCTION
// =============================================================================

async function seedDatabase() {
    try {
        await connectDB();

        console.log('🌱 Seeding database with official content...');
        console.log('');

        // Seed Flashcards
        console.log('📚 Seeding Flashcard Sets...');
        for (const set of officialFlashcards) {
            const created = await FlashcardSet.create(set);
            console.log(`  ✓ ${set.title} (${set.cards.length} cards)`);
        }
        console.log('');

        // Seed Quoot Arenas
        console.log('⚔️ Seeding Quoot Arenas...');
        for (const arena of officialQuootArenas) {
            const created = await QuootArena.create(arena);
            console.log(`  ✓ ${arena.title} (${arena.cards.length} cards)`);
        }
        console.log('');

        // Seed Practice Nodes
        console.log('🧠 Seeding Practice Nodes...');
        for (const node of officialPracticeNodes) {
            const created = await PracticeNode.create(node);
            console.log(`  ✓ ${node.title} (${node.questions.length} questions)`);
        }
        console.log('');

        console.log('✅ Database seeded successfully!');
        console.log(`   - ${officialFlashcards.length} flashcard sets`);
        console.log(`   - ${officialQuootArenas.length} quoot arenas`);
        console.log(`   - ${officialPracticeNodes.length} practice nodes`);

        process.exit(0);
    } catch (err) {
        console.error('❌ Seed failed:', err);
        process.exit(1);
    }
}

seedDatabase();
