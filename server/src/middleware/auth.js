import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({ message: 'No authentication token provided' }); // Unauthorized
        }
        
        // Extract token from Bearer format
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Invalid token format' });
        }
        
        // Verify token with secret key
        const secretKey = process.env.JWT_SECRET_KEY || '';
        jwt.verify(token, secretKey, (err, user) => {
            if (err) {
                console.error('Token verification error:', err.message);
                return res.status(403).json({ message: 'Invalid or expired token' }); // Forbidden
            }
            
            // Set user data in request object for route handlers to use
            req.user = user;
            return next();
        });
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({ message: 'Server authentication error' });
    }
};
