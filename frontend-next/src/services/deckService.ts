import { Deck } from "@/types/decks";
import { authFetch } from '@/lib/authFetch';

const API_BASE_URL = "/f-api/v1";

export const fetchDeckById = async (id: string): Promise<Deck> => {
    try {
        const response = await authFetch(`${API_BASE_URL}/decks/${id}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch deck: ${response.statusText}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching deck:", error);
        throw error;
    }
};

export const fetchDecks = async (access?: 'PUBLIC' | 'PERSONAL'): Promise<Deck[]> => {
    try {
        const url = access ? `${API_BASE_URL}/decks?access=${access}` : `${API_BASE_URL}/decks`;
        const response = await authFetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch decks: ${response.statusText}`);
        }
        const data = await response.json();
        return data as Deck[];
    } catch (error) {
        console.error("Error fetching decks:", error);
        return [];
    }
};

export const createDeck = async (deck: Partial<Deck>): Promise<Deck> => {
    try {
        const response = await authFetch(`${API_BASE_URL}/decks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(deck)
        });
        if (!response.ok) {
            throw new Error(`Failed to create deck: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error creating deck:", error);
        throw error;
    }
};

// For backward compatibility
export const fetchAllDecks = () => fetchDecks();
