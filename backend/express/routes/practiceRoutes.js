/**
 * Practice Routes
 * Unified API for all practice functionality
 */

const express = require('express');
const router = express.Router();
const { PracticeNode } = require('../models/PracticeNode');
const { PracticeAttempt } = require('../models/PracticeAttempt');
const { verifyJWT, verifyAccessToken, optionalAuth } = require('../middleware/auth');

// ============================================================================
// PUBLIC ROUTES (No auth required)
// ============================================================================

/**
 * GET /practice/nodes
 */
router.get('/nodes', optionalAuth, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        const { levels, skills, mode, visibility } = req.query;

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
            if (!req.user) return res.status(200).json({ nodes: [], total: 0 });
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
        if (mode && mode !== 'ALL') query.mode = mode;


        const [nodes, total] = await Promise.all([
            PracticeNode.find(query)
                .select('-questions')
                .sort({ visibility: 1, createdAt: -1 })
                .skip(offset)
                .limit(limit)
                .lean(),
            PracticeNode.countDocuments(query)
        ]);

        const transformedNodes = nodes.map(node => ({
            id: node._id.toString(),
            title: node.title,
            description: node.description,
            mode: node.mode,
            tags: {
                levels: node.levels,
                skills: node.skills,
                origin: node.origin,
                visibility: node.visibility
            },
            stats: {
                questionCount: node.stats?.questionCount || 0,
                timeLimitMinutes: node.timeLimitMinutes,
                avgScore: node.stats?.avgScore || 0,
                attemptCount: node.stats?.attemptCount || 0
            },
            creatorName: node.creatorName,
            userId: node.userId?.toString(),
            createdAt: node.createdAt
        }));

        res.status(200).json({ nodes: transformedNodes, total });
    } catch (err) {
        console.error('List Nodes Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /practice/nodes/:id
 */
router.get('/nodes/:id', optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const node = await PracticeNode.findById(id).lean();

        if (!node) {
            return res.status(404).json({ error: 'Practice node not found' });
        }

        if (node.visibility === 'private') {
            if (!req.user) return res.status(403).json({ error: 'Forbidden' });
            const userId = req.user.id || req.user.userId;
            if (node.userId.toString() !== userId) return res.status(403).json({ error: 'Forbidden' });
        }

        const response = {
            node: {
                id: node._id.toString(),
                title: node.title,
                description: node.description,
                mode: node.mode,
                tags: {
                    levels: node.levels,
                    skills: node.skills,
                    origin: node.origin,
                    visibility: node.visibility
                },
                stats: {
                    questionCount: node.stats?.questionCount || node.questions.length,
                    timeLimitMinutes: node.timeLimitMinutes
                },
                creatorName: node.creatorName
            },
            questions: node.questions.map(q => ({
                id: q.id,
                type: q.type,
                content: q.content,
                passage: q.passage,
                options: q.options,
                correctOptionId: q.correctOptionId,
                explanation: q.explanation
            }))
        };

        res.status(200).json(response);
    } catch (err) {
        console.error('Get Node Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /practice/nodes
 */
router.post('/nodes', verifyJWT, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const username = req.user.username || 'User';
        const { title, description, mode, levels, skills, timeLimitMinutes, questions, visibility } = req.body;

        if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ error: 'Title and at least one question are required' });
        }

        const node = new PracticeNode({
            title,
            description: description || '',
            mode: mode || 'QUIZ',
            levels: levels || ['N5'],
            skills: skills || [],
            origin: 'user',
            visibility: visibility || 'private',
            userId,
            creatorName: username,
            timeLimitMinutes: timeLimitMinutes || null,
            questions: questions.map((q, i) => ({
                id: q.id || `q-${Date.now()}-${i}`,
                type: q.type || 'MULTIPLE_CHOICE',
                content: q.content,
                passage: q.passage || null,
                options: q.options || [],
                correctOptionId: q.correctOptionId,
                explanation: q.explanation || ''
            }))
        });

        await node.save();

        res.status(201).json({
            id: node._id.toString(),
            message: 'Practice protocol created successfully'
        });
    } catch (err) {
        console.error('Create Node Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ... rest of the file (attempts, delete) remain same ...
// Note: I'm only showing the changed parts for brevity in my thought, 
// but I'll write the full file.

const { calculatePracticeResult } = require('../utils/resultCalculator');

router.post('/nodes/:id/submit', optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user ? (req.user.id || req.user.userId) : null;
        const { answers, timeSpentSeconds } = req.body;

        const node = await PracticeNode.findById(id);
        if (!node) return res.status(404).json({ error: 'Practice node not found' });

        const answersMap = {};
        (answers || []).forEach(a => { answersMap[a.questionId] = a.selectedOptionId; });

        let correctCount = 0;
        let incorrectCount = 0;
        let unansweredCount = 0;

        const scoredAnswers = node.questions.map(q => {
            const selectedOptionId = answersMap[q.id] || null;
            const isCorrect = selectedOptionId === q.correctOptionId;
            if (!selectedOptionId) unansweredCount++;
            else if (isCorrect) correctCount++;
            else incorrectCount++;

            return { questionId: q.id, selectedOptionId, isCorrect, timeSpentSeconds: 0 };
        });

        const maxScore = node.questions.length;
        const score = correctCount;
        const percentage = Math.round((score / maxScore) * 100);
        const status = percentage >= 60 ? 'PASSED' : 'FAILED';

        // Create the attempt object
        const attemptData = {
            nodeId: id,
            userId,
            isAnonymous: !userId,
            answers: scoredAnswers,
            score, maxScore, percentage, correctCount, incorrectCount, unansweredCount,
            timeSpentSeconds: timeSpentSeconds || 0,
            status,
            completedAt: new Date()
        };

        const attempt = new PracticeAttempt(attemptData);
        await attempt.save();

        // Update node stats
        await PracticeNode.findByIdAndUpdate(id, { $inc: { 'stats.attemptCount': 1 } });

        const unifiedResult = calculatePracticeResult(node, attempt);

        res.status(200).json({
            attemptId: attempt._id.toString(),
            result: unifiedResult
        });
    } catch (err) {
        console.error('Submit Attempt Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /practice/attempts/:id
 * Fetch a specific attempt with full unified result
 */
router.get('/attempts/:id', optionalAuth, async (req, res) => {
    try {
        const attempt = await PracticeAttempt.findById(req.params.id)
            .populate('nodeId')
            .lean();

        if (!attempt) return res.status(404).json({ error: 'Attempt not found' });

        // Authorization logic:
        // 1. If it's anonymous, anyone can view it via the deep link ID.
        // 2. If it's owned by a user, only that user can view it.
        if (!attempt.isAnonymous) {
            if (!req.user) return res.status(401).json({ error: 'Authentication required' });

            const userId = req.user.id || req.user.userId;
            if (attempt.userId && attempt.userId.toString() !== userId) {
                return res.status(403).json({ error: 'Forbidden' });
            }
        }

        const unifiedResult = calculatePracticeResult(attempt.nodeId, attempt);
        res.status(200).json(unifiedResult);
    } catch (err) {
        console.error('Get Attempt Detail Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /attempts/:id/claim
 * Claim an anonymous attempt for the logged-in user
 */
router.post('/attempts/:id/claim', verifyJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id || req.user.userId;

        const attempt = await PracticeAttempt.findById(id);

        if (!attempt) {
            return res.status(404).json({ error: 'Attempt not found' });
        }

        if (!attempt.isAnonymous || attempt.userId) {
            return res.status(400).json({ error: 'This attempt has already been claimed or is not anonymous' });
        }

        // Link to user and remove anonymous flag
        attempt.userId = userId;
        attempt.isAnonymous = false;
        await attempt.save();

        res.status(200).json({
            message: 'Attempt successfully claimed',
            id: attempt._id.toString()
        });
    } catch (err) {
        console.error('Claim Attempt Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/attempts', verifyJWT, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;

        const [attempts, total] = await Promise.all([
            PracticeAttempt.find({ userId })
                .populate('nodeId', 'title level mode')
                .sort({ completedAt: -1 })
                .skip(offset)
                .limit(limit)
                .lean(),
            PracticeAttempt.countDocuments({ userId })
        ]);

        const transformed = attempts.map(a => ({
            id: a._id.toString(),
            nodeId: a.nodeId?._id?.toString(),
            nodeTitle: a.nodeId?.title,
            nodeLevels: a.nodeId?.levels,
            nodeMode: a.nodeId?.mode,
            score: a.score,
            maxScore: a.maxScore,
            percentage: a.percentage,
            status: a.status,
            timeSpentSeconds: a.timeSpentSeconds,
            completedAt: a.completedAt
        }));

        res.status(200).json({ attempts: transformed, total });
    } catch (err) {
        console.error('Get Attempts Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/nodes/:id', verifyJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id || req.user.userId;

        const node = await PracticeNode.findById(id);
        if (!node) return res.status(404).json({ error: 'Practice node not found' });

        if (node.origin === 'system' || node.visibility === 'global') {
            return res.status(403).json({ error: 'Cannot delete system nodes' });
        }
        if (node.userId && node.userId.toString() !== userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        await PracticeNode.findByIdAndDelete(id);
        res.status(200).json({ message: 'Practice protocol deleted successfully' });
    } catch (err) {
        console.error('Delete Node Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PATCH /practice/nodes/:id
 */
router.patch('/nodes/:id', verifyJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id || req.user.userId;
        const updates = req.body;

        const node = await PracticeNode.findById(id);
        if (!node) return res.status(404).json({ error: 'Practice node not found' });

        // Check ownership
        if (node.userId && node.userId.toString() !== userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // Apply updates
        if (updates.title) node.title = updates.title;
        if (updates.description !== undefined) node.description = updates.description;
        if (updates.mode) node.mode = updates.mode;
        if (updates.levels) node.levels = updates.levels;
        if (updates.skills) node.skills = updates.skills;
        if (updates.visibility) node.visibility = updates.visibility;
        if (updates.timeLimitMinutes !== undefined) node.timeLimitMinutes = updates.timeLimitMinutes;
        if (updates.questions) {
            node.questions = updates.questions.map((q, i) => ({
                id: q.id || `q-${Date.now()}-${i}`,
                type: q.type || 'MULTIPLE_CHOICE',
                content: q.content,
                passage: q.passage || null,
                options: q.options || [],
                correctOptionId: q.correctOptionId,
                explanation: q.explanation || ''
            }));
        }

        await node.save();
        res.status(200).json({ message: 'Practice node updated successfully', id });
    } catch (err) {
        console.error('Update Practice Node Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * POST /practice/nodes/:id/clone
 * Clone a practice node to user's collection
 */
router.post('/nodes/:id/clone', verifyJWT, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const username = req.user.username || 'User';

        const original = await PracticeNode.findById(req.params.id).lean();
        if (!original) return res.status(404).json({ error: 'Practice node not found' });

        // Can only clone global or public items (not private unless owner)
        if (original.visibility === 'private' && original.userId?.toString() !== userId) {
            return res.status(403).json({ error: 'Cannot clone private item' });
        }

        const clone = new PracticeNode({
            title: `${original.title} (Copy)`,
            description: original.description,
            mode: original.mode,
            levels: original.levels,
            skills: original.skills || [],
            customTags: [],
            origin: 'user',
            questions: original.questions,
            timeLimitMinutes: original.timeLimitMinutes,
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
        console.error('Clone Practice Node Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /practice/my-tags
 * Get all custom tags from user's practice nodes
 */
router.get('/my-tags', verifyJWT, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const nodes = await PracticeNode.find({ userId }).select('customTags').lean();
        const allTags = [...new Set(nodes.flatMap(n => n.customTags || []))];
        res.json({ tags: allTags });
    } catch (err) {
        console.error('Get My Tags Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * DELETE /practice/nodes/:id
 * Delete a practice node
 */
router.delete('/nodes/:id', verifyJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id || req.user.userId;

        const node = await PracticeNode.findById(id);
        if (!node) return res.status(404).json({ error: 'Practice node not found' });

        // Check ownership
        if (node.userId && node.userId.toString() !== userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        await PracticeNode.findByIdAndDelete(id);
        res.status(200).json({ message: 'Practice node deleted successfully' });
    } catch (err) {
        console.error('Delete Practice Node Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
