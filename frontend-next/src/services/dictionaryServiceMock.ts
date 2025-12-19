import { v4 as uuidv4 } from 'uuid';

export interface DictionaryEntry {
    id: string;
    head: string;
    reading?: string;
    meaning: string;
    type: 'vocab' | 'kanji' | 'grammar' | 'sentence';
    tags?: string[];
    audio?: string;
    example?: string;
    // Kanji specific
    kunyomi?: string;
    onyomi?: string;
    strokes?: number;
    // Contextual note
    grammarNote?: string;
}

export interface ExampleSentence {
    ja: string;
    en: string;
    audio?: string;
}

const MOCK_VOCAB: DictionaryEntry[] = [
    {
        id: 'v_fam',
        head: '家族',
        reading: 'かぞく',
        meaning: 'family',
        type: 'vocab',
        tags: ['noun', 'jlpt-n5'],
        grammarNote: 'Danh từ, danh từ sở hữu cách thêm の'
    },
    { id: 'v1', head: '猫', reading: 'ねこ', meaning: 'cat', type: 'vocab', tags: ['noun', 'jlpt-n5'], audio: '/audio/neko.mp3' },
    { id: 'v2', head: '好き', reading: 'すき', meaning: 'like; fond of', type: 'vocab', tags: ['na-adj', 'jlpt-n5'] },
    { id: 'v3', head: '学校', reading: 'がっこう', meaning: 'school', type: 'vocab', tags: ['noun', 'jlpt-n5'] },
    { id: 'v4', head: '行く', reading: 'いく', meaning: 'to go', type: 'vocab', tags: ['verb', 'u-verb', 'jlpt-n5'] },
];

const MOCK_KANJI: DictionaryEntry[] = [
    {
        id: 'k_jia',
        head: '家',
        kunyomi: 'いえ, や, うち',
        onyomi: 'カ, ケ',
        meaning: 'house; home; family',
        type: 'kanji',
        strokes: 10,
        tags: ['grade-2', 'jlpt-n4']
    },
    {
        id: 'k_zu',
        head: '族',
        onyomi: 'ゾク',
        meaning: 'tribe; family',
        type: 'kanji',
        strokes: 11,
        tags: ['grade-3', 'jlpt-n4']
    },
    { id: 'k1', head: '猫', reading: 'ビョウ / ねこ', meaning: 'cat', type: 'kanji', tags: ['grade-s'] },
];

const MOCK_GRAMMAR: DictionaryEntry[] = [
    { id: 'g1', head: '〜が好き', reading: '〜がすき', meaning: 'to like [something]', type: 'grammar', tags: ['jlpt-n5'], example: '私は猫が好きです。 (I like cats.)' },
    { id: 'g4', head: '〜てはいけません', reading: '〜てはいけません', meaning: 'must not do', type: 'grammar', tags: ['jlpt-n5'], example: 'ここでタバコを吸ってはいけません。 (You must not smoke here.)' },
];

const MOCK_EXAMPLES: Record<string, ExampleSentence[]> = {
    '家族': [
        { ja: '幸せな家族', en: 'Gia đình hạnh phúc' },
        { ja: '経済的に苦しい家族', en: 'Gia đình gặp khó khăn về kinh tế' },
        { ja: '家のない家族', en: 'Gia đình không có nhà cửa' }
    ],
    '猫': [{ ja: 'あの猫はとても可愛いです。', en: 'That cat is very cute.' }, { ja: '猫を飼っていますか？', en: 'Do you own a cat?' }],
};

export const dictionaryServiceMock = {
    parseInput: async (text: string) => {
        const trimText = text.trim();
        let tokens: string[] = [];

        if (trimText === '家族') {
            tokens = ['家族'];
        } else if (trimText.includes('猫が好き')) {
            tokens = ['猫', 'が', '好き'];
        } else {
            tokens = [trimText];
        }

        const isSentence = tokens.length > 1;
        const kanjiFound = Array.from(trimText).filter(char => char.match(/[\u4e00-\u9faf]/));
        const grammarPoints = MOCK_GRAMMAR.filter(g => trimText.includes(g.head.replace(/[〜]/g, '')));

        return {
            isSentence,
            tokens: tokens.map(t => {
                const vocab = MOCK_VOCAB.find(v => v.head === t);
                return vocab || { id: uuidv4(), head: t, meaning: '???', type: 'vocab' };
            }),
            kanji: kanjiFound.map(k => {
                const kanji = MOCK_KANJI.find(mk => mk.head === k);
                return kanji || { id: uuidv4(), head: k, meaning: '(Mock missing)', type: 'kanji', reading: '' };
            }),
            grammar: grammarPoints
        };
    },

    getVocabDetails: async (head: string) => {
        return MOCK_VOCAB.find(v => v.head === head) || null;
    },

    getKanjiDetails: async (char: string) => {
        return MOCK_KANJI.find(k => k.head === char) || null;
    },

    getGrammarDetails: async (head: string) => {
        return MOCK_GRAMMAR.find(g => g.head === head) || null;
    },

    getExamples: async (head: string) => {
        return MOCK_EXAMPLES[head] || [];
    }
};
