const express = require('express');
const router = express.Router();
const { FlashcardDeck } = require('../models/FlashcardDeck');
const { verifyJWT, optionalAuth } = require('../middleware/auth');

/**
 * GET /flashcards/decks
 */
router.get('/decks', optionalAuth, async (req, res) => {
    try {
        const query = { isPublic: true };
        const decks = await FlashcardDeck.find(query).sort({ createdAt: -1 }).lean();

        const transformed = decks.map(d => ({
            id: d._id.toString(),
            title: d.title,
            description: d.description,
            icon: d.icon,
            level: d.level,
            cardCount: d.cards.length,
            tags: d.tags
        }));

        res.status(200).json(transformed);
    } catch (err) {
        console.error('Fetch Flashcard Decks Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /flashcards/decks/:id
 */
router.get('/decks/:id', optionalAuth, async (req, res) => {
    try {
        const deck = await FlashcardDeck.findById(req.params.id).lean();
        if (!deck) return res.status(404).json({ error: 'Deck not found' });

        res.status(200).json({
            ...deck,
            id: deck._id.toString()
        });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /flashcards/study/due
 * Fetch cards that are due for review
 */
router.get('/study/due', optionalAuth, async (req, res) => {
    try {
        // In a real SRS, we'd filter by nextReview date and userId.
        // For this refactor, we'll return cards from a few public decks as "due".
        const decks = await FlashcardDeck.find({ isPublic: true }).limit(2).lean();
        let allCards = [];
        decks.forEach(d => {
            allCards = [...allCards, ...d.cards.map(c => ({
                ...c,
                _id: c._id || c.id,
                deck_name: d.title
            }))];
        });

        // Simple shuffle
        allCards.sort(() => Math.random() - 0.5);

        res.status(200).json(allCards);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /flashcards/study/answer
 * Submit an SRS answer for a card
 */
router.post('/study/answer', verifyJWT, async (req, res) => {
    try {
        const { cardId, quality } = req.body;
        // Logic to update card's SRS data would go here.
        // For now, just acknowledge.
        res.status(200).json({ message: 'Answer recorded', cardId, quality });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
