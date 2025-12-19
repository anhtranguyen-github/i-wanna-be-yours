const mongoose = require('mongoose');

const jlptUserExamSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    config: {
        mode: {
            type: String,
            enum: ['QUIZ', 'SINGLE_EXAM', 'FULL_EXAM'],
            required: true
        },
        title: {
            type: String,
            required: true
        },
        description: String,
        level: {
            type: String,
            enum: ['N5', 'N4', 'N3', 'N2', 'N1'],
            required: true
        },
        skills: [String],
        questionCount: Number,
        timerMode: String,
        timeLimitMinutes: Number
    },
    questions: [mongoose.Schema.Types.Mixed],
    origin: {
        type: String,
        enum: ['manual', 'chatbot'],
        default: 'manual'
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    timesAttempted: {
        type: Number,
        default: 0
    },
    averageScore: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

const JLPTUserExam = mongoose.model('JLPTUserExam', jlptUserExamSchema);

module.exports = { JLPTUserExam };
