/**
 * PracticeAttempt Model
 * Tracks user attempts on practice nodes
 */

const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema({
    questionId: { type: String, required: true },
    selectedOptionId: { type: String, default: null },
    isCorrect: { type: Boolean, default: false },
    timeSpentSeconds: { type: Number, default: 0 }
}, { _id: false });

const PracticeAttemptSchema = new mongoose.Schema({
    nodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'PracticeNode', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    answers: [AnswerSchema],
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    incorrectCount: { type: Number, default: 0 },
    unansweredCount: { type: Number, default: 0 },
    timeSpentSeconds: { type: Number, default: 0 },
    status: { type: String, enum: ['PASSED', 'FAILED', 'INCOMPLETE'], default: 'INCOMPLETE' },
    completedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Indexes
PracticeAttemptSchema.index({ userId: 1, nodeId: 1 });
PracticeAttemptSchema.index({ userId: 1, completedAt: -1 });

const PracticeAttempt = mongoose.model('PracticeAttempt', PracticeAttemptSchema);

module.exports = { PracticeAttempt };
