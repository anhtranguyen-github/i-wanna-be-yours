const express = require('express');
const router = express.Router();
const { User } = require('../models/User');
const { verifyJWT } = require('../middleware/auth');

/**
 * @route GET /e-api/v1/users/settings
 * @desc Get user settings
 * @access Private
 */
router.get('/settings', verifyJWT, async (req, res) => {
    try {
        const user = await User.findById(req.user.user_id).select('settings display_name bio email');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route PATCH /e-api/v1/users/settings
 * @desc Update user settings or profile
 * @access Private
 */
router.patch('/settings', verifyJWT, async (req, res) => {
    try {
        const { settings, display_name, bio } = req.body;
        const update = {};

        if (settings) {
            // Merge settings
            const user = await User.findById(req.user.user_id);
            update.settings = { ...user.settings, ...settings };
        }

        if (display_name !== undefined) update.display_name = display_name;
        if (bio !== undefined) update.bio = bio;

        const updatedUser = await User.findByIdAndUpdate(
            req.user.user_id,
            { $set: update },
            { new: true }
        ).select('settings display_name bio');

        res.json(updatedUser);
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const { FlashcardSet } = require('../models/FlashcardSet');
const { PracticeNode } = require('../models/PracticeNode');
const { QuootArena } = require('../models/QuootArena');
const { SessionRecord } = require('../models/SessionRecord');

/**
 * @route GET /e-api/v1/users/export
 * @desc Export all user data
 * @access Private
 */
router.get('/export', verifyJWT, async (req, res) => {
    try {
        const userId = req.user.user_id;

        const [user, flashcards, practice, quoot, records] = await Promise.all([
            User.findById(userId),
            FlashcardSet.find({ userId }),
            PracticeNode.find({ userId }),
            QuootArena.find({ userId }),
            SessionRecord.find({ userId })
        ]);

        const exportData = {
            profile: {
                email: user.email,
                display_name: user.display_name,
                bio: user.bio,
                settings: user.settings,
                created_at: user.created_at
            },
            followedItems: user.followedItems,
            ownedContent: {
                flashcardSets: flashcards,
                practiceNodes: practice,
                quootArenas: quoot
            },
            learningHistory: records
        };

        res.json(exportData);
    } catch (error) {
        console.error('Error exporting data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route DELETE /e-api/v1/users/account
 * @desc Delete user account and all related data
 * @access Private
 */
router.delete('/account', verifyJWT, async (req, res) => {
    try {
        const userId = req.user.user_id;

        // Perform cascade deletion
        await Promise.all([
            User.findByIdAndDelete(userId),
            FlashcardSet.deleteMany({ userId }),
            PracticeNode.deleteMany({ userId }),
            QuootArena.deleteMany({ userId }),
            SessionRecord.deleteMany({ userId })
        ]);

        res.json({ message: 'Account and all associated data deleted successfully' });
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
