const express = require('express');
const router = express.Router();
const { User } = require('../models/User');
const { verifyJWT } = require('../middleware/auth');

/**
 * POST /users/follow
 * Follow/Bookmark a public/global item by ID
 */
router.post('/follow', verifyJWT, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const { itemId, itemType } = req.body;

        if (!itemId || !itemType) {
            return res.status(400).json({ error: 'itemId and itemType are required' });
        }

        const validTypes = ['PRACTICE', 'FLASHCARD', 'QUOOT'];
        if (!validTypes.includes(itemType)) {
            return res.status(400).json({ error: 'Invalid itemType' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Check if already following
        // followedItems might be undefined if schema update didn't propagate to instance? Mongoose handles default [] usually if defined in schema.
        // But for existing users, it might be missing?
        const items = user.followedItems || [];
        const alreadyFollowed = items.some(
            item => item.itemId.toString() === itemId && item.itemType === itemType
        );

        if (alreadyFollowed) {
            return res.status(200).json({ message: 'Item already followed' });
        }

        user.followedItems.push({ itemId, itemType });
        await user.save();

        res.status(200).json({ message: 'Item followed successfully' });
    } catch (err) {
        console.error('Follow Item Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /users/followed
 * List followed items
 */
router.get('/followed', verifyJWT, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const user = await User.findById(userId).lean();
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.status(200).json(user.followedItems || []);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
