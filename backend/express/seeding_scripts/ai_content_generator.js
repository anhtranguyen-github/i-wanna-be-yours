/**
 * AI Content Generator
 * Autonomous content generation for all discovered content patterns
 * 
 * Pattern Inventory:
 * 1. JLPTUserExam - JLPT practice exams
 * 2. Quiz - Quiz questions with scoring
 * 3. Grammar - Grammar explanations
 * 4. Kanji - Kanji characters
 * 5. Word/TanosWord - Vocabulary words
 * 6. Sentence - Example sentences
 * 7. Reading - Reading comprehension passages
 * 8. Deck/DeckCard - Flashcard decks
 */

const mongoose = require('mongoose');
const { JLPTUserExam } = require('../models/JLPTUserExam');
const { Grammar } = require('../models/grammar');
const { Kanji } = require('../models/kanji');
const { Word } = require('../models/word');
const { TanosWord } = require('../models/wordTanos');
const { Sentence } = require('../models/sentence');
const { Reading } = require('../models/reading');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hanachan';
const SYSTEM_USER_ID = new mongoose.Types.ObjectId('000000000000000000000001');

// AI Generated Content Collection
const aiGeneratedContentSchema = new mongoose.Schema({
    pattern_type: { type: String, required: true, index: true },
    content: mongoose.Schema.Types.Mixed,
    tags: { type: [String], default: ['private', 'ai-generated'] },
    status: { type: String, default: 'active' },
    generated_at: { type: Date, default: Date.now }
}, { timestamps: true });

const AIGeneratedContent = mongoose.model('AIGeneratedContent', aiGeneratedContentSchema, 'ai_generated_contents');

// ===== CONTENT GENERATORS =====

function generateJLPTExamContent() {
    const levels = ['N5', 'N4', 'N3', 'N2', 'N1'];
    const modes = ['QUIZ', 'SINGLE_EXAM', 'FULL_EXAM'];
    const contents = [];

    for (const level of levels) {
        for (const mode of modes) {
            contents.push({
                pattern_type: 'JLPTUserExam',
                content: {
                    userId: SYSTEM_USER_ID,
                    config: {
                        mode: mode,
                        title: `AI ${level} ${mode.replace('_', ' ')} Practice`,
                        description: `AI-generated ${level} level ${mode.toLowerCase().replace('_', ' ')} for comprehensive practice`,
                        level: level,
                        skills: ['VOCABULARY', 'GRAMMAR', 'READING'],
                        questionCount: mode === 'FULL_EXAM' ? 50 : mode === 'SINGLE_EXAM' ? 25 : 10,
                        timerMode: mode === 'FULL_EXAM' ? 'JLPT_STANDARD' : 'RELAXED',
                        timeLimitMinutes: mode === 'FULL_EXAM' ? 90 : mode === 'SINGLE_EXAM' ? 30 : 10
                    },
                    questions: generateQuestionsForLevel(level, mode === 'FULL_EXAM' ? 50 : mode === 'SINGLE_EXAM' ? 25 : 10),
                    origin: 'chatbot',
                    isPublic: true
                },
                tags: ['private', 'ai-generated'],
                status: 'active'
            });
        }
    }
    return contents;
}

