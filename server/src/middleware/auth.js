import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
console.log("auth")

    const authHeader = req.headers.authorization;
    console.log('authHeader:', req.headers);
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        const secretKey = process.env.JWT_SECRET_KEY || '';
        jwt.verify(token, secretKey, (err, user) => {
            if (err) {
                return res.sendStatus(403); // Forbidden
            }
            req.user = user;
            return next();
        });
    }
    else {
        res.sendStatus(401); // Unauthorized
    }
};
