import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'krishvya_super_secure_jwt_secret_key_2026';
export function authMiddleware(req, res, next) {
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
