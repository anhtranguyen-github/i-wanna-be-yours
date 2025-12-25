// =============================================================================
// Hanabira Practice Nexus - Mock Data (Unified)
// =============================================================================

import { PracticeNode, Question, JLPTLevel, SkillType } from '@/types/practice';

// --- Mock Practice Nodes ---

export const mockExamConfigs: PracticeNode[] = [
    // QUIZ Mode
    {
        id: 'quiz-n3-mixed-1',
        mode: 'QUIZ',
        title: 'N3 Mixed Practice',
        description: 'Mixed JLPT practice covering vocabulary, grammar, and reading comprehension.',
        tags: {
            level: 'N3',
            skills: ['VOCABULARY', 'GRAMMAR', 'READING'],
            origin: 'system'
        },
        stats: {
            questionCount: 20,
        }
    },
    {
        id: 'quiz-n4-vocab-1',
        mode: 'QUIZ',
        title: 'Vocabulary Drill',
        description: 'Kanji and vocabulary review for N4 level learners.',
        tags: {
            level: 'N4',
            skills: ['VOCABULARY'],
            origin: 'system'
        },
        stats: {
            questionCount: 30,
        }
    },
    {
        id: 'quiz-n5-grammar-1',
        mode: 'QUIZ',
        title: 'N5 Grammar Basics',
        description: 'Foundational grammar patterns for beginners.',
        tags: {
            level: 'N5',
            skills: ['GRAMMAR'],
            origin: 'system'
        },
        stats: {
            questionCount: 15,
            timeLimitMinutes: 20,
        }
    },
    {
        id: 'quiz-n2-reading-1',
        mode: 'QUIZ',
        title: 'N2 Reading Challenge',
        description: 'Advanced reading comprehension practice.',
        tags: {
            level: 'N2',
            skills: ['READING'],
            origin: 'system'
        },
        stats: {
            questionCount: 10,
            timeLimitMinutes: 30,
        }
    },

    // SINGLE_EXAM Mode
    {
        id: 'single-n3-grammar-1',
        mode: 'SINGLE_EXAM',
        title: 'N3 Grammar Exam',
        description: 'Skill-focused JLPT grammar exam following official format.',
        tags: {
            level: 'N3',
            skills: ['GRAMMAR'],
            origin: 'system'
        },
        stats: {
            questionCount: 25,
            timeLimitMinutes: 35,
        }
    },
    {
        id: 'single-n2-vocab-1',
        mode: 'SINGLE_EXAM',
        title: 'N2 Vocabulary Exam',
        description: 'Test your N2 vocabulary knowledge with JLPT-style questions.',
        tags: {
            level: 'N2',
            skills: ['VOCABULARY'],
            origin: 'system'
        },
        stats: {
            questionCount: 30,
            timeLimitMinutes: 25,
        }
    },
    {
        id: 'single-n4-listening-1',
        mode: 'SINGLE_EXAM',
        title: 'N4 Listening Exam',
        description: 'Practice listening comprehension with authentic JLPT-style audio.',
        tags: {
            level: 'N4',
            skills: ['LISTENING'],
            origin: 'system'
        },
        stats: {
            questionCount: 20,
            timeLimitMinutes: 30,
        }
    },

    // FULL_EXAM Mode
    {
        id: 'full-n3-1',
        mode: 'FULL_EXAM',
        title: 'JLPT N3 Full Exam',
        description: 'Complete JLPT N3 simulation with all sections.',
        tags: {
            level: 'N3',
            skills: ['VOCABULARY', 'GRAMMAR', 'READING', 'LISTENING'],
            origin: 'system',
            isStrict: true,
            timerMode: "JLPT_STANDARD"
        },
        stats: {
            questionCount: 45,
            timeLimitMinutes: 105,
        },
        segments: [
            { id: 'sec-lang', title: 'Language Knowledge', skills: ['VOCABULARY'], questionCount: 25, timeLimitMinutes: 30, breakAfterMinutes: 5 },
            { id: 'sec-read', title: 'Reading', skills: ['READING'], questionCount: 25, timeLimitMinutes: 70, breakAfterMinutes: 10 },
            { id: 'sec-list', title: 'Listening', skills: ['LISTENING'], questionCount: 20, timeLimitMinutes: 40 },
        ],
    },
];

