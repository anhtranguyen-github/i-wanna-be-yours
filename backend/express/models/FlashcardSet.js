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
    level: { type: String, default: 'N3' },
    tags: [String],
    visibility: {
        type: String,
        enum: ['global', 'public', 'private'],
        default: 'private'
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    creatorName: { type: String, default: 'System' },
    cards: [FlashcardSchema],
    stats: {
        totalReviews: { type: Number, default: 0 },
        activeUsers: { type: Number, default: 0 }
    }
}, { timestamps: true });

module.exports = {
    FlashcardSet: mongoose.model('FlashcardSet', FlashcardSetSchema)
};
