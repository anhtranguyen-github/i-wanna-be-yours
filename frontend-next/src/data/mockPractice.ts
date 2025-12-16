// =============================================================================
// JLPT Practice Platform - Mock Data
// =============================================================================

import { ExamConfig, Question, JLPTLevel, SkillType } from '@/types/practice';

// --- Mock Exam Configurations ---

export const mockExamConfigs: ExamConfig[] = [
    // QUIZ Mode
    {
        id: 'quiz-n3-mixed-1',
        mode: 'QUIZ',
        title: 'N3 Mixed Practice',
        description: 'Mixed JLPT practice covering vocabulary, grammar, and reading comprehension.',
        level: 'N3',
        skills: ['VOCABULARY', 'GRAMMAR', 'READING'],
        questionCount: 20,
        timerMode: 'UNLIMITED',
    },
    {
        id: 'quiz-n4-vocab-1',
        mode: 'QUIZ',
        title: 'Vocabulary Drill',
        description: 'Kanji and vocabulary review for N4 level learners.',
        level: 'N4',
        skills: ['VOCABULARY'],
        questionCount: 30,
        timerMode: 'UNLIMITED',
    },
    {
        id: 'quiz-n5-grammar-1',
        mode: 'QUIZ',
        title: 'N5 Grammar Basics',
        description: 'Foundational grammar patterns for beginners.',
        level: 'N5',
        skills: ['GRAMMAR'],
        questionCount: 15,
        timerMode: 'CUSTOM',
        timeLimitMinutes: 20,
    },
    {
        id: 'quiz-n2-reading-1',
        mode: 'QUIZ',
        title: 'N2 Reading Challenge',
        description: 'Advanced reading comprehension practice.',
        level: 'N2',
        skills: ['READING'],
        questionCount: 10,
        timerMode: 'CUSTOM',
        timeLimitMinutes: 30,
    },

    // SINGLE_EXAM Mode
    {
        id: 'single-n3-grammar-1',
        mode: 'SINGLE_EXAM',
        title: 'N3 Grammar Exam',
        description: 'Skill-focused JLPT grammar exam following official format.',
        level: 'N3',
        skills: ['GRAMMAR'],
        questionCount: 25,
        timerMode: 'JLPT_STANDARD',
        timeLimitMinutes: 35,
    },
    {
        id: 'single-n2-vocab-1',
        mode: 'SINGLE_EXAM',
        title: 'N2 Vocabulary Exam',
        description: 'Test your N2 vocabulary knowledge with JLPT-style questions.',
        level: 'N2',
        skills: ['VOCABULARY'],
        questionCount: 30,
        timerMode: 'JLPT_STANDARD',
        timeLimitMinutes: 25,
    },
    {
        id: 'single-n4-listening-1',
        mode: 'SINGLE_EXAM',
        title: 'N4 Listening Exam',
        description: 'Practice listening comprehension with authentic JLPT-style audio.',
        level: 'N4',
        skills: ['LISTENING'],
        questionCount: 20,
        timerMode: 'JLPT_STANDARD',
        timeLimitMinutes: 30,
    },

    // FULL_EXAM Mode
    {
        id: 'full-n3-1',
        mode: 'FULL_EXAM',
        title: 'JLPT N3 Full Exam',
        description: 'Complete JLPT N3 simulation with all sections.',
        level: 'N3',
        skills: ['VOCABULARY', 'GRAMMAR', 'READING', 'LISTENING'],
        questionCount: 70,
        timerMode: 'JLPT_STANDARD',
        timeLimitMinutes: 140,
        sections: [
            { id: 'sec-lang', name: 'Language Knowledge', skill: 'VOCABULARY', questionCount: 25, timeLimitMinutes: 30, breakAfterMinutes: 5 },
            { id: 'sec-read', name: 'Reading', skill: 'READING', questionCount: 25, timeLimitMinutes: 70, breakAfterMinutes: 10 },
            { id: 'sec-list', name: 'Listening', skill: 'LISTENING', questionCount: 20, timeLimitMinutes: 40 },
        ],
    },
    {
        id: 'full-n2-1',
        mode: 'FULL_EXAM',
        title: 'JLPT N2 Full Exam',
        description: 'Complete JLPT N2 simulation for advanced learners.',
        level: 'N2',
        skills: ['VOCABULARY', 'GRAMMAR', 'READING', 'LISTENING'],
        questionCount: 80,
        timerMode: 'JLPT_STANDARD',
        timeLimitMinutes: 155,
        sections: [
            { id: 'sec-lang', name: 'Language Knowledge', skill: 'VOCABULARY', questionCount: 30, timeLimitMinutes: 35, breakAfterMinutes: 5 },
            { id: 'sec-read', name: 'Reading', skill: 'READING', questionCount: 25, timeLimitMinutes: 70, breakAfterMinutes: 10 },
            { id: 'sec-list', name: 'Listening', skill: 'LISTENING', questionCount: 25, timeLimitMinutes: 50 },
        ],
    },
    {
        id: 'full-n4-1',
        mode: 'FULL_EXAM',
        title: 'JLPT N4 Full Exam',
        description: 'Full JLPT N4 practice exam for intermediate learners.',
        level: 'N4',
        skills: ['VOCABULARY', 'GRAMMAR', 'READING', 'LISTENING'],
        questionCount: 60,
        timerMode: 'JLPT_STANDARD',
        timeLimitMinutes: 125,
        sections: [
            { id: 'sec-lang', name: 'Language Knowledge', skill: 'VOCABULARY', questionCount: 20, timeLimitMinutes: 25, breakAfterMinutes: 5 },
            { id: 'sec-read', name: 'Reading', skill: 'READING', questionCount: 20, timeLimitMinutes: 55, breakAfterMinutes: 10 },
            { id: 'sec-list', name: 'Listening', skill: 'LISTENING', questionCount: 20, timeLimitMinutes: 35 },
        ],
    },
];

