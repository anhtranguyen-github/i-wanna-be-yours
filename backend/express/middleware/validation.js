
const { z } = require('zod');

/**
 * Generic validation middleware
 * @param {z.ZodSchema} schema - Zod schema to validate against
 */
const validateRequest = (schema) => (req, res, next) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({
                code: 'VALIDATION_ERROR',
                error: 'Invalid request data',
                details: err.errors.map(e => ({
                    path: e.path,
                    message: e.message
                }))
            });
        }
        next(err);
    }
};

/**
 * Common Schemas
 */
const authSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email format'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
    })
});

const logoutSchema = z.object({
    body: z.object({
        refreshToken: z.string().optional(),
    })
});

module.exports = {
    validateRequest,
    authSchema,
    logoutSchema
};
