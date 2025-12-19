import axios from 'axios';

const EXPRESS_API_URL = process.env.EXPRESS_API_URL || 'http://localhost:8000/e-api/v1';

export interface TanosWord {
    _id: string;
    vocabulary_original: string;
    vocabulary_simplified?: string;
    vocabulary_english?: string;
    word_type?: string;
    vocabulary_audio?: string;
    p_tag: string;
    s_tag?: string;
}

export interface VocabularyResponse {
    words: TanosWord[];
}

export async function getVocabulary(options: {
    p_tag?: string;
    s_tag?: string;
} = { p_tag: 'JLPT_N5' }): Promise<TanosWord[]> {
    try {
        const params = new URLSearchParams();
        if (options.p_tag) params.append('p_tag', options.p_tag);
        if (options.s_tag) params.append('s_tag', options.s_tag);

        const response = await axios.get<VocabularyResponse>(`${EXPRESS_API_URL}/tanos_words`, {
            params: params,
        });

        // The API returns { words: [...] }
        return response.data.words || [];
    } catch (error) {
        console.error('Error fetching vocabulary:', error);
        return [];
    }
}
