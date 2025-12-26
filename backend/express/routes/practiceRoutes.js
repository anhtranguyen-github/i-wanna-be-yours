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
        const level = req.query.level;
        const mode = req.query.mode;
        const visibilityFilter = req.query.visibility;

        let query = {};

        const visibilityFilters = [];
        visibilityFilters.push({ visibility: 'global' });
        visibilityFilters.push({ visibility: 'public' });

        if (req.user) {
            const userId = req.user.id || req.user.userId;
            visibilityFilters.push({ visibility: 'private', userId });
        }

        query.$or = visibilityFilters;

        if (level && level !== 'ALL') query.level = level;
        if (mode && mode !== 'ALL') query.mode = mode;

        if (visibilityFilter && ['global', 'public', 'private'].includes(visibilityFilter)) {
            if (visibilityFilter === 'private') {
                if (!req.user) return res.status(200).json({ nodes: [], total: 0 });
                query = { visibility: 'private', userId: req.user.id || req.user.userId };
            } else {
                query = { visibility: visibilityFilter };
            }
        }

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
                level: node.level,
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
                    level: node.level,
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
        const { title, description, mode, level, skills, timeLimitMinutes, questions, visibility } = req.body;

        if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ error: 'Title and at least one question are required' });
        }

        const node = new PracticeNode({
            title,
            description: description || '',
            mode: mode || 'QUIZ',
            level: level || 'N5',
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

router.post('/nodes/:id/submit', verifyJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id || req.user.userId;
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

        const attempt = new PracticeAttempt({
            nodeId: id,
            userId,
            answers: scoredAnswers,
            score, maxScore, percentage, correctCount, incorrectCount, unansweredCount,
            timeSpentSeconds: timeSpentSeconds || 0,
            status
        });

        await attempt.save();

        await PracticeNode.findByIdAndUpdate(id, { $inc: { 'stats.attemptCount': 1 } });

        res.status(200).json({
            attemptId: attempt._id.toString(),
            score, maxScore, percentage, correctCount, incorrectCount, unansweredCount, status,
            answers: scoredAnswers
        });
    } catch (err) {
        console.error('Submit Attempt Error:', err);
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
            nodeLevel: a.nodeId?.level,
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

module.exports = router;
