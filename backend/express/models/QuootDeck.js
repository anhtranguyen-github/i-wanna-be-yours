const mongoose = require('mongoose');

const QuootCardSchema = new mongoose.Schema({
    front: { type: String, required: true },
    back: { type: String, required: true },
    reading: String,
    type: { type: String, default: 'vocabulary' }
});

const QuootDeckSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    icon: { type: String, default: '⚔️' },
    level: { type: String, default: 'N3' },
    isPublic: { type: Boolean, default: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cards: [QuootCardSchema],
    stats: {
        playCount: { type: Number, default: 0 },
        avgScore: { type: Number, default: 0 }
    }
}, { timestamps: true });

module.exports = {
    QuootDeck: mongoose.model('QuootDeck', QuootDeckSchema)
};
