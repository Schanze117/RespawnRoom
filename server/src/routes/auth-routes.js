import { Router } from 'express';
import { User } from '../models/users.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

import dotenv from 'dotenv';
dotenv.config();

export const login = async (req, res) => {
    const { userName, password } = req.body;
    const user = await User.findOne({
        where: { userName },
    });
    if (!user) {
        return res.status(401).json({ message: 'Authentication failed' });
    }
    const passwordIsValid = await bcrypt.compare(password, user.password);
    if (!passwordIsValid) {
        return res.status(401).json({ message: 'Authentication failed' });
    }
    const secretKey = process.env.JWT_SECRET_KEY || '';
    const token = jwt.sign({ userName }, secretKey, { expiresIn: '1h' });
    return res.json({ token });
};
const router = Router();

// POST /login - Login a user
router.post('/login', login);
export default router;