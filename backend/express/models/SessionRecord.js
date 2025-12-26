const mongoose = require('mongoose');

const SessionRecordSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    itemType: { type: String, enum: ['PRACTICE', 'FLASHCARD', 'QUOOT'], required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
    itemTitle: { type: String }, // redundant but useful for display
    score: { type: Number }, // 0-100 or raw
    status: { type: String, enum: ['COMPLETED', 'ABANDONED'], default: 'ABANDONED' },
    details: { type: Object }, // Freedom for generic details
    timestamp: { type: Date, default: Date.now }
});

module.exports = { SessionRecord: mongoose.model('SessionRecord', SessionRecordSchema) };
