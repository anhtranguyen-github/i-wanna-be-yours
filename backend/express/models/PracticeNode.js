/**
 * PracticeNode Model
 * Unified model for all practice content (quizzes, exams)
 */

const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    id: { type: String, required: true },
    type: { type: String, enum: ['MULTIPLE_CHOICE', 'FILL_BLANK', 'TRUE_FALSE', 'MATCHING'], default: 'MULTIPLE_CHOICE' },
    content: { type: String, required: true },
    passage: { type: String, default: null },
    options: [{
        id: { type: String, required: true },
        text: { type: String, required: true }
    }],
    correctOptionId: { type: String, required: true },
    explanation: { type: String, default: '' }
}, { _id: false });

const PracticeNodeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    mode: { type: String, enum: ['QUIZ', 'SINGLE_EXAM', 'FULL_EXAM'], default: 'QUIZ' },
    levels: {
        type: [{ type: String, enum: ['N5', 'N4', 'N3', 'N2', 'N1'] }],
        required: true,
        validate: [v => v.length >= 1, 'At least one level required']
    },
    skills: {
        type: [{ type: String, enum: ['VOCABULARY', 'GRAMMAR', 'READING', 'LISTENING', 'KANJI'] }],
        required: true,
        validate: [v => v.length >= 1, 'At least one skill required']
    },
    customTags: [String],
    origin: { type: String, enum: ['system', 'user', 'ai'], default: 'system' },
    visibility: {
        type: String,
        enum: ['global', 'public', 'private'],
        default: 'private'
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    creatorName: { type: String, default: 'System' },
    clonedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'PracticeNode', default: null },
    timeLimitMinutes: { type: Number, default: null },
    questions: [QuestionSchema],
    stats: {
        questionCount: { type: Number, default: 0 },
        avgScore: { type: Number, default: 0 },
        attemptCount: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});


// Pre-save hook to update questionCount
PracticeNodeSchema.pre('save', function (next) {
    this.stats.questionCount = this.questions.length;
    next();
});

// Indexes
PracticeNodeSchema.index({ visibility: 1, levels: 1 });
PracticeNodeSchema.index({ userId: 1 });
PracticeNodeSchema.index({ origin: 1 });

const PracticeNode = mongoose.model('PracticeNode', PracticeNodeSchema);

module.exports = { PracticeNode };
