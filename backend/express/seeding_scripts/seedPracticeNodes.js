/**
 * Seed Practice Nodes
 * Creates sample practice content for development
 * 
 * Run: node seeding_scripts/seedPracticeNodes.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/zenRelationshipsAutomated';

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
    isPublic: { type: Boolean, default: true },
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
    // N5 Vocabulary Quiz
    {
        title: 'N5 Basic Vocabulary',
        description: 'Essential vocabulary for JLPT N5 beginners. Practice common words used in daily life.',
        mode: 'QUIZ',
        level: 'N5',
        skills: ['VOCABULARY'],
        origin: 'system',
        isPublic: true,
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
            },
            {
                id: 'n5v-2',
                type: 'MULTIPLE_CHOICE',
                content: 'What is the meaning of 「本」?',
                options: [
                    { id: 'a', text: 'Pen' },
                    { id: 'b', text: 'Notebook' },
                    { id: 'c', text: 'Book' },
                    { id: 'd', text: 'Paper' }
                ],
                correctOptionId: 'c',
                explanation: '本 (ほん) means "book".'
            },
            {
                id: 'n5v-3',
                type: 'MULTIPLE_CHOICE',
                content: 'What is the meaning of 「犬」?',
                options: [
                    { id: 'a', text: 'Cat' },
                    { id: 'b', text: 'Bird' },
                    { id: 'c', text: 'Fish' },
                    { id: 'd', text: 'Dog' }
                ],
                correctOptionId: 'd',
                explanation: '犬 (いぬ) means "dog".'
            },
            {
                id: 'n5v-4',
                type: 'MULTIPLE_CHOICE',
                content: 'What is the meaning of 「食べる」?',
                options: [
                    { id: 'a', text: 'To drink' },
                    { id: 'b', text: 'To eat' },
                    { id: 'c', text: 'To sleep' },
                    { id: 'd', text: 'To walk' }
                ],
                correctOptionId: 'b',
                explanation: '食べる (たべる) means "to eat".'
            },
            {
                id: 'n5v-5',
                type: 'MULTIPLE_CHOICE',
                content: 'What is the meaning of 「学校」?',
                options: [
                    { id: 'a', text: 'Hospital' },
                    { id: 'b', text: 'Station' },
                    { id: 'c', text: 'School' },
                    { id: 'd', text: 'Library' }
                ],
                correctOptionId: 'c',
                explanation: '学校 (がっこう) means "school".'
            }
        ]
    },
    // N5 Grammar Quiz
    {
        title: 'N5 Essential Grammar',
        description: 'Fundamental grammar patterns for JLPT N5. Master basic sentence structures.',
        mode: 'QUIZ',
        level: 'N5',
        skills: ['GRAMMAR'],
        origin: 'system',
        isPublic: true,
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
            },
            {
                id: 'n5g-2',
                type: 'MULTIPLE_CHOICE',
                content: 'Choose the correct form: きのう、えいが____見ました。',
                options: [
                    { id: 'a', text: 'は' },
                    { id: 'b', text: 'が' },
                    { id: 'c', text: 'を' },
                    { id: 'd', text: 'に' }
                ],
                correctOptionId: 'c',
                explanation: 'を marks the direct object of the verb.'
            },
            {
                id: 'n5g-3',
                type: 'MULTIPLE_CHOICE',
                content: 'How do you say "I want to eat sushi" in Japanese?',
                options: [
                    { id: 'a', text: 'すしを食べます' },
                    { id: 'b', text: 'すしが食べたいです' },
                    { id: 'c', text: 'すしを食べました' },
                    { id: 'd', text: 'すしは食べます' }
                ],
                correctOptionId: 'b',
                explanation: '~たい form expresses wanting to do something.'
            },
            {
                id: 'n5g-4',
                type: 'MULTIPLE_CHOICE',
                content: 'Which is the correct negative form of 「行く」?',
                options: [
                    { id: 'a', text: '行きません' },
                    { id: 'b', text: '行くません' },
                    { id: 'c', text: '行かない' },
                    { id: 'd', text: 'Both A and C' }
                ],
                correctOptionId: 'd',
                explanation: '行きません is polite negative, 行かない is plain negative.'
            }
        ]
    },
    // N4 Reading Comprehension
    {
        title: 'N4 Reading Practice',
        description: 'Intermediate reading comprehension for JLPT N4. Improve your reading skills.',
        mode: 'QUIZ',
        level: 'N4',
        skills: ['READING'],
        origin: 'system',
        isPublic: true,
        timeLimitMinutes: 20,
        questions: [
            {
                id: 'n4r-1',
                type: 'MULTIPLE_CHOICE',
                passage: '田中さんは毎朝6時に起きます。朝ごはんを食べてから、7時に家を出ます。会社まで電車で30分かかります。',
                content: '田中さんは何時に家を出ますか。',
                options: [
                    { id: 'a', text: '6時' },
                    { id: 'b', text: '6時半' },
                    { id: 'c', text: '7時' },
                    { id: 'd', text: '7時半' }
                ],
                correctOptionId: 'c',
                explanation: 'The passage says 7時に家を出ます (leaves home at 7 o\'clock).'
            },
            {
                id: 'n4r-2',
                type: 'MULTIPLE_CHOICE',
                passage: '田中さんは毎朝6時に起きます。朝ごはんを食べてから、7時に家を出ます。会社まで電車で30分かかります。',
                content: '田中さんは会社にどうやって行きますか。',
                options: [
                    { id: 'a', text: 'バスで' },
                    { id: 'b', text: '電車で' },
                    { id: 'c', text: '車で' },
                    { id: 'd', text: '歩いて' }
                ],
                correctOptionId: 'b',
                explanation: 'The passage mentions 電車で (by train).'
            },
            {
                id: 'n4r-3',
                type: 'MULTIPLE_CHOICE',
                passage: '私の趣味は料理をすることです。週末によく新しいレシピを試します。特にイタリア料理が好きです。',
                content: 'この人は何をするのが好きですか。',
                options: [
                    { id: 'a', text: '本を読むこと' },
                    { id: 'b', text: '音楽を聞くこと' },
                    { id: 'c', text: '料理をすること' },
                    { id: 'd', text: '映画を見ること' }
                ],
                correctOptionId: 'c',
                explanation: 'The passage states 趣味は料理をすること (hobby is cooking).'
            }
        ]
    },
    // N3 Mixed Skills Exam
    {
        title: 'N3 Comprehensive Practice',
        description: 'Mixed skills practice for JLPT N3. Test vocabulary, grammar, and reading together.',
        mode: 'SINGLE_EXAM',
        level: 'N3',
        skills: ['VOCABULARY', 'GRAMMAR', 'READING'],
        origin: 'system',
        isPublic: true,
        timeLimitMinutes: 30,
        questions: [
            {
                id: 'n3m-1',
                type: 'MULTIPLE_CHOICE',
                content: '彼女は約束を____。',
                options: [
                    { id: 'a', text: '守った' },
                    { id: 'b', text: '守る' },
                    { id: 'c', text: '守らない' },
                    { id: 'd', text: '守り' }
                ],
                correctOptionId: 'a',
                explanation: '約束を守る means to keep a promise. Past tense is 守った.'
            },
            {
                id: 'n3m-2',
                type: 'MULTIPLE_CHOICE',
                content: 'この問題は____難しくて、誰も解けなかった。',
                options: [
                    { id: 'a', text: 'ちょっと' },
                    { id: 'b', text: 'あまり' },
                    { id: 'c', text: 'たいへん' },
                    { id: 'd', text: 'ほとんど' }
                ],
                correctOptionId: 'c',
                explanation: 'たいへん (very/extremely) fits the context of nobody being able to solve it.'
            },
            {
                id: 'n3m-3',
                type: 'MULTIPLE_CHOICE',
                content: '「延期」の読み方は？',
                options: [
                    { id: 'a', text: 'えんき' },
                    { id: 'b', text: 'えんご' },
                    { id: 'c', text: 'のべき' },
                    { id: 'd', text: 'えんぎ' }
                ],
                correctOptionId: 'a',
                explanation: '延期 is read as えんき and means postponement.'
            },
            {
                id: 'n3m-4',
                type: 'MULTIPLE_CHOICE',
                passage: '最近、在宅勤務が増えている。しかし、自宅で仕事をすると集中できないという人も多い。',
                content: 'この文章によると、在宅勤務の問題は何ですか。',
                options: [
                    { id: 'a', text: '仕事が増えること' },
                    { id: 'b', text: '集中しにくいこと' },
                    { id: 'c', text: '通勤時間が長いこと' },
                    { id: 'd', text: '給料が下がること' }
                ],
                correctOptionId: 'b',
                explanation: 'The passage mentions 集中できない (cannot concentrate).'
            },
            {
                id: 'n3m-5',
                type: 'MULTIPLE_CHOICE',
                content: '会議が終わり____、すぐに連絡してください。',
                options: [
                    { id: 'a', text: '次第' },
                    { id: 'b', text: 'ながら' },
                    { id: 'c', text: 'つつ' },
                    { id: 'd', text: 'ばかり' }
                ],
                correctOptionId: 'a',
                explanation: '～次第 means "as soon as".'
            }
        ]
    },
    // N2 Kanji Focus
    {
        title: 'N2 Kanji Mastery',
        description: 'Advanced kanji readings and meanings for JLPT N2.',
        mode: 'QUIZ',
        level: 'N2',
        skills: ['KANJI', 'VOCABULARY'],
        origin: 'system',
        isPublic: true,
        timeLimitMinutes: 15,
        questions: [
            {
                id: 'n2k-1',
                type: 'MULTIPLE_CHOICE',
                content: '「把握」の読み方は？',
                options: [
                    { id: 'a', text: 'はあく' },
                    { id: 'b', text: 'ばあく' },
                    { id: 'c', text: 'はにぎ' },
                    { id: 'd', text: 'ひあく' }
                ],
                correctOptionId: 'a',
                explanation: '把握 (はあく) means to grasp/understand.'
            },
            {
                id: 'n2k-2',
                type: 'MULTIPLE_CHOICE',
                content: '「曖昧」の意味は？',
                options: [
                    { id: 'a', text: 'Clear' },
                    { id: 'b', text: 'Ambiguous' },
                    { id: 'c', text: 'Bright' },
                    { id: 'd', text: 'Dark' }
                ],
                correctOptionId: 'b',
                explanation: '曖昧 (あいまい) means ambiguous/vague.'
            },
            {
                id: 'n2k-3',
                type: 'MULTIPLE_CHOICE',
                content: '「促進」の意味は？',
                options: [
                    { id: 'a', text: 'To delay' },
                    { id: 'b', text: 'To cancel' },
                    { id: 'c', text: 'To promote/accelerate' },
                    { id: 'd', text: 'To restrict' }
                ],
                correctOptionId: 'c',
                explanation: '促進 (そくしん) means to promote or accelerate.'
            }
        ]
    },
    // N1 Challenge
    {
        title: 'N1 Challenge Questions',
        description: 'High-level questions for N1 candidates. Test your advanced Japanese.',
        mode: 'SINGLE_EXAM',
        level: 'N1',
        skills: ['VOCABULARY', 'GRAMMAR', 'READING'],
        origin: 'system',
        isPublic: true,
        timeLimitMinutes: 25,
        questions: [
            {
                id: 'n1c-1',
                type: 'MULTIPLE_CHOICE',
                content: '彼の発言は____に値する。',
                options: [
                    { id: 'a', text: '賞賛' },
                    { id: 'b', text: '批判' },
                    { id: 'c', text: '無視' },
                    { id: 'd', text: '検討' }
                ],
                correctOptionId: 'd',
                explanation: '検討に値する means "worth considering".'
            },
            {
                id: 'n1c-2',
                type: 'MULTIPLE_CHOICE',
                content: '____からには、最後までやり遂げなければならない。',
                options: [
                    { id: 'a', text: '始めた' },
                    { id: 'b', text: '始める' },
                    { id: 'c', text: '始め' },
                    { id: 'd', text: '始めて' }
                ],
                correctOptionId: 'a',
                explanation: '～からには requires the plain past form.'
            },
            {
                id: 'n1c-3',
                type: 'MULTIPLE_CHOICE',
                content: '「危惧」の類義語は？',
                options: [
                    { id: 'a', text: '安心' },
                    { id: 'b', text: '懸念' },
                    { id: 'c', text: '希望' },
                    { id: 'd', text: '確信' }
                ],
                correctOptionId: 'b',
                explanation: '危惧 and 懸念 both mean concern/worry.'
            }
        ]
    }
];

async function seedPracticeNodes() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected successfully.');

        // Clear existing practice nodes
        console.log('Clearing existing practice nodes...');
        await PracticeNode.deleteMany({ origin: 'system' });
        console.log('Cleared.');

        // Insert seed data
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

        console.log(`\n✅ Successfully seeded ${SEED_DATA.length} practice nodes!`);
        process.exit(0);
    } catch (error) {
        console.error('Error seeding practice nodes:', error);
        process.exit(1);
    }
}

seedPracticeNodes();
