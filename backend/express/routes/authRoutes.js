
const express = require('express');
const router = express.Router();
const { User } = require('../models/User');
const { Session } = require('../models/Session');
const { hashPassword, verifyPassword, createAccessToken, createRefreshToken } = require('../utils/auth');
const rateLimit = require('express-rate-limit');

// --- Rate Limiters ---
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 requests per windowMs
    message: { error: 'Too many authentication attempts, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// --- Sanitization ---
const sanitizeInput = (req, res, next) => {
    if (req.body) {
        if (typeof req.body.email !== 'undefined' && typeof req.body.email !== 'string') {
            req.body.email = String(req.body.email);
        }
        if (typeof req.body.refreshToken !== 'undefined' && typeof req.body.refreshToken !== 'string') {
            req.body.refreshToken = String(req.body.refreshToken);
        }
    }
    next();
};

// POST /auth/register
router.post('/register', authLimiter, sanitizeInput, async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Check exists
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ error: 'User already exists' });
        }

        const hashed = await hashPassword(password);
        const newUser = await User.create({
            email,
            password_hash: hashed,
            role: 'user',
            is_verified: false
        });

        res.status(201).json({ message: 'User created successfully', userId: newUser._id });
    } catch (err) {
        console.error("Register Error:", err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /auth/login
router.post('/login', authLimiter, sanitizeInput, async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user || !(await verifyPassword(password, user.password_hash))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Create Tokens
        const accessToken = createAccessToken({
            userId: user._id,
            id: user._id,
            email: user.email,
            role: user.role, // Assuming these fields exist in schema
            is_verified: user.is_verified
        });
        const refreshToken = createRefreshToken();

        // Store Session
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        await Session.create({
            user_id: user._id,
            refresh_token: refreshToken,
            expires_at: expiresAt
        });

        // We return tokens in body so the Frontend (Next.js) server-side route 
        // can set them into HTTP-only cookies on the actual client response.
        // Or if this was purely client-side React calling Express, we'd set cookies here.
        // For now, returning JSON allows flexibility.

        res.status(200).json({
            user: { id: user._id, email: user.email, role: user.role },
            accessToken,
            refreshToken
        });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /auth/logout
router.post('/logout', sanitizeInput, async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (refreshToken) {
            await Session.deleteOne({ refresh_token: refreshToken });
        }
        res.status(200).json({ message: 'Logged out' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
