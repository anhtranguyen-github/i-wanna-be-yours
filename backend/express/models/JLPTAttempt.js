const mongoose = require('mongoose');

const jlptAttemptSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    examId: {
        type: String,
        required: true
    },
    examTitle: {
        type: String,
        required: true
    },
    examMode: {
        type: String,
        enum: ['QUIZ', 'SINGLE_EXAM', 'FULL_EXAM'],
        required: true
    },
    level: {
        type: String,
        enum: ['N5', 'N4', 'N3', 'N2', 'N1'],
        required: true
    },

    // Results
    totalQuestions: Number,
    correctAnswers: Number,
    incorrectAnswers: Number,
    unansweredQuestions: Number,
    scorePercentage: Number,
    passed: Boolean,

    // Timing
    startedAt: Date,
    completedAt: Date,
    timeTakenSeconds: Number,

    // Details
    skillBreakdown: [
        {
            skill: String,
            totalQuestions: Number,
            correctAnswers: Number,
            percentage: Number
        }
    ],
    // Store answers as a map or mixed object
    answers: mongoose.Schema.Types.Mixed
}, {
    timestamps: true
});

const JLPTAttempt = mongoose.model('JLPTAttempt', jlptAttemptSchema);

module.exports = { JLPTAttempt };