function generateQuestionsForLevel(level, count) {
    const questions = [];
    const vocabData = {
        'N5': [
            { word: '水', reading: 'みず', meaning: 'water' },
            { word: '火', reading: 'ひ', meaning: 'fire' },
            { word: '山', reading: 'やま', meaning: 'mountain' },
            { word: '川', reading: 'かわ', meaning: 'river' },
            { word: '木', reading: 'き', meaning: 'tree' },
            { word: '花', reading: 'はな', meaning: 'flower' },
            { word: '空', reading: 'そら', meaning: 'sky' },
            { word: '海', reading: 'うみ', meaning: 'sea' },
            { word: '雨', reading: 'あめ', meaning: 'rain' },
            { word: '雪', reading: 'ゆき', meaning: 'snow' }
        ],
        'N4': [
            { word: '経験', reading: 'けいけん', meaning: 'experience' },
            { word: '準備', reading: 'じゅんび', meaning: 'preparation' },
            { word: '説明', reading: 'せつめい', meaning: 'explanation' },
            { word: '相談', reading: 'そうだん', meaning: 'consultation' },
            { word: '関係', reading: 'かんけい', meaning: 'relationship' },
            { word: '練習', reading: 'れんしゅう', meaning: 'practice' },
            { word: '質問', reading: 'しつもん', meaning: 'question' },
            { word: '答え', reading: 'こたえ', meaning: 'answer' },
            { word: '問題', reading: 'もんだい', meaning: 'problem' },
            { word: '結果', reading: 'けっか', meaning: 'result' }
        ],
        'N3': [
            { word: '環境', reading: 'かんきょう', meaning: 'environment' },
            { word: '社会', reading: 'しゃかい', meaning: 'society' },
            { word: '技術', reading: 'ぎじゅつ', meaning: 'technology' },
            { word: '文化', reading: 'ぶんか', meaning: 'culture' },
            { word: '政治', reading: 'せいじ', meaning: 'politics' },
            { word: '経済', reading: 'けいざい', meaning: 'economy' },
            { word: '教育', reading: 'きょういく', meaning: 'education' },
            { word: '研究', reading: 'けんきゅう', meaning: 'research' },
            { word: '発展', reading: 'はってん', meaning: 'development' },
            { word: '影響', reading: 'えいきょう', meaning: 'influence' }
        ],
        'N2': [
            { word: '概念', reading: 'がいねん', meaning: 'concept' },
            { word: '理論', reading: 'りろん', meaning: 'theory' },
            { word: '前提', reading: 'ぜんてい', meaning: 'premise' },
            { word: '根拠', reading: 'こんきょ', meaning: 'basis' },
            { word: '傾向', reading: 'けいこう', meaning: 'tendency' },
            { word: '現象', reading: 'げんしょう', meaning: 'phenomenon' },
            { word: '要因', reading: 'よういん', meaning: 'factor' },
            { word: '背景', reading: 'はいけい', meaning: 'background' },
            { word: '構造', reading: 'こうぞう', meaning: 'structure' },
            { word: '機能', reading: 'きのう', meaning: 'function' }
        ],
        'N1': [
            { word: '斬新', reading: 'ざんしん', meaning: 'novel/innovative' },
            { word: '顕著', reading: 'けんちょ', meaning: 'remarkable' },
            { word: '曖昧', reading: 'あいまい', meaning: 'ambiguous' },
            { word: '恣意', reading: 'しい', meaning: 'arbitrary' },
            { word: '脆弱', reading: 'ぜいじゃく', meaning: 'fragile' },
            { word: '逸脱', reading: 'いつだつ', meaning: 'deviation' },
            { word: '遵守', reading: 'じゅんしゅ', meaning: 'compliance' },
            { word: '齟齬', reading: 'そご', meaning: 'discrepancy' },
            { word: '瑕疵', reading: 'かし', meaning: 'defect' },
            { word: '忖度', reading: 'そんたく', meaning: 'conjecture' }
        ]
    };

    const levelData = vocabData[level] || vocabData['N5'];

    for (let i = 0; i < count; i++) {
        const item = levelData[i % levelData.length];
        questions.push({
            id: `ai-${level}-q${i + 1}`,
            type: i % 2 === 0 ? 'VOCABULARY' : 'GRAMMAR',
            content: `What is the reading of「${item.word}」?`,
            options: [
                { id: 'a', text: item.reading },
                { id: 'b', text: 'たかい' },
                { id: 'c', text: 'はやい' },
                { id: 'd', text: 'ながい' }
            ],
            correctOptionId: 'a',
            explanation: `${item.word} (${item.reading}) means "${item.meaning}".`,
            tags: { level, skills: ['VOCABULARY'] }
        });
    }
    return questions;
}

