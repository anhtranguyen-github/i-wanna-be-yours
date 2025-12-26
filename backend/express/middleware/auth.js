
const { verifyAccessToken } = require('../utils/auth');

/**
 * Middleware to verify JWT token
 */
const verifyJWT = (req, res, next) => {
    let token = null;

    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }

    // Check cookies if token not in header
    if (!token && req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
    }

    if (!token) {
        return res.status(401).json({
            code: 'UNAUTHORIZED',
            error: 'Authentication token is missing'
        });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
        return res.status(401).json({
            code: 'TOKEN_INVALID',
            error: 'Invalid or expired token'
        });
    }

    req.user = payload;
    next();
};

/**
 * Middleware to check user roles
 * @param {string[]} roles - Array of allowed roles 
 */
const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                code: 'UNAUTHORIZED',
                error: 'Authentication required'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                code: 'FORBIDDEN',
                error: 'You do not have permission to access this resource'
            });
        }

        next();
    };
};

module.exports = {
    verifyJWT,
    checkRole
};
