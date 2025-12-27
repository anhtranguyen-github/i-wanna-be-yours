const express = require('express');
const router = express.Router();
const { FlashcardSet } = require('../models/FlashcardSet');
const { verifyJWT, optionalAuth } = require('../middleware/auth');

/**
 * GET /flashcards/sets
 */
router.get('/sets', optionalAuth, async (req, res) => {
    try {
        const { levels, skills, visibility } = req.query;
        let query = {};

        const visibilityFilters = [];
        visibilityFilters.push({ visibility: 'global' });
        visibilityFilters.push({ visibility: 'public' });

        if (req.user) {
            const userId = req.user.id || req.user.userId;
            visibilityFilters.push({ visibility: 'private', userId });
        }

        if (visibility === 'global') {
            query.visibility = 'global';
        } else if (visibility === 'public') {
            query.visibility = 'public';
        } else if (visibility === 'private') {
            if (!req.user) return res.status(200).json([]);
            query.visibility = 'private';
            query.userId = req.user.id || req.user.userId;
        } else {
            // Default (ALL)
            const visibilityFilters = [
                { visibility: 'global' },
                { visibility: 'public' }
            ];
            if (req.user) {
                const userId = req.user.id || req.user.userId;
                visibilityFilters.push({ visibility: 'private', userId });
            }
            query.$or = visibilityFilters;
        }

        // Multi-value filtering
        const levelParams = levels?.split(',').filter(Boolean);
        const skillParams = skills?.split(',').filter(Boolean);

        if (levelParams && levelParams.length > 0) {
            query.levels = { $in: levelParams };
        }
        if (skillParams && skillParams.length > 0) {
            query.skills = { $in: skillParams };
        }

        const sets = await FlashcardSet.find(query).sort({ visibility: 1, createdAt: -1 }).lean();

        const transformed = sets.map(s => ({
            id: s._id.toString(),
            title: s.title,
            description: s.description,
            icon: s.icon,
            levels: s.levels,
            skills: s.skills,
            cardCount: s.cards.length,
            tags: s.tags,
            visibility: s.visibility,
            creatorName: s.creatorName,
            userId: s.userId?.toString()
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
        const { deckId } = req.query;
        let query = {};

        if (deckId) {
            query._id = deckId;
        }

        const visibilityFilters = [
            { visibility: 'global' },
            { visibility: 'public' }
        ];

        if (req.user) {
            const userId = req.user.id || req.user.userId;
            visibilityFilters.push({ visibility: 'private', userId });
        }

        // Combine deckId with visibility check
        if (query._id) {
            query = { $and: [{ _id: deckId }, { $or: visibilityFilters }] };
        } else {
            query.$or = visibilityFilters;
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
        const { title, description, levels, skills, icon, tags, cards, visibility } = req.body;

        if (!title || !cards || !Array.isArray(cards)) {
            return res.status(400).json({ error: 'Title and cards are required' });
        }

        const set = new FlashcardSet({
            title,
            description: description || '',
            levels: levels || ['N3'],
            skills: skills || ['VOCABULARY'],
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

/**
 * PATCH /flashcards/sets/:id
 */
router.patch('/sets/:id', verifyJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id || req.user.userId;
        const updates = req.body;

        const set = await FlashcardSet.findById(id);
        if (!set) return res.status(404).json({ error: 'Set not found' });

        // Check ownership
        if (set.userId.toString() !== userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // Apply updates
        if (updates.title) set.title = updates.title;
        if (updates.description !== undefined) set.description = updates.description;
        if (updates.levels) set.levels = updates.levels;
        if (updates.skills) set.skills = updates.skills;
        if (updates.icon) set.icon = updates.icon;
        if (updates.tags) set.tags = updates.tags;
        if (updates.visibility) set.visibility = updates.visibility;
        if (updates.cards) {
            set.cards = updates.cards.map(c => ({
                front: c.front,
                back: c.back,
                reading: c.reading || '',
                mnemonic: c.mnemonic || ''
            }));
        }

        await set.save();
        res.status(200).json({ message: 'Set updated successfully', id });
    } catch (err) {
        console.error('Update Flashcard Set Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * POST /flashcards/sets/:id/clone
 * Clone a flashcard set to user's collection
 */
router.post('/sets/:id/clone', verifyJWT, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const username = req.user.username || 'User';

        const original = await FlashcardSet.findById(req.params.id).lean();
        if (!original) return res.status(404).json({ error: 'Set not found' });

        // Can only clone global or public items (not private unless owner)
        if (original.visibility === 'private' && original.userId?.toString() !== userId) {
            return res.status(403).json({ error: 'Cannot clone private item' });
        }

        const clone = new FlashcardSet({
            title: `${original.title} (Copy)`,
            description: original.description,
            icon: original.icon,
            levels: original.levels,
            tags: original.tags || [],
            customTags: [],
            skills: original.skills || [],
            cards: original.cards,
            visibility: 'private',
            userId: userId,
            creatorName: username,
            clonedFrom: original._id
        });

        await clone.save();
        res.status(201).json({
            id: clone._id.toString(),
            message: 'Cloned successfully'
        });
    } catch (err) {
        console.error('Clone Flashcard Set Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /flashcards/my-tags
 * Get all custom tags from user's flashcard sets
 */
router.get('/my-tags', verifyJWT, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const sets = await FlashcardSet.find({ userId }).select('customTags').lean();
        const allTags = [...new Set(sets.flatMap(s => s.customTags || []))];
        res.json({ tags: allTags });
    } catch (err) {
        console.error('Get My Tags Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * DELETE /flashcards/sets/:id
 * Delete a flashcard set
 */
router.delete('/sets/:id', verifyJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id || req.user.userId;

        const set = await FlashcardSet.findById(id);
        if (!set) return res.status(404).json({ error: 'Set not found' });

        // Check ownership
        if (set.userId.toString() !== userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        await FlashcardSet.findByIdAndDelete(id);
        res.status(200).json({ message: 'Set deleted successfully' });
    } catch (err) {
        console.error('Delete Flashcard Set Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