function generateGrammarContent() {
    const contents = [];
    const grammarPatterns = [
        {
            title: '〜てから',
            short_explanation: 'After doing ~',
            long_explanation: 'This pattern indicates that one action happens after another action is completed. It emphasizes the sequence of events.',
            formation: 'Verb て-form + から',
            examples: [
                { jp: 'ご飯を食べてから、勉強します。', romaji: 'Gohan wo tabete kara, benkyou shimasu.', en: 'After eating, I will study.' },
                { jp: '仕事が終わってから、飲みに行きましょう。', romaji: 'Shigoto ga owatte kara, nomi ni ikimashou.', en: 'After work is finished, let\'s go drinking.' }
            ],
            p_tag: 'JLPT_N4',
            s_tag: 'grammar-001'
        },
        {
            title: '〜ながら',
            short_explanation: 'While doing ~',
            long_explanation: 'This pattern is used to describe two actions happening simultaneously. The main action comes at the end of the sentence.',
            formation: 'Verb stem + ながら',
            examples: [
                { jp: '音楽を聞きながら、歩きます。', romaji: 'Ongaku wo kikinagara, arukimasu.', en: 'I walk while listening to music.' },
                { jp: 'テレビを見ながら、ご飯を食べます。', romaji: 'Terebi wo minagara, gohan wo tabemasu.', en: 'I eat while watching TV.' }
            ],
            p_tag: 'JLPT_N4',
            s_tag: 'grammar-002'
        },
        {
            title: '〜たほうがいい',
            short_explanation: 'Should/Had better ~',
            long_explanation: 'This pattern is used to give advice or make suggestions. It implies that doing the action would be beneficial.',
            formation: 'Verb た-form + ほうがいい',
            examples: [
                { jp: '早く寝たほうがいいですよ。', romaji: 'Hayaku neta hou ga ii desu yo.', en: 'You should sleep early.' },
                { jp: '傘を持っていったほうがいいです。', romaji: 'Kasa wo motte itta hou ga ii desu.', en: 'You should take an umbrella.' }
            ],
            p_tag: 'JLPT_N4',
            s_tag: 'grammar-003'
        },
        {
            title: '〜なければならない',
            short_explanation: 'Must/Have to ~',
            long_explanation: 'This pattern expresses obligation or necessity. It indicates that something must be done.',
            formation: 'Verb ない-form (without ない) + なければならない',
            examples: [
                { jp: '毎日勉強しなければなりません。', romaji: 'Mainichi benkyou shinakereba narimasen.', en: 'I must study every day.' },
                { jp: '薬を飲まなければならない。', romaji: 'Kusuri wo nomanakereba naranai.', en: 'I have to take medicine.' }
            ],
            p_tag: 'JLPT_N4',
            s_tag: 'grammar-004'
        },
        {
            title: '〜ようにする',
            short_explanation: 'Try to ~/ Make sure to ~',
            long_explanation: 'This pattern is used to express an effort or intention to do something habitually or to make something happen.',
            formation: 'Verb dictionary form + ようにする',
            examples: [
                { jp: '毎日運動するようにしています。', romaji: 'Mainichi undou suru you ni shite imasu.', en: 'I try to exercise every day.' },
                { jp: '野菜を食べるようにしてください。', romaji: 'Yasai wo taberu you ni shite kudasai.', en: 'Please try to eat vegetables.' }
            ],
            p_tag: 'JLPT_N3',
            s_tag: 'grammar-005'
        }
    ];

    for (const grammar of grammarPatterns) {
        contents.push({
            pattern_type: 'Grammar',
            content: grammar,
            tags: ['private', 'ai-generated'],
            status: 'active'
        });
    }
    return contents;
}

