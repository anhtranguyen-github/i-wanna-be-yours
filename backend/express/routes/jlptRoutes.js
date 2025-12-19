const express = require('express');
const router = express.Router();
const { JLPTAttempt } = require('../models/JLPTAttempt');
const { JLPTUserExam } = require('../models/JLPTUserExam');
const { verifyAccessToken } = require('../utils/auth');

/**
 * Middleware to protect routes and attach user to request
 */
async function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    if (!payload) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    req.user = payload;
    next();
}

// === Attempts Routes ===

/**
 * GET /jlpt/attempts
 * Fetch user's exam attempts
 */
router.get('/attempts', authenticate, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;

        const [attempts, total] = await Promise.all([
            JLPTAttempt.find({ userId: req.user.id || req.user.userId })
                .sort({ completedAt: -1 })
                .skip(offset)
                .limit(limit),
            JLPTAttempt.countDocuments({ userId: req.user.id || req.user.userId })
        ]);

        res.status(200).json({ attempts, total });
    } catch (err) {
        console.error('Fetch Attempts Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /jlpt/attempts
 * Save a new exam attempt
 */
router.post('/attempts', authenticate, async (req, res) => {
    try {
        const attemptData = {
            ...req.body,
            userId: req.user.id || req.user.userId
        };

        const attempt = await JLPTAttempt.create(attemptData);

        // Update stats if it was a user-created exam
        if (attempt.examId.startsWith('user-exam-')) {
            // Find the exam and update its stats
            // We could use an increment here
            await JLPTUserExam.findByIdAndUpdate(attempt.examId.replace('user-exam-', ''), {
                $inc: { timesAttempted: 1 }
            });
        }

        res.status(201).json({ id: attempt._id });
    } catch (err) {
        console.error('Save Attempt Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// === Exams Routes ===

/**
 * GET /jlpt/exams
 * Fetch user's created exams
 */
router.get('/exams', authenticate, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;

        const [exams, total] = await Promise.all([
            JLPTUserExam.find({ userId: req.user.id || req.user.userId })
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(limit),
            JLPTUserExam.countDocuments({ userId: req.user.id || req.user.userId })
        ]);

        res.status(200).json({ exams, total });
    } catch (err) {
        console.error('Fetch Exams Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /jlpt/exams
 * Create a new custom exam
 */
router.post('/exams', authenticate, async (req, res) => {
    try {
        const examData = {
            ...req.body,
            userId: req.user.id || req.user.userId
        };

        const exam = await JLPTUserExam.create(examData);
        res.status(201).json({ id: exam._id });
    } catch (err) {
        console.error('Create Exam Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PUT /jlpt/exams/:id
 * Update an existing custom exam
 */
router.put('/exams/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id || req.user.userId;

        const exam = await JLPTUserExam.findOneAndUpdate(
            { _id: id, userId },
            req.body,
            { new: true }
        );

        if (!exam) {
            return res.status(404).json({ error: 'Exam not found or unauthorized' });
        }

        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Update Exam Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * DELETE /jlpt/exams/:id
 * Delete a custom exam
 */
router.delete('/exams/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id || req.user.userId;

        const result = await JLPTUserExam.deleteOne({ _id: id, userId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Exam not found or unauthorized' });
        }

        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Delete Exam Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /jlpt/exams/:id
 * Get a specific exam (can be public or owned by user)
 */
router.get('/exams/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const exam = await JLPTUserExam.findById(id);

        if (!exam) {
            return res.status(404).json({ error: 'Exam not found' });
        }

        // If private, check ownership
        if (!exam.isPublic) {
            const authHeader = req.headers.authorization;
            if (!authHeader) return res.status(403).json({ error: 'Forbidden' });

            const token = authHeader.split(' ')[1];
            const payload = verifyAccessToken(token);
            if (!payload || (payload.id !== exam.userId.toString() && payload.userId !== exam.userId.toString())) {
                return res.status(403).json({ error: 'Forbidden' });
            }
        }

        res.status(200).json(exam);
    } catch (err) {
        console.error('Get Exam Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// === AI Generation ===

/**
 * POST /jlpt/generate
 * Mock endpoint for AI generation
 */
router.post('/generate', authenticate, async (req, res) => {
    try {
        // In a real app, this would call an LLM
        // For now, we'll return mock data or a helpful message
        const { level, skills, count } = req.body;

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        res.status(200).json({
            message: 'Questions generated successfully',
            questions: [] // Implementation would return actual questions
        });
    } catch (err) {
        console.error('Generation Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
