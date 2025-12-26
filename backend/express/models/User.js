
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password_hash: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'user',
        enum: ['user', 'admin']
    },
    is_verified: {
        type: Boolean,
        default: false
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    },
    followedItems: [{
        itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
        itemType: { type: String, enum: ['PRACTICE', 'FLASHCARD', 'QUOOT'], required: true },
        addedAt: { type: Date, default: Date.now }
    }]
});

// Update updated_at on save
UserSchema.pre('save', function (next) {
    this.updated_at = new Date();
    next();
});

const User = mongoose.model('User', UserSchema);
module.exports = { User };