function generateKanjiContent() {
    const contents = [];
    const kanjiData = [
        { kanji: '愛', reading: 'あい', translation: 'love', exampleWord: '愛情', exampleReading: 'あいじょう', p_tag: 'JLPT_N3', s_tag: 'kanji-001' },
        { kanji: '夢', reading: 'ゆめ', translation: 'dream', exampleWord: '夢想', exampleReading: 'むそう', p_tag: 'JLPT_N3', s_tag: 'kanji-002' },
        { kanji: '希', reading: 'き', translation: 'hope', exampleWord: '希望', exampleReading: 'きぼう', p_tag: 'JLPT_N2', s_tag: 'kanji-003' },
        { kanji: '望', reading: 'ぼう', translation: 'desire', exampleWord: '願望', exampleReading: 'がんぼう', p_tag: 'JLPT_N2', s_tag: 'kanji-004' },
        { kanji: '努', reading: 'ど', translation: 'effort', exampleWord: '努力', exampleReading: 'どりょく', p_tag: 'JLPT_N3', s_tag: 'kanji-005' },
        { kanji: '力', reading: 'りょく', translation: 'power', exampleWord: '能力', exampleReading: 'のうりょく', p_tag: 'JLPT_N4', s_tag: 'kanji-006' },
        { kanji: '勇', reading: 'ゆう', translation: 'courage', exampleWord: '勇気', exampleReading: 'ゆうき', p_tag: 'JLPT_N2', s_tag: 'kanji-007' },
        { kanji: '気', reading: 'き', translation: 'spirit', exampleWord: '元気', exampleReading: 'げんき', p_tag: 'JLPT_N5', s_tag: 'kanji-008' },
        { kanji: '心', reading: 'こころ', translation: 'heart', exampleWord: '心配', exampleReading: 'しんぱい', p_tag: 'JLPT_N4', s_tag: 'kanji-009' },
        { kanji: '魂', reading: 'たましい', translation: 'soul', exampleWord: '霊魂', exampleReading: 'れいこん', p_tag: 'JLPT_N1', s_tag: 'kanji-010' }
    ];

    for (const kanji of kanjiData) {
        contents.push({
            pattern_type: 'Kanji',
            content: kanji,
            tags: ['private', 'ai-generated'],
            status: 'active'
        });
    }
    return contents;
}

function generateWordContent() {
    const contents = [];
    const words = [
        { vocabulary_original: '挑戦', vocabulary_simplified: 'ちょうせん', vocabulary_english: 'challenge', word_type: 'noun', p_tag: 'JLPT_N2', s_tag: 'vocab-001' },
        { vocabulary_original: '成功', vocabulary_simplified: 'せいこう', vocabulary_english: 'success', word_type: 'noun', p_tag: 'JLPT_N3', s_tag: 'vocab-002' },
        { vocabulary_original: '失敗', vocabulary_simplified: 'しっぱい', vocabulary_english: 'failure', word_type: 'noun', p_tag: 'JLPT_N3', s_tag: 'vocab-003' },
        { vocabulary_original: '決意', vocabulary_simplified: 'けつい', vocabulary_english: 'determination', word_type: 'noun', p_tag: 'JLPT_N2', s_tag: 'vocab-004' },
        { vocabulary_original: '進歩', vocabulary_simplified: 'しんぽ', vocabulary_english: 'progress', word_type: 'noun', p_tag: 'JLPT_N3', s_tag: 'vocab-005' },
        { vocabulary_original: '継続', vocabulary_simplified: 'けいぞく', vocabulary_english: 'continuation', word_type: 'noun', p_tag: 'JLPT_N2', s_tag: 'vocab-006' },
        { vocabulary_original: '忍耐', vocabulary_simplified: 'にんたい', vocabulary_english: 'patience', word_type: 'noun', p_tag: 'JLPT_N1', s_tag: 'vocab-007' },
        { vocabulary_original: '達成', vocabulary_simplified: 'たっせい', vocabulary_english: 'achievement', word_type: 'noun', p_tag: 'JLPT_N2', s_tag: 'vocab-008' },
        { vocabulary_original: '向上', vocabulary_simplified: 'こうじょう', vocabulary_english: 'improvement', word_type: 'noun', p_tag: 'JLPT_N2', s_tag: 'vocab-009' },
        { vocabulary_original: '克服', vocabulary_simplified: 'こくふく', vocabulary_english: 'overcoming', word_type: 'noun', p_tag: 'JLPT_N1', s_tag: 'vocab-010' }
    ];

    for (const word of words) {
        contents.push({
            pattern_type: 'Word',
            content: word,
            tags: ['private', 'ai-generated'],
            status: 'active'
        });
    }
    return contents;
}

