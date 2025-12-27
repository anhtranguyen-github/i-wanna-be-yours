const express = require('express');
const router = express.Router();
const { QuootArena } = require('../models/QuootArena');
const { verifyJWT, optionalAuth } = require('../middleware/auth');

/**
 * GET /quoot/arenas
 * List available arenas with visibility filtering
 */
router.get('/arenas', optionalAuth, async (req, res) => {
    try {
        const { level, visibility } = req.query;
        let query = {};

        // Visibility Logic:
        // 1. Always show 'global'
        // 2. Show 'public' if requested or by default? 
        // 3. Show 'private' ONLY if it belongs to req.user

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

        if (level && level !== 'ALL') {
            query.level = level;
        }

        const arenas = await QuootArena.find(query).sort({ visibility: 1, createdAt: -1 }).lean();

        const transformed = arenas.map(a => ({
            id: a._id.toString(),
            title: a.title,
            description: a.description,
            icon: a.icon,
            level: a.level,
            cardCount: a.cards.length,
            stats: a.stats,
            visibility: a.visibility,
            creatorName: a.creatorName,
            userId: a.userId?.toString()
        }));

        res.status(200).json(transformed);
    } catch (err) {
        console.error('Fetch Quoot Arenas Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /quoot/arenas/:id
 */
router.get('/arenas/:id', optionalAuth, async (req, res) => {
    try {
        const arena = await QuootArena.findById(req.params.id).lean();
        if (!arena) return res.status(404).json({ error: 'Arena not found' });

        // Access Control
        if (arena.visibility === 'private') {
            if (!req.user) return res.status(403).json({ error: 'Forbidden' });
            const userId = req.user.id || req.user.userId;
            if (arena.userId.toString() !== userId) return res.status(403).json({ error: 'Forbidden' });
        }

        res.status(200).json({
            ...arena,
            id: arena._id.toString()
        });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /quoot/arenas
 * Create a new custom quoot arena
 */
router.post('/arenas', verifyJWT, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const username = req.user.username || 'User'; // Assume username is in JWT or fallback
        const { title, description, level, icon, cards, visibility } = req.body;

        if (!title || !cards || !Array.isArray(cards)) {
            return res.status(400).json({ error: 'Title and cards are required' });
        }

        const arena = new QuootArena({
            title,
            description: description || '',
            level: level || 'N3',
            icon: icon || '⚔️',
            visibility: visibility || 'private',
            userId,
            creatorName: username,
            cards: cards.map(c => ({
                front: c.front,
                back: c.back,
                reading: c.reading || '',
                type: c.type || 'vocabulary'
            }))
        });

        await arena.save();

        res.status(201).json({
            id: arena._id.toString(),
            message: 'Quoot arena created successfully'
        });
    } catch (err) {
        console.error('Create Quoot Arena Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const { QuootAttempt } = require('../models/QuootAttempt');
const { calculateQuootResult } = require('../utils/resultCalculator');

/**
 * POST /quoot/arenas/:id/submit
 */
router.post('/arenas/:id/submit', verifyJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id || req.user.userId;
        const { score, correctCount, maxStreak, totalCards } = req.body;

        const arena = await QuootArena.findById(id).lean();
        if (!arena) return res.status(404).json({ error: 'Arena not found' });

        const accuracy = Math.round((correctCount / totalCards) * 100);

        const attempt = new QuootAttempt({
            arenaId: id,
            userId,
            score,
            correctCount,
            totalCards,
            maxStreak,
            accuracy
        });

        await attempt.save();

        // Calculate unified result for frontend
        const unifiedResult = calculateQuootResult(arena, {
            score,
            correctCount,
            maxStreak,
            totalCards
        });

        res.status(200).json({
            attemptId: attempt._id.toString(),
            result: unifiedResult
        });
    } catch (err) {
        console.error('Submit Quoot Attempt Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /quoot/attempts/:id
 */
router.get('/attempts/:id', verifyJWT, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const attempt = await QuootAttempt.findById(req.params.id)
            .populate('arenaId')
            .lean();

        if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
        if (attempt.userId.toString() !== userId) return res.status(403).json({ error: 'Forbidden' });

        const unifiedResult = calculateQuootResult(attempt.arenaId, attempt);
        res.status(200).json(unifiedResult);
    } catch (err) {
        console.error('Get Quoot Attempt Detail Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PATCH /quoot/arenas/:id
 */
router.patch('/arenas/:id', verifyJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id || req.user.userId;
        const updates = req.body;

        const arena = await QuootArena.findById(id);
        if (!arena) return res.status(404).json({ error: 'Arena not found' });

        // Check ownership
        if (arena.userId.toString() !== userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // Apply updates
        if (updates.title) arena.title = updates.title;
        if (updates.description !== undefined) arena.description = updates.description;
        if (updates.level) arena.level = updates.level;
        if (updates.icon) arena.icon = updates.icon;
        if (updates.visibility) arena.visibility = updates.visibility;
        if (updates.cards) {
            arena.cards = updates.cards.map(c => ({
                front: c.front,
                back: c.back,
                reading: c.reading || '',
                type: c.type || 'vocabulary'
            }));
        }

        await arena.save();
        res.status(200).json({ message: 'Arena updated successfully', id });
    } catch (err) {
        console.error('Update Quoot Arena Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * POST /quoot/arenas/:id/clone
 * Clone a quoot arena to user's collection
 */
router.post('/arenas/:id/clone', verifyJWT, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const username = req.user.username || 'User';

        const original = await QuootArena.findById(req.params.id).lean();
        if (!original) return res.status(404).json({ error: 'Arena not found' });

        // Can only clone global or public items (not private unless owner)
        if (original.visibility === 'private' && original.userId?.toString() !== userId) {
            return res.status(403).json({ error: 'Cannot clone private item' });
        }

        const clone = new QuootArena({
            title: `${original.title} (Copy)`,
            description: original.description,
            icon: original.icon,
            level: original.level,
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
        console.error('Clone Quoot Arena Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /quoot/my-tags
 * Get all custom tags from user's quoot arenas
 */
router.get('/my-tags', verifyJWT, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const arenas = await QuootArena.find({ userId }).select('customTags').lean();
        const allTags = [...new Set(arenas.flatMap(a => a.customTags || []))];
        res.json({ tags: allTags });
    } catch (err) {
        console.error('Get My Tags Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * DELETE /quoot/arenas/:id
 * Delete a quoot arena
 */
router.delete('/arenas/:id', verifyJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id || req.user.userId;

        const arena = await QuootArena.findById(id);
        if (!arena) return res.status(404).json({ error: 'Arena not found' });

        // Check ownership
        if (arena.userId.toString() !== userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        await QuootArena.findByIdAndDelete(id);
        res.status(200).json({ message: 'Arena deleted successfully' });
    } catch (err) {
        console.error('Delete Quoot Arena Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
