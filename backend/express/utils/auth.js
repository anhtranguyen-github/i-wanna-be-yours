
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';

async function hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

async function verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
}

function createAccessToken(payload) {
    return jwt.sign(payload, SECRET_KEY, { expiresIn: '15m' });
}

function createRefreshToken() {
    return uuidv4();
}

/**
 * Returns payload if valid, null otherwise
 */
function verifyAccessToken(token) {
    try {
        return jwt.verify(token, SECRET_KEY);
    } catch (e) {
        return null;
    }
}

module.exports = {
    hashPassword,
    verifyPassword,
    createAccessToken,
    createRefreshToken,
    verifyAccessToken
};