// --- Mock Questions Generator ---

export const generateMockQuestions = (node: PracticeNode): Question[] => {
    const questions: Question[] = [];
    const skills = node.tags.skills;

    for (let i = 0; i < node.stats.questionCount; i++) {
        const skill = skills[i % skills.length];
        const questionId = `${node.id}-q${i + 1}`;

        questions.push(generateQuestionBySkill(questionId, node.tags.level as JLPTLevel, skill, i + 1));
    }

    return questions;
};

const generateQuestionBySkill = (
    id: string,
    level: JLPTLevel,
    skill: SkillType,
    index: number
): Question => {
    const baseQuestion: Question = {
        id,
        type: 'MULTIPLE_CHOICE',
        content: '',
        options: [],
        correctOptionId: '',
        explanation: '',
        tags: { level, skills: [skill], origin: 'system', isStrict: false },
    };

    switch (skill) {
        case 'VOCABULARY':
            return {
                ...baseQuestion,
                content: `【問題 ${index}】次の文の＿＿に入る最も適切な言葉を選んでください。\n\n彼女は毎朝早く＿＿＿ジョギングをしています。`,
                options: [
                    { id: `${id}-a`, text: '起きて' },
                    { id: `${id}-b`, text: '寝て' },
                    { id: `${id}-c`, text: '食べて' },
                    { id: `${id}-d`, text: '飲んで' },
                ],
                correctOptionId: `${id}-a`,
                explanation: '「起きて」(okite) means "waking up" and is the correct choice.',
            };

        case 'GRAMMAR':
            return {
                ...baseQuestion,
                content: `【問題 ${index}】次の文の＿＿に入る最も適切なものを選んでください。\n\n日本に来た＿＿＿、まだ一年しか経っていません。`,
                options: [
                    { id: `${id}-a`, text: 'ばかりで' },
                    { id: `${id}-b`, text: 'だけで' },
                    { id: `${id}-c`, text: 'からで' },
                    { id: `${id}-d`, text: 'までで' },
                ],
                correctOptionId: `${id}-a`,
                explanation: '「ばかりで」indicates that something has just happened recently.',
            };

        case 'READING':
            return {
                ...baseQuestion,
                type: 'READING_PASSAGE',
                passage: `次の文章を読んで、質問に答えてください。\n\n日本の四季は世界でも有名です。`,
                content: `【問題 ${index}】日本人は何を大切にしてきましたか。`,
                options: [
                    { id: `${id}-a`, text: '桜と花火' },
                    { id: `${id}-b`, text: '四季の変化' },
                    { id: `${id}-c`, text: '雪と紅葉' },
                    { id: `${id}-d`, text: '世界の季節' },
                ],
                correctOptionId: `${id}-b`,
                explanation: 'Focused on 四季の変化.',
            };

        case 'LISTENING':
            return {
                ...baseQuestion,
                type: 'LISTENING',
                audioUrl: '/audio/sample-listening.mp3',
                content: `【問題 ${index}】女の人は何時に会議が始まると言っていますか。`,
                options: [
                    { id: `${id}-a`, text: '9時' },
                    { id: `${id}-b`, text: '10時' },
                    { id: `${id}-c`, text: '11時' },
                    { id: `${id}-d`, text: '12時' },
                ],
                correctOptionId: `${id}-b`,
                explanation: '10 o\'clock.',
            };

        default:
            return baseQuestion;
    }
};

// Export function to get questions for an exam
export const getQuestionsForExam = (examId: string): Question[] => {
    const node = mockExamConfigs.find((e) => e.id === examId);
    if (!node) return [];
    return generateMockQuestions(node);
};
