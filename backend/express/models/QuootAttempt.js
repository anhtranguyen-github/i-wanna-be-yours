const mongoose = require('mongoose');

const QuootAttemptSchema = new mongoose.Schema({
    arenaId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuootArena', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    isAnonymous: { type: Boolean, default: false },
    score: { type: Number, required: true },
    correctCount: { type: Number, required: true },
    totalCards: { type: Number, required: true },
    maxStreak: { type: Number, default: 0 },
    accuracy: { type: Number, required: true },
    completedAt: { type: Date, default: Date.now }
});

module.exports = { QuootAttempt: mongoose.model('QuootAttempt', QuootAttemptSchema) };
