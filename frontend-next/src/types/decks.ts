export interface DeckCard {
    _id: string; // The ID from backend (aliased from MongoDB _id)
    front: string;
    back: string;
    sub_detail?: string;
    type: string; // 'vocabulary', 'kanji', etc.
    extra_data?: {
        audio?: string;
        example_sentence?: string;
        example_word?: string;
        example_reading?: string;
        p_tag?: string;
        s_tag?: string;
        [key: string]: any;
    };
}

export interface Deck {
    _id: string;
    title: string;
    description?: string;
    tags: string[];
    cards: DeckCard[];
    level?: string;
    icon?: string;
}
