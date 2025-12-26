const express = require('express');
const router = express.Router();
const { QuootDeck } = require('../models/QuootDeck');
const { verifyJWT, optionalAuth } = require('../middleware/auth');

/**
 * GET /quoot/decks
 * List all available quoot decks
 */
router.get('/decks', optionalAuth, async (req, res) => {
    try {
        const query = { isPublic: true };
        if (req.user) {
            const userId = req.user.id || req.user.userId;
            // Include user's own private decks
            // query.$or = [{ isPublic: true }, { userId }];
        }

        const decks = await QuootDeck.find(query).sort({ createdAt: -1 }).lean();

        // Transform for frontend
        const transformed = decks.map(d => ({
            id: d._id.toString(),
            title: d.title,
            description: d.description,
            icon: d.icon,
            level: d.level,
            cardCount: d.cards.length,
            stats: d.stats
        }));

        res.status(200).json(transformed);
    } catch (err) {
        console.error('Fetch Quoot Decks Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /quoot/decks/:id
 * Get specific deck with all cards
 */
router.get('/decks/:id', optionalAuth, async (req, res) => {
    try {
        const deck = await QuootDeck.findById(req.params.id).lean();
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
 * POST /quoot/decks
 * Create a new custom quoot deck
 */
router.post('/decks', verifyJWT, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const { title, description, level, icon, cards } = req.body;

        if (!title || !cards || !Array.isArray(cards)) {
            return res.status(400).json({ error: 'Title and cards are required' });
        }

        const deck = new QuootDeck({
            title,
            description: description || '',
            level: level || 'N3',
            icon: icon || '⚔️',
            isPublic: false, // User created decks are private by default
            userId,
            cards: cards.map(c => ({
                front: c.front,
                back: c.back,
                reading: c.reading || '',
                type: c.type || 'vocabulary'
            }))
        });

        await deck.save();

        res.status(201).json({
            id: deck._id.toString(),
            message: 'Quoot deck created successfully'
        });
    } catch (err) {
        console.error('Create Quoot Deck Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