function generateSentenceContent() {
    const contents = [];
    const sentences = [
        {
            sentence_original: '日本語の勉強は毎日続けることが大切です。',
            sentence_simplified: 'にほんごのべんきょうはまいにちつづけることがたいせつです。',
            sentence_romaji: 'Nihongo no benkyou wa mainichi tsuzukeru koto ga taisetsu desu.',
            sentence_english: 'It is important to continue studying Japanese every day.',
            key: 'ai-sentence-001'
        },
        {
            sentence_original: '失敗を恐れずに挑戦することが成功への道です。',
            sentence_simplified: 'しっぱいをおそれずにちょうせんすることがせいこうへのみちです。',
            sentence_romaji: 'Shippai wo osorezu ni chousen suru koto ga seikou he no michi desu.',
            sentence_english: 'Challenging without fearing failure is the path to success.',
            key: 'ai-sentence-002'
        },
        {
            sentence_original: '努力なしには何も達成できません。',
            sentence_simplified: 'どりょくなしにはなにもたっせいできません。',
            sentence_romaji: 'Doryoku nashi ni wa nani mo tassei dekimasen.',
            sentence_english: 'Without effort, nothing can be achieved.',
            key: 'ai-sentence-003'
        },
        {
            sentence_original: '継続は力なりと言われています。',
            sentence_simplified: 'けいぞくはちからなりといわれています。',
            sentence_romaji: 'Keizoku wa chikara nari to iwarete imasu.',
            sentence_english: 'It is said that persistence is power.',
            key: 'ai-sentence-004'
        },
        {
            sentence_original: '夢を諦めないでください。',
            sentence_simplified: 'ゆめをあきらめないでください。',
            sentence_romaji: 'Yume wo akiramenaide kudasai.',
            sentence_english: 'Please do not give up on your dreams.',
            key: 'ai-sentence-005'
        }
    ];

    for (const sentence of sentences) {
        contents.push({
            pattern_type: 'Sentence',
            content: sentence,
            tags: ['private', 'ai-generated'],
            status: 'active'
        });
    }
    return contents;
}

function generateReadingContent() {
    const contents = [];
    const readings = [
        {
            key: 'ai-reading-001',
            title: 'The Four Seasons',
            titleRomaji: 'Shiki',
            titleJp: '四季',
            p_tag: 'JLPT_N4',
            s_tag: 'reading-001',
            japaneseText: [
                '日本には四つの季節があります。',
                '春には桜が咲きます。',
                '夏は暑くて、海に行く人が多いです。',
                '秋には紅葉がきれいです。',
                '冬は寒くて、雪が降る地域もあります。'
            ],
            romanizedText: [
                'Nihon ni wa yottsu no kisetsu ga arimasu.',
                'Haru ni wa sakura ga sakimasu.',
                'Natsu wa atsukute, umi ni iku hito ga ooi desu.',
                'Aki ni wa kouyou ga kirei desu.',
                'Fuyu wa samukute, yuki ga furu chiiki mo arimasu.'
            ],
            englishTranslation: [
                'Japan has four seasons.',
                'In spring, cherry blossoms bloom.',
                'Summer is hot, and many people go to the sea.',
                'In autumn, the autumn leaves are beautiful.',
                'Winter is cold, and there are regions where it snows.'
            ],
            readingVocabulary: ['季節', '桜', '紅葉', '地域'],
            readingVocabularyEn: ['season', 'cherry blossom', 'autumn leaves', 'region'],
            readingGrammar: ['には', 'て-form conjunction'],
            readingGrammarEn: ['location/time marker', 'te-form for connecting sentences']
        },
        {
            key: 'ai-reading-002',
            title: 'My Daily Routine',
            titleRomaji: 'Watashi no Ichinichi',
            titleJp: '私の一日',
            p_tag: 'JLPT_N5',
            s_tag: 'reading-002',
            japaneseText: [
                '毎朝六時に起きます。',
                '朝ご飯を食べてから、会社に行きます。',
                '仕事は九時から五時までです。',
                '帰ってから、晩ご飯を作ります。',
                '十一時に寝ます。'
            ],
            romanizedText: [
                'Maiasa roku-ji ni okimasu.',
                'Asa gohan wo tabete kara, kaisha ni ikimasu.',
                'Shigoto wa ku-ji kara go-ji made desu.',
                'Kaette kara, ban gohan wo tsukurimasu.',
                'Juuichi-ji ni nemasu.'
            ],
            englishTranslation: [
                'I wake up at 6 AM every morning.',
                'After eating breakfast, I go to work.',
                'Work is from 9 to 5.',
                'After returning home, I make dinner.',
                'I sleep at 11 PM.'
            ],
            readingVocabulary: ['毎朝', '会社', '仕事', '晩ご飯'],
            readingVocabularyEn: ['every morning', 'company', 'work', 'dinner'],
            readingGrammar: ['てから', 'から〜まで'],
            readingGrammarEn: ['after doing', 'from ~ until']
        }
    ];

    for (const reading of readings) {
        contents.push({
            pattern_type: 'Reading',
            content: reading,
            tags: ['private', 'ai-generated'],
            status: 'active'
        });
    }
    return contents;
}

