import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'krishvya_super_secure_jwt_secret_key_2026';
export function authMiddleware(req, res, next) {
    const clerkUserId = (req.headers['x-clerk-user-id'] || req.headers['x-farmer-id'] || req.headers['x-user-id']);
    if (clerkUserId) {
        req.user = {
            id: clerkUserId,
            phone: req.headers['x-user-phone'] || '',
            role: req.headers['x-user-role'] || 'FARMER',
            name: req.headers['x-user-name'] || 'Farmer',
        };
        return next();
    }
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            success: false,
            message: 'Authentication token is missing or invalid.',
        });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        res.status(401).json({
            success: false,
            message: 'Token has expired or is invalid. Please sign in again.',
        });
    }
}
export function optionalAuthMiddleware(req, _res, next) {
    const clerkUserId = (req.headers['x-clerk-user-id'] || req.headers['x-farmer-id'] || req.headers['x-user-id']);
    if (clerkUserId) {
        req.user = {
            id: clerkUserId,
            phone: req.headers['x-user-phone'] || '',
            role: req.headers['x-user-role'] || 'FARMER',
            name: req.headers['x-user-name'] || 'Farmer',
        };
        return next();
    }
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
        }
        catch {
            // Ignore token validation failure in optional middleware
        }
    }
    next();
}
