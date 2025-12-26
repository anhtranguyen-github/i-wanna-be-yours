const express = require('express');
const router = express.Router();
const { FlashcardSet } = require('../models/FlashcardSet');
const { verifyJWT, optionalAuth } = require('../middleware/auth');

/**
 * GET /flashcards/sets
 */
router.get('/sets', optionalAuth, async (req, res) => {
    try {
        const { level, visibility } = req.query;
        let query = {};

        const visibilityFilters = [];
        visibilityFilters.push({ visibility: 'global' });
        visibilityFilters.push({ visibility: 'public' });

        if (req.user) {
            const userId = req.user.id || req.user.userId;
            visibilityFilters.push({ visibility: 'private', userId });
        }

        query.$or = visibilityFilters;

        if (level && level !== 'ALL') {
            query.level = level;
        }

        if (visibility && ['global', 'public', 'private'].includes(visibility)) {
            if (visibility === 'private') {
                if (!req.user) return res.status(200).json([]);
                query = { visibility: 'private', userId: req.user.id || req.user.userId };
            } else {
                query = { visibility };
            }
        }

        const sets = await FlashcardSet.find(query).sort({ visibility: 1, createdAt: -1 }).lean();

        const transformed = sets.map(s => ({
            id: s._id.toString(),
            title: s.title,
            description: s.description,
            icon: s.icon,
            level: s.level,
            cardCount: s.cards.length,
            tags: s.tags,
            visibility: s.visibility,
            creatorName: s.creatorName
        }));

        res.status(200).json(transformed);
    } catch (err) {
        console.error('Fetch Flashcard Sets Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /flashcards/sets/:id
 */
router.get('/sets/:id', optionalAuth, async (req, res) => {
    try {
        const set = await FlashcardSet.findById(req.params.id).lean();
        if (!set) return res.status(404).json({ error: 'Set not found' });

        if (set.visibility === 'private') {
            if (!req.user) return res.status(403).json({ error: 'Forbidden' });
            const userId = req.user.id || req.user.userId;
            if (set.userId.toString() !== userId) return res.status(403).json({ error: 'Forbidden' });
        }

        res.status(200).json({
            ...set,
            id: set._id.toString()
        });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /flashcards/study/due
 */
router.get('/study/due', optionalAuth, async (req, res) => {
    try {
        const query = { visibility: 'global' };
        if (req.user) {
            query.visibility = { $in: ['global', 'private'] };
            query.userId = req.user.id || req.user.userId;
        }

        const sets = await FlashcardSet.find(query).limit(5).lean();
        let allCards = [];
        sets.forEach(s => {
            allCards = [...allCards, ...s.cards.map(c => ({
                ...c,
                _id: c._id || c.id,
                set_name: s.title
            }))];
        });

        allCards.sort(() => Math.random() - 0.5);
        res.status(200).json(allCards);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /flashcards/study/answer
 */
router.post('/study/answer', verifyJWT, async (req, res) => {
    try {
        const { cardId, quality } = req.body;
        res.status(200).json({ message: 'Answer recorded', cardId, quality });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /flashcards/sets
 */
router.post('/sets', verifyJWT, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const username = req.user.username || 'User';
        const { title, description, level, icon, tags, cards, visibility } = req.body;

        if (!title || !cards || !Array.isArray(cards)) {
            return res.status(400).json({ error: 'Title and cards are required' });
        }

        const set = new FlashcardSet({
            title,
            description: description || '',
            level: level || 'N3',
            icon: icon || '🎴',
            tags: tags || [],
            visibility: visibility || 'private',
            userId,
            creatorName: username,
            cards: cards.map(c => ({
                front: c.front,
                back: c.back,
                reading: c.reading || '',
                mnemonic: c.mnemonic || ''
            }))
        });

        await set.save();

        res.status(201).json({
            id: set._id.toString(),
            message: 'Flashcard set created successfully'
        });
    } catch (err) {
        console.error('Create Flashcard Set Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
