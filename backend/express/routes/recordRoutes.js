const express = require('express');
const router = express.Router();
const { SessionRecord } = require('../models/SessionRecord');
const { verifyJWT, optionalAuth } = require('../middleware/auth');

router.post('/', optionalAuth, async (req, res) => {
    try {
        if (!req.user) {
            // Guest mode: return success but don't save
            return res.status(200).json({ message: 'Guest session record acknowledged' });
        }

        const userId = req.user.id || req.user.userId;
        const { itemType, itemId, itemTitle, score, status, sessionId, duration, details } = req.body;

        const record = await SessionRecord.create({
            userId,
            itemType,
            itemId,
            itemTitle,
            score,
            status,
            sessionId,
            duration,
            details
        });

        res.status(201).json(record);
    } catch (err) {
        console.error("Save Record Error:", err);
        res.status(500).json({ error: 'Failed to save record' });
    }
});

router.get('/history', verifyJWT, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const { limit = 20, offset = 0 } = req.query;

        const records = await SessionRecord.find({ userId })
            .sort({ timestamp: -1 })
            .skip(Number(offset))
            .limit(Number(limit));

        res.status(200).json(records);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

module.exports = router;
