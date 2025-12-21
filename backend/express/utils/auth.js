
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const SECRET_KEY = process.env.JWT_SECRET;

if (!SECRET_KEY && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
}

const FINAL_SECRET = SECRET_KEY || 'your-development-secret-key';

async function hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

async function verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
}

function createAccessToken(payload) {
    return jwt.sign(payload, FINAL_SECRET, {
        expiresIn: '15m',
        algorithm: 'HS256'
    });
}

function createRefreshToken() {
    return uuidv4();
}

/**
 * Returns payload if valid, null otherwise
 */
function verifyAccessToken(token) {
    try {
        return jwt.verify(token, FINAL_SECRET, {
            algorithms: ['HS256']
        });
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
