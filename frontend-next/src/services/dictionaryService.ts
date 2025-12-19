import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_DICTIONARY_API_URL || 'http://localhost:5200';

export interface DictionaryEntry {
    id: string;
    head: string;
    reading: string;
    meaning: string;
    tags?: string[];
    onyomi?: string;
    kunyomi?: string;
    strokes?: number;
    grammarNote?: string;
    audio?: string;
    example?: string;
}

export interface ExampleSentence {
    ja: string;
    en: string;
    id?: string;
}

export interface ParseResult {
    tokens: any[];
    kanji: any[];
    grammar: any[];
}

export const dictionaryService = {
    async search(text: string) {
        try {
            const response = await axios.post(`${API_BASE_URL}/d-api/v1/search`, { text });
            const data = response.data;

            // Transform Python backend response to UI expected format
            return {
                tokens: data.vocab.map((v: any) => ({
                    id: v.id,
                    head: v.expression,
                    reading: v.reading,
                    meaning: v.meanings[0] || '',
                    tags: v.pos_tags
                })),
                kanji: data.kanji.map((k: any) => ({
                    id: k.literal,
                    head: k.literal,
                    reading: k.onyomi[0] || k.kunyomi[0] || '',
                    meaning: k.meanings[0] || '',
                    onyomi: k.onyomi.join(', '),
                    kunyomi: k.kunyomi.join(', '),
                    strokes: k.stroke_count,
                    jlpt: k.jlpt
                })),
                grammar: [] // To be implemented
            };
        } catch (error) {
            console.error('Unified search failed:', error);
            throw error;
        }
    },

    async getVocabDetails(expression: string): Promise<DictionaryEntry | null> {
        try {
            const response = await axios.get(`${API_BASE_URL}/d-api/v1/simple-vocabulary/${encodeURIComponent(expression)}`);
            const entry = response.data;
            return {
                id: entry.original,
                head: entry.original,
                reading: entry.hiragana,
                meaning: entry.englishTranslations.join('; ')
            };
        } catch (error) {
            console.error('Get vocab details failed:', error);
            return null;
        }
    },

    async getKanjiDetails(character: string): Promise<DictionaryEntry | null> {
        try {
            const response = await axios.get(`${API_BASE_URL}/d-api/v1/kanji/${encodeURIComponent(character)}`);
            const k = response.data;
            return {
                id: k.literal,
                head: k.literal,
                reading: k.onyomi[0] || k.kunyomi[0] || '',
                meaning: k.meanings.join('; '),
                onyomi: k.onyomi.join(', '),
                kunyomi: k.kunyomi.join(', '),
                strokes: k.stroke_count
            };
        } catch (error) {
            console.error('Get kanji details failed:', error);
            return null;
        }
    },

    async getGrammarDetails(head: string): Promise<DictionaryEntry | null> {
        return null; // To be implemented with AI content
    },

    async getExamples(query: string): Promise<ExampleSentence[]> {
        // For now, return mock as sentences tab is generated/supplemental
        return [
            { ja: `${query}を使った例文です。`, en: `This is an example sentence using ${query}.` },
            { ja: `これは${query}の別の例です。`, en: `This is another example of ${query}.` }
        ];
    }
};
