/**
 * Seed JLPT Public Exams to MongoDB
 * Run with: node seeding_scripts/seed_jlpt_exams.js
 */

const mongoose = require('mongoose');
const { JLPTUserExam } = require('../models/JLPTUserExam');

// MongoDB connection (matches my_server.js)
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hanachan';

// System user ID for seeded content (placeholder ObjectId)
const SYSTEM_USER_ID = new mongoose.Types.ObjectId('000000000000000000000001');

// Public exam configurations to seed
const publicExamConfigs = [
    {
        userId: SYSTEM_USER_ID,
        config: {
            mode: 'QUIZ',
            title: 'N5 Vocabulary Quick Quiz',
            description: 'Test your essential N5 vocabulary',
            level: 'N5',
            skills: ['VOCABULARY'],
            questionCount: 10,
            timerMode: 'RELAXED',
            timeLimitMinutes: 10
        },
        questions: generateVocabQuestions('N5', 10),
        origin: 'manual',
        isPublic: true
    },
    {
        userId: SYSTEM_USER_ID,
        config: {
            mode: 'QUIZ',
            title: 'N4 Grammar Practice',
            description: 'Practice essential N4 grammar patterns',
            level: 'N4',
            skills: ['GRAMMAR'],
            questionCount: 15,
            timerMode: 'RELAXED',
            timeLimitMinutes: 15
        },
        questions: generateGrammarQuestions('N4', 15),
        origin: 'manual',
        isPublic: true
    },
    {
        userId: SYSTEM_USER_ID,
        config: {
            mode: 'SINGLE_EXAM',
            title: 'N3 Reading Comprehension',
            description: 'Practice reading passages at N3 level',
            level: 'N3',
            skills: ['READING'],
            questionCount: 10,
            timerMode: 'STRICT',
            timeLimitMinutes: 30
        },
        questions: generateReadingQuestions('N3', 10),
        origin: 'manual',
        isPublic: true
    },
    {
        userId: SYSTEM_USER_ID,
        config: {
            mode: 'FULL_EXAM',
            title: 'N5 Full Practice Exam',
            description: 'Complete N5 practice exam with all sections',
            level: 'N5',
            skills: ['VOCABULARY', 'GRAMMAR', 'READING', 'LISTENING'],
            questionCount: 30,
            timerMode: 'JLPT_STANDARD',
            timeLimitMinutes: 60
        },
        questions: generateFullExamQuestions('N5', 30),
        origin: 'manual',
        isPublic: true
    },
    {
        userId: SYSTEM_USER_ID,
        config: {
            mode: 'FULL_EXAM',
            title: 'N4 Full Practice Exam',
            description: 'Complete N4 practice exam simulation',
            level: 'N4',
            skills: ['VOCABULARY', 'GRAMMAR', 'READING', 'LISTENING'],
            questionCount: 35,
            timerMode: 'JLPT_STANDARD',
            timeLimitMinutes: 75
        },
        questions: generateFullExamQuestions('N4', 35),
        origin: 'manual',
        isPublic: true
    },
    {
        userId: SYSTEM_USER_ID,
        config: {
            mode: 'FULL_EXAM',
            title: 'N3 Full Practice Exam',
            description: 'Complete N3 practice exam with all sections',
            level: 'N3',
            skills: ['VOCABULARY', 'GRAMMAR', 'READING', 'LISTENING'],
            questionCount: 45,
            timerMode: 'JLPT_STANDARD',
            timeLimitMinutes: 105
        },
        questions: generateFullExamQuestions('N3', 45),
        origin: 'manual',
        isPublic: true
    }
];

// Question generators
function generateVocabQuestions(level, count) {
    const questions = [];
    const vocabSamples = {
        'N5': [
            { word: '水', reading: 'みず', meaning: 'water' },
            { word: '食べる', reading: 'たべる', meaning: 'to eat' },
            { word: '大きい', reading: 'おおきい', meaning: 'big' },
            { word: '学校', reading: 'がっこう', meaning: 'school' },
            { word: '友達', reading: 'ともだち', meaning: 'friend' },
            { word: '電車', reading: 'でんしゃ', meaning: 'train' },
            { word: '先生', reading: 'せんせい', meaning: 'teacher' },
            { word: '今日', reading: 'きょう', meaning: 'today' },
            { word: '明日', reading: 'あした', meaning: 'tomorrow' },
            { word: '本', reading: 'ほん', meaning: 'book' }
        ],
        'N4': [
            { word: '経験', reading: 'けいけん', meaning: 'experience' },
            { word: '準備', reading: 'じゅんび', meaning: 'preparation' },
            { word: '説明', reading: 'せつめい', meaning: 'explanation' },
            { word: '相談', reading: 'そうだん', meaning: 'consultation' },
            { word: '関係', reading: 'かんけい', meaning: 'relationship' }
        ]
    };

    const samples = vocabSamples[level] || vocabSamples['N5'];
    for (let i = 0; i < count; i++) {
        const sample = samples[i % samples.length];
        questions.push({
            id: `vocab-${level}-${i + 1}`,
            type: 'VOCABULARY',
            content: `What is the reading of「${sample.word}」?`,
            options: [
                { id: 'a', text: sample.reading },
                { id: 'b', text: 'たかい' },
                { id: 'c', text: 'はやい' },
                { id: 'd', text: 'ながい' }
            ],
            correctOptionId: 'a',
            explanation: `${sample.word} (${sample.reading}) means "${sample.meaning}".`,
            tags: { level, skills: ['VOCABULARY'] }
        });
    }
    return questions;
}