// --- Mock Questions Generator ---

const generateMockQuestions = (examConfig: ExamConfig): Question[] => {
    const questions: Question[] = [];
    const skills = examConfig.skills;

    for (let i = 0; i < examConfig.questionCount; i++) {
        const skill = skills[i % skills.length];
        const questionId = `${examConfig.id}-q${i + 1}`;

        questions.push(generateQuestionBySkill(questionId, examConfig.level, skill, i + 1));
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
        tags: { level, skill, difficulty: 3 },
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
                explanation: '「起きて」(okite) means "waking up" and is the correct choice as it fits the context of morning jogging routine.',
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
                explanation: '「ばかりで」indicates that something has just happened recently, which fits the context of "only one year has passed."',
            };

        case 'READING':
            return {
                ...baseQuestion,
                type: 'READING_PASSAGE',
                passage: `次の文章を読んで、質問に答えてください。

日本の四季は世界でも有名です。春には桜が咲き、夏には花火大会があります。秋には紅葉が美しく、冬には雪が降ります。日本人は昔から、この四季の変化を大切にしてきました。`,
                content: `【問題 ${index}】この文章によると、日本人は何を大切にしてきましたか。`,
                options: [
                    { id: `${id}-a`, text: '桜と花火' },
                    { id: `${id}-b`, text: '四季の変化' },
                    { id: `${id}-c`, text: '雪と紅葉' },
                    { id: `${id}-d`, text: '世界の季節' },
                ],
                correctOptionId: `${id}-b`,
                explanation: 'The passage states that Japanese people have cherished the changes of four seasons (四季の変化) since ancient times.',
            };

        case 'LISTENING':
            return {
                ...baseQuestion,
                type: 'LISTENING',
                audioUrl: '/audio/sample-listening.mp3',
                content: `【問題 ${index}】音声を聞いて、正しい答えを選んでください。\n\n女の人は何時に会議が始まると言っていますか。`,
                options: [
                    { id: `${id}-a`, text: '9時' },
                    { id: `${id}-b`, text: '10時' },
                    { id: `${id}-c`, text: '11時' },
                    { id: `${id}-d`, text: '12時' },
                ],
                correctOptionId: `${id}-b`,
                explanation: 'In the audio, the woman says the meeting starts at 10 o\'clock (10時).',
            };

        default:
            return baseQuestion;
    }
};

// Export function to get questions for an exam
export const getQuestionsForExam = (examId: string): Question[] => {
    const config = mockExamConfigs.find((e) => e.id === examId);
    if (!config) return [];
    return generateMockQuestions(config);
};

// Filter exams by criteria
export const filterExams = (
    mode: 'ALL' | 'QUIZ' | 'SINGLE_EXAM' | 'FULL_EXAM',
    level: JLPTLevel | 'ALL',
    skill: SkillType | 'ALL'
): ExamConfig[] => {
    return mockExamConfigs.filter((exam) => {
        const modeMatch = mode === 'ALL' || exam.mode === mode;
        const levelMatch = level === 'ALL' || exam.level === level;
        const skillMatch = skill === 'ALL' || exam.skills.includes(skill);
        return modeMatch && levelMatch && skillMatch;
    });
};
