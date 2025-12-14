
const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    refresh_token: {
        type: String,
        required: true
    },
    expires_at: {
        type: Date,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

const Session = mongoose.model('Session', SessionSchema);
module.exports = { Session };