function generateGrammarQuestions(level, count) {
    const questions = [];
    const grammarSamples = [
        { pattern: '〜てから', example: 'ご飯を食べてから、勉強します。', meaning: 'After eating, I will study.' },
        { pattern: '〜ながら', example: '音楽を聞きながら、歩きます。', meaning: 'While listening to music, I walk.' },
        { pattern: '〜たほうがいい', example: '早く寝たほうがいいです。', meaning: 'You should sleep early.' }
    ];

    for (let i = 0; i < count; i++) {
        const sample = grammarSamples[i % grammarSamples.length];
        questions.push({
            id: `grammar-${level}-${i + 1}`,
            type: 'GRAMMAR',
            content: `Complete the sentence: 宿題を＿＿、遊びます。`,
            options: [
                { id: 'a', text: '終わってから' },
                { id: 'b', text: '終わりながら' },
                { id: 'c', text: '終わったり' },
                { id: 'd', text: '終わって' }
            ],
            correctOptionId: 'a',
            explanation: `「〜てから」indicates an action happens after another action is completed.`,
            tags: { level, skills: ['GRAMMAR'] }
        });
    }
    return questions;
}

function generateReadingQuestions(level, count) {
    const passage = `日本には四季があります。春は桜がきれいです。夏は暑いですが、海で泳ぐことができます。秋は紅葉を見に行きます。冬は寒いですが、温泉に入ると気持ちいいです。`;

    const questions = [];
    for (let i = 0; i < count; i++) {
        questions.push({
            id: `reading-${level}-${i + 1}`,
            type: 'READING',
            content: `Based on the passage: What is beautiful in spring?`,
            passage: passage,
            options: [
                { id: 'a', text: '桜 (cherry blossoms)' },
                { id: 'b', text: '海 (the ocean)' },
                { id: 'c', text: '紅葉 (autumn leaves)' },
                { id: 'd', text: '温泉 (hot springs)' }
            ],
            correctOptionId: 'a',
            explanation: `The passage states "春は桜がきれいです" - cherry blossoms are beautiful in spring.`,
            tags: { level, skills: ['READING'] }
        });
    }
    return questions;
}

function generateFullExamQuestions(level, count) {
    const vocabCount = Math.floor(count * 0.3);
    const grammarCount = Math.floor(count * 0.3);
    const readingCount = Math.floor(count * 0.25);
    const listeningCount = count - vocabCount - grammarCount - readingCount;

    return [
        ...generateVocabQuestions(level, vocabCount),
        ...generateGrammarQuestions(level, grammarCount),
        ...generateReadingQuestions(level, readingCount),
        // Mock listening questions
        ...Array.from({ length: listeningCount }, (_, i) => ({
            id: `listening-${level}-${i + 1}`,
            type: 'LISTENING',
            content: `[Audio Placeholder] What did the speaker say?`,
            options: [
                { id: 'a', text: '今日は天気がいいです。' },
                { id: 'b', text: '明日は雨が降ります。' },
                { id: 'c', text: '昨日は寒かったです。' },
                { id: 'd', text: '来週は暖かくなります。' }
            ],
            correctOptionId: 'a',
            explanation: `The speaker mentioned the weather is nice today.`,
            tags: { level, skills: ['LISTENING'] }
        }))
    ];
}

// Main seeding function
async function seedJLPTExams() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing public exams
        console.log('🧹 Removing existing public exams...');
        await JLPTUserExam.deleteMany({ isPublic: true, userId: SYSTEM_USER_ID });

        // Insert new exams
        console.log('📝 Inserting public exams...');
        const result = await JLPTUserExam.insertMany(publicExamConfigs);
        console.log(`✅ Successfully seeded ${result.length} public JLPT exams`);

        // Log created IDs
        result.forEach(exam => {
            console.log(`   - ${exam.config.title}: ${exam._id}`);
        });

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
    }
}

// Run if executed directly
if (require.main === module) {
    seedJLPTExams();
}

module.exports = { seedJLPTExams, publicExamConfigs };
