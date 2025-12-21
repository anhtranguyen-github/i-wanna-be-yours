/**
 * Grammar Service - Frontend API client for grammar functionality
 */

import { authFetch } from '@/lib/authFetch';

// Types based on backend/express/models/grammar.js
export interface GrammarExample {
    _id?: string;
    jp: string;
    romaji: string;
    en: string;
    grammar_audio?: string;
}

export interface GrammarPoint {
    _id: string; // MongoDB ID
    title: string;
    short_explanation: string;
    long_explanation: string;
    formation: string;
    examples: GrammarExample[];
    p_tag: string;
    s_tag: string;

    // User progress fields (merged from Flask)
    difficulty?: string;
    userId?: string;
    quiz_miss_weight?: number;
    last_review_at?: string;
    next_review_at?: string;
}

export interface GrammarListResponse {
    grammars: GrammarPoint[];
}

export interface GrammarTitlesResponse {
    titles: string[];
}

const E_API_BASE = '/e-api/v1';
const F_API_BASE = '/f-api/v1';

/**
 * Fetch list of grammars from the Static (Express) backend
 */
export async function getGrammars(options: {
    p_tag?: string;
    s_tag?: string
} = {}): Promise<GrammarListResponse> {
    const params = new URLSearchParams();
    if (options.p_tag) params.append('p_tag', options.p_tag);
    if (options.s_tag) params.append('s_tag', options.s_tag);

    const url = `${E_API_BASE}/grammars${params.toString() ? '?' + params.toString() : ''}`;
    const response = await authFetch(url);

    if (!response.ok) {
        throw new Error('Failed to fetch grammars');
    }

    // Express backend returns { grammars: [...] }
    return response.json();
}

/**
 * Fetch just grammar titles (lighter weight)
 */
export async function getGrammarTitles(p_tag: string, type: 'plain' | 'encoded' = 'plain'): Promise<GrammarTitlesResponse> {
    const params = new URLSearchParams();
    params.append('p_tag', p_tag);
    params.append('type', type);

    const url = `${E_API_BASE}/grammar-titles?${params.toString()}`;
    const response = await authFetch(url);

    if (!response.ok) {
        throw new Error('Failed to fetch grammar titles');
    }

    return response.json();
}

/**
 * Fetch full details for a single grammar point by title
 */
export async function getGrammarDetails(title: string): Promise<{ grammar: GrammarPoint }> {
    const response = await authFetch(`${E_API_BASE}/grammar-details`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch grammar details: ${response.status} ${errorText}`);
    }

    return response.json();
}

/**
 * Fetch grammar data merged with user progress (Flask)
 */
export async function getUserGrammarProgress(params: {
    userId: string;
    collectionName: string; // usually 'grammars'
    p_tag: string;
    s_tag: string; // use 'all' for all valid tags under p_tag
}): Promise<GrammarPoint[]> {
    const queryParams = new URLSearchParams({
        userId: params.userId,
        collectionName: params.collectionName,
        p_tag: params.p_tag,
        s_tag: params.s_tag,
    });

    const url = `${F_API_BASE}/combine-flashcard-data-grammars?${queryParams.toString()}`;
    // Flask endpoint returns array directly
    const response = await authFetch(url);

    if (!response.ok) {
        throw new Error('Failed to fetch user grammar progress');
    }

    return response.json();
}

/**
 * Add grammar to user study list (Clone from static to dynamic)
 */
export async function addToStudyList(
    userId: string,
    p_tag: string,
    s_tag?: string
): Promise<{ message: string }> {
    const response = await authFetch(`${F_API_BASE}/clone-static-collection-grammars`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            userId,
            collection: 'grammars',
            p_tag,
            s_tag
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to add to study list');
    }

    return response.json();
}
