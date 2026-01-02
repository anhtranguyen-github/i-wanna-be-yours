/**
 * Seed Practice Nodes
 * Creates sample practice content for development
 * 
 * Run: node seeding_scripts/seedPracticeNodes.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '../../.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hanachan';

// Define schema inline for standalone script
const QuestionSchema = new mongoose.Schema({
    id: { type: String, required: true },
    type: { type: String, default: 'MULTIPLE_CHOICE' },
    content: { type: String, required: true },
    passage: { type: String, default: null },
    options: [{
        id: { type: String, required: true },
        text: { type: String, required: true }
    }],
    correctOptionId: { type: String, required: true },
    explanation: { type: String, default: '' }
}, { _id: false });

const PracticeNodeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    mode: { type: String, default: 'QUIZ' },
    level: { type: String, default: 'N5' },
    skills: [String],
    origin: { type: String, default: 'system' },
    visibility: { type: String, default: 'global' },
    creatorName: { type: String, default: 'Hanachan Official' },
    userId: { type: mongoose.Schema.Types.ObjectId, default: null },
    timeLimitMinutes: { type: Number, default: null },
    questions: [QuestionSchema],
    stats: {
        questionCount: { type: Number, default: 0 },
        avgScore: { type: Number, default: 0 },
        attemptCount: { type: Number, default: 0 }
    }
}, { timestamps: true });

const PracticeNode = mongoose.model('PracticeNode', PracticeNodeSchema);

const SEED_DATA = [
    {
        title: 'N5 Basic Vocabulary',
        description: 'Essential vocabulary for JLPT N5 beginners.',
        mode: 'QUIZ',
        level: 'N5',
        skills: ['VOCABULARY'],
        origin: 'system',
        visibility: 'global',
        creatorName: 'Hanachan Official',
        timeLimitMinutes: 10,
        questions: [
            {
                id: 'n5v-1',
                type: 'MULTIPLE_CHOICE',
                content: 'What is the meaning of 「水」?',
                options: [
                    { id: 'a', text: 'Fire' },
                    { id: 'b', text: 'Water' },
                    { id: 'c', text: 'Earth' },
                    { id: 'd', text: 'Wind' }
                ],
                correctOptionId: 'b',
                explanation: '水 (みず) means "water".'
            }
        ]
    },
    // ... keep it short for this step or copy relevant ones
    {
        title: 'N5 Essential Grammar',
        description: 'Fundamental grammar patterns for JLPT N5.',
        mode: 'QUIZ',
        level: 'N5',
        skills: ['GRAMMAR'],
        origin: 'system',
        visibility: 'global',
        creatorName: 'Hanachan Official',
        timeLimitMinutes: 15,
        questions: [
            {
                id: 'n5g-1',
                type: 'MULTIPLE_CHOICE',
                content: 'Choose the correct particle: わたし____日本人です。',
                options: [
                    { id: 'a', text: 'を' },
                    { id: 'b', text: 'は' },
                    { id: 'c', text: 'に' },
                    { id: 'd', text: 'で' }
                ],
                correctOptionId: 'b',
                explanation: 'は is the topic marker particle.'
            }
        ]
    }
];

async function seedPracticeNodes() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected successfully.');

        console.log('Clearing existing global practice protocols...');
        await PracticeNode.deleteMany({ visibility: 'global' });
        console.log('Cleared.');

        console.log('Inserting seed data...');
        for (const nodeData of SEED_DATA) {
            const node = new PracticeNode({
                ...nodeData,
                stats: {
                    questionCount: nodeData.questions.length,
                    avgScore: 0,
                    attemptCount: 0
                }
            });
            await node.save();
            console.log(`  ✓ Created: ${node.title} (${node.questions.length} questions)`);
        }

        console.log(`\n✅ Successfully seeded ${SEED_DATA.length} practice protocols!`);
        process.exit(0);
    } catch (error) {
        console.error('Error seeding practice protocols:', error);
        process.exit(1);
    }
}

seedPracticeNodes();
