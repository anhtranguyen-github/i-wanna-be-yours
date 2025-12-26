/**
 * Game Utilities for Quoot and Practice
 */

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Generate 4 options for a card (1 correct + 3 distractors)
 */
export function generateOptions(card: { id: string, back: string, wrongOptions?: string[] }, allCards: { id: string, back: string }[]): string[] {
    const correct = card.back;

    // Use pre-defined wrong options if available
    if (card.wrongOptions && card.wrongOptions.length >= 3) {
        const options = [correct, ...card.wrongOptions.slice(0, 3)];
        return shuffleArray(options);
    }

    // Otherwise, pick random wrong answers from other cards
    const otherAnswers = allCards
        .filter(c => c.id !== card.id)
        .map(c => c.back)
        .filter((v, i, a) => a.indexOf(v) === i); // unique

    const wrongOptions = shuffleArray(otherAnswers).slice(0, 3);
    const options = [correct, ...wrongOptions];

    return shuffleArray(options);
}
