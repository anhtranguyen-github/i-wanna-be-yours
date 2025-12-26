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
 * List practice nodes - supports public and personal filtering
 */
router.get('/nodes', optionalAuth, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        const isPublic = req.query.is_public === 'true';
        const level = req.query.level;
        const mode = req.query.mode;
        const skill = req.query.skill;

        // Build query
        let query = {};

        if (isPublic) {
            // Public nodes - no auth required
            query.isPublic = true;
        } else if (req.user) {
            // Personal nodes - auth required
            query.userId = req.user.id || req.user.userId;
        } else {
            // No auth and not requesting public - return public by default
            query.isPublic = true;
        }

        // Apply filters
        if (level && level !== 'ALL') query.level = level;
        if (mode && mode !== 'ALL') query.mode = mode;
        if (skill && skill !== 'ALL') query.skills = { $in: [skill] };

        const [nodes, total] = await Promise.all([
            PracticeNode.find(query)
                .select('-questions') // Don't include questions in list
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(limit)
                .lean(),
            PracticeNode.countDocuments(query)
        ]);

        // Transform _id to id for frontend
        const transformedNodes = nodes.map(node => ({
            id: node._id.toString(),
            title: node.title,
            description: node.description,
            mode: node.mode,
            tags: {
                level: node.level,
                skills: node.skills,
                origin: node.origin,
                isStrict: node.mode === 'FULL_EXAM'
            },
            stats: {
                questionCount: node.stats?.questionCount || 0,
                timeLimitMinutes: node.timeLimitMinutes,
                avgScore: node.stats?.avgScore || 0,
                attemptCount: node.stats?.attemptCount || 0
            },
            isPublic: node.isPublic,
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
 * Get a single practice node with questions
 */
router.get('/nodes/:id', optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const node = await PracticeNode.findById(id).lean();

        if (!node) {
            return res.status(404).json({ error: 'Practice node not found' });
        }

        // Check access for private nodes
        if (!node.isPublic) {
            if (!req.user) {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const userId = req.user.id || req.user.userId;
            if (node.userId && node.userId.toString() !== userId) {
                return res.status(403).json({ error: 'Forbidden' });
            }
        }

        // Transform for frontend
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
                    isStrict: node.mode === 'FULL_EXAM',
                    timerMode: node.timeLimitMinutes ? 'TIMED' : 'UNLIMITED'
                },
                stats: {
                    questionCount: node.stats?.questionCount || node.questions.length,
                    timeLimitMinutes: node.timeLimitMinutes
                }
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

// ============================================================================
// AUTHENTICATED ROUTES
// ============================================================================

/**
 * POST /practice/nodes
 * Create a new practice node
 */
router.post('/nodes', verifyJWT, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const { title, description, mode, level, skills, timeLimitMinutes, questions, isPublic } = req.body;

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
            isPublic: isPublic !== false, // Default to public
            userId,
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
            message: 'Practice node created successfully'
        });
    } catch (err) {
        console.error('Create Node Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /practice/nodes/:id/submit
 * Submit an attempt for a practice node
 */
router.post('/nodes/:id/submit', verifyJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id || req.user.userId;
        const { answers, timeSpentSeconds } = req.body;

        // Fetch the node to score
        const node = await PracticeNode.findById(id);
        if (!node) {
            return res.status(404).json({ error: 'Practice node not found' });
        }

        // Build answer map
        const answersMap = {};
        (answers || []).forEach(a => {
            answersMap[a.questionId] = a.selectedOptionId;
        });

        // Score the attempt
        let correctCount = 0;
        let incorrectCount = 0;
        let unansweredCount = 0;

        const scoredAnswers = node.questions.map(q => {
            const selectedOptionId = answersMap[q.id] || null;
            const isCorrect = selectedOptionId === q.correctOptionId;

            if (!selectedOptionId) {
                unansweredCount++;
            } else if (isCorrect) {
                correctCount++;
            } else {
                incorrectCount++;
            }

            return {
                questionId: q.id,
                selectedOptionId,
                isCorrect,
                timeSpentSeconds: 0
            };
        });

        const maxScore = node.questions.length;
        const score = correctCount;
        const percentage = Math.round((score / maxScore) * 100);
        const status = percentage >= 60 ? 'PASSED' : 'FAILED';

        // Save attempt
        const attempt = new PracticeAttempt({
            nodeId: id,
            userId,
            answers: scoredAnswers,
            score,
            maxScore,
            percentage,
            correctCount,
            incorrectCount,
            unansweredCount,
            timeSpentSeconds: timeSpentSeconds || 0,
            status
        });

        await attempt.save();

        // Update node stats
        await PracticeNode.findByIdAndUpdate(id, {
            $inc: { 'stats.attemptCount': 1 }
        });

        res.status(200).json({
            attemptId: attempt._id.toString(),
            score,
            maxScore,
            percentage,
            correctCount,
            incorrectCount,
            unansweredCount,
            status,
            answers: scoredAnswers
        });
    } catch (err) {
        console.error('Submit Attempt Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /practice/attempts
 * Get user's attempt history
 */
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

/**
 * DELETE /practice/nodes/:id
 * Delete a practice node (owner only)
 */
router.delete('/nodes/:id', verifyJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id || req.user.userId;

        const node = await PracticeNode.findById(id);
        if (!node) {
            return res.status(404).json({ error: 'Practice node not found' });
        }

        // Only owner can delete (or system nodes can't be deleted)
        if (node.origin === 'system') {
            return res.status(403).json({ error: 'Cannot delete system nodes' });
        }
        if (node.userId && node.userId.toString() !== userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        await PracticeNode.findByIdAndDelete(id);
        res.status(200).json({ message: 'Practice node deleted successfully' });
    } catch (err) {
        console.error('Delete Node Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
