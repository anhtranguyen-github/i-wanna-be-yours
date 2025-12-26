const mongoose = require('mongoose');

const QuootCardSchema = new mongoose.Schema({
    front: { type: String, required: true },
    back: { type: String, required: true },
    reading: String,
    type: { type: String, default: 'vocabulary' }
});

const QuootArenaSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    icon: { type: String, default: '⚔️' },
    level: { type: String, default: 'N3' },
    visibility: {
        type: String,
        enum: ['global', 'public', 'private'],
        default: 'private'
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    creatorName: { type: String, default: 'System' },
    cards: [QuootCardSchema],
    stats: {
        playCount: { type: Number, default: 0 },
        avgScore: { type: Number, default: 0 }
    }
}, { timestamps: true });

module.exports = {
    QuootArena: mongoose.model('QuootArena', QuootArenaSchema)
};
