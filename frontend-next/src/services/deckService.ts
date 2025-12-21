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

export const fetchAllDecks = async (): Promise<Deck[]> => {
    try {
        const response = await authFetch(`${API_BASE_URL}/decks`);
        if (!response.ok) {
            throw new Error(`Failed to fetch decks: ${response.statusText}`);
        }
        const data = await response.json();
        return data as Deck[];
    } catch (error) {
        console.error("Error fetching decks:", error);
        // Return empty array as fallback to prevent UI crash
        return [];
    }
};
