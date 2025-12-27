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
    levels: {
        type: [{ type: String, enum: ['N5', 'N4', 'N3', 'N2', 'N1'] }],
        required: true,
        validate: [v => v.length >= 1, 'At least one level required']
    },
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
    clonedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'QuootArena', default: null },
    cards: [QuootCardSchema],
    stats: {
        playCount: { type: Number, default: 0 },
        avgScore: { type: Number, default: 0 }
    }
}, { timestamps: true });


module.exports = {
    QuootArena: mongoose.model('QuootArena', QuootArenaSchema)
};
