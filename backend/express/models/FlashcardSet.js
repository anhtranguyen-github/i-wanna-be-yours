const mongoose = require('mongoose');

const FlashcardSchema = new mongoose.Schema({
    front: { type: String, required: true },
    back: { type: String, required: true },
    reading: String,
    mnemonic: String,
    difficulty: { type: Number, default: 1 }
});

const FlashcardSetSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    icon: { type: String, default: '🎴' },
    levels: {
        type: [{ type: String, enum: ['N5', 'N4', 'N3', 'N2', 'N1'] }],
        required: true,
        validate: [v => v.length >= 1, 'At least one level required']
    },
    tags: [String],
    customTags: [String],
    skills: {
        type: [{ type: String, enum: ['VOCABULARY', 'GRAMMAR', 'KANJI', 'READING', 'LISTENING'] }],
        required: true,
        validate: [v => v.length >= 1, 'At least one skill required']
    },
    visibility: {
        type: String,
        enum: ['global', 'public', 'private'],
        default: 'private'
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    creatorName: { type: String, default: 'System' },
    clonedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'FlashcardSet', default: null },
    cards: [FlashcardSchema],
    stats: {
        totalReviews: { type: Number, default: 0 },
        activeUsers: { type: Number, default: 0 }
    }
}, { timestamps: true });


module.exports = {
    FlashcardSet: mongoose.model('FlashcardSet', FlashcardSetSchema)
};
