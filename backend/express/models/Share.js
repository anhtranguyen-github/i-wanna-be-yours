const mongoose = require('mongoose');

const shareSchema = new mongoose.Schema({
    shareId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    contentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    contentType: {
        type: String,
        required: true,
        enum: ['flashcard-deck', 'practice-arena', 'quoot-arena']
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    expiresAt: {
        type: Date,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Share = mongoose.model('Share', shareSchema);

module.exports = { Share };
