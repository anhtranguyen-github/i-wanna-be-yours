import axios from 'axios';

const EXPRESS_API_URL = process.env.EXPRESS_API_URL || 'http://localhost:8000/e-api/v1';

export interface Kanji {
    _id: string;
    kanji: string;
    reading?: string; // On'yomi in schema but seemingly inconsistent naming in JSONs vs Schema
    onYomi?: string;
    kunYomi?: string;
    k_audio?: string;
    exampleWord?: string;
    exampleReading?: string;
    translation?: string;
    audio?: string;
    p_tag: string;
    s_tag?: string;
}

export interface KanjiResponse {
    kanji: Kanji[]; // The backend might return an array directly if it's following the pattern of other endpoints like grammars?
    // Checking query: app.get("/e-api/v1/kanji") returns `res.status(200).json(kanji);` which is an array
}

export async function getKanji(options: {
    p_tag?: string;
    s_tag?: string;
} = { p_tag: 'JLPT_N5' }): Promise<Kanji[]> {
    try {
        const params = new URLSearchParams();
        if (options.p_tag) params.append('p_tag', options.p_tag);
        if (options.s_tag) params.append('s_tag', options.s_tag);

        const response = await axios.get<Kanji[]>(`${EXPRESS_API_URL}/kanji`, {
            params: params,
        });

        return response.data;
    } catch (error) {
        console.error('Error fetching kanji:', error);
        return [];
    }
}
