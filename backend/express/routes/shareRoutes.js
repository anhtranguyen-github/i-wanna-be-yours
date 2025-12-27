const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { Share } = require('../models/Share');
const { FlashcardSet } = require('../models/FlashcardSet');
const { PracticeNode } = require('../models/PracticeNode');
const { QuootArena } = require('../models/QuootArena');
const { verifyJWT, optionalAuth } = require('../middleware/auth');

/**
 * POST /share/:type/:id
 * Generate a share link for a specific content item
 */
router.post('/:type/:id', verifyJWT, async (req, res) => {
    try {
        const { type, id } = req.params;
        const userId = req.user.id || req.user.userId;
        const { expiresInHours } = req.body;

        // 1. Verify content exists AND user owns it
        let content;
        let contentType;

        if (type === 'flashcard-deck') {
            content = await FlashcardSet.findById(id);
            contentType = 'flashcard-deck';
        } else if (type === 'practice-arena') {
            content = await PracticeNode.findById(id);
            contentType = 'practice-arena';
        } else if (type === 'quoot-arena') {
            content = await QuootArena.findById(id);
            contentType = 'quoot-arena';
        } else {
            return res.status(400).json({ error: 'Invalid content type' });
        }

        if (!content) {
            return res.status(404).json({ error: 'Content not found' });
        }

        // Check ownership
        if (content.userId.toString() !== userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // 2. Generate share link
        const shareId = crypto.randomBytes(8).toString('hex');
        const expiresAt = expiresInHours ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000) : null;

        const share = new Share({
            shareId,
            contentId: id,
            contentType,
            ownerId: userId,
            expiresAt
        });

        await share.save();

        res.status(201).json({
            shareId,
            shareUrl: `/shared/${shareId}`,
            expiresAt
        });
    } catch (err) {
        console.error('Share Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /share/:shareId
 * Resolve a share link to get content data
 */
router.get('/:shareId', optionalAuth, async (req, res) => {
    try {
        const { shareId } = req.params;
        const share = await Share.findOne({ shareId });

        if (!share) {
            return res.status(404).json({ error: 'Share link not found' });
        }

        // Check expiration
        if (share.expiresAt && share.expiresAt < new Date()) {
            return res.status(410).json({ error: 'Share link expired' });
        }

        // Fetch content
        let content;
        if (share.contentType === 'flashcard-deck') {
            content = await FlashcardSet.findById(share.contentId).lean();
        } else if (share.contentType === 'practice-arena') {
            content = await PracticeNode.findById(share.contentId).lean();
        } else if (share.contentType === 'quoot-arena') {
            content = await QuootArena.findById(share.contentId).lean();
        }

        if (!content) {
            return res.status(404).json({ error: 'Original content no longer exists' });
        }

        // Check if user is the owner
        const isOwner = req.user && (req.user.id || req.user.userId) === share.ownerId.toString();

        res.status(200).json({
            content: {
                ...content,
                id: content._id.toString()
            },
            type: share.contentType,
            isOwner
        });
    } catch (err) {
        console.error('Resolve Share Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