function generateQuizContent() {
    const contents = [];
    const quizzes = [
        {
            title: 'AI N5 Vocabulary Challenge',
            description: 'AI-generated vocabulary quiz for beginners',
            origin: 'chatbot',
            jlpt_level: 'N5',
            category: 'vocabulary',
            time_limit_seconds: 300,
            is_public: true,
            is_active: true,
            questions: [
                {
                    question_id: 'ai-quiz-v1-q1',
                    question_type: 'vocab_reading',
                    content: {
                        prompt: 'What is the reading of 食べる?',
                        options: ['たべる', 'のべる', 'あべる', 'さべる'],
                        correct_answer: 'たべる',
                        scoring_rule: 'binary'
                    },
                    learning_points: ['食べる', 'verb-to-eat'],
                    points: 1
                },
                {
                    question_id: 'ai-quiz-v1-q2',
                    question_type: 'vocab_meaning',
                    content: {
                        prompt: 'What does 大きい mean?',
                        options: ['small', 'big', 'fast', 'slow'],
                        correct_answer: 'big',
                        scoring_rule: 'binary'
                    },
                    learning_points: ['大きい', 'adjective-big'],
                    points: 1
                }
            ]
        },
        {
            title: 'AI N4 Grammar Master',
            description: 'AI-generated grammar quiz for N4 learners',
            origin: 'chatbot',
            jlpt_level: 'N4',
            category: 'grammar',
            time_limit_seconds: 600,
            is_public: true,
            is_active: true,
            questions: [
                {
                    question_id: 'ai-quiz-g1-q1',
                    question_type: 'grammar_fill_blank',
                    content: {
                        prompt: '日本語を勉強し___います。',
                        options: ['て', 'た', 'で', 'に'],
                        correct_answer: 'て',
                        scoring_rule: 'binary'
                    },
                    learning_points: ['ています', 'progressive-form'],
                    points: 1
                },
                {
                    question_id: 'ai-quiz-g1-q2',
                    question_type: 'grammar_fill_blank',
                    content: {
                        prompt: '映画を見___前に、本を読みました。',
                        options: ['る', 'た', 'て', 'の'],
                        correct_answer: 'る',
                        scoring_rule: 'binary'
                    },
                    learning_points: ['前に', 'before-doing'],
                    points: 1
                }
            ]
        }
    ];

    for (const quiz of quizzes) {
        contents.push({
            pattern_type: 'Quiz',
            content: quiz,
            tags: ['private', 'ai-generated'],
            status: 'active'
        });
    }
    return contents;
}

// ===== MAIN EXECUTION =====

async function runContentGeneration() {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🧹 Clearing existing AI-generated content...');
    await AIGeneratedContent.deleteMany({});

    console.log('📝 Generating content for all patterns...');

    const allContents = [
        ...generateJLPTExamContent(),
        ...generateGrammarContent(),
        ...generateKanjiContent(),
        ...generateWordContent(),
        ...generateSentenceContent(),
        ...generateReadingContent(),
        ...generateQuizContent()
    ];

    console.log(`📊 Total content items to insert: ${allContents.length}`);

    const result = await AIGeneratedContent.insertMany(allContents);
    console.log(`✅ Successfully inserted ${result.length} content items`);

    // Log pattern summary
    const patternCounts = {};
    for (const item of allContents) {
        patternCounts[item.pattern_type] = (patternCounts[item.pattern_type] || 0) + 1;
    }
    console.log('\n📋 Content Pattern Summary:');
    for (const [pattern, count] of Object.entries(patternCounts)) {
        console.log(`   - ${pattern}: ${count} items`);
    }

    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    console.log('🎉 AI Content Generation Complete!');
}

if (require.main === module) {
    runContentGeneration().catch(err => {
        console.error('❌ Error:', err);
        process.exit(1);
    });
}

module.exports = { runContentGeneration, AIGeneratedContent };
