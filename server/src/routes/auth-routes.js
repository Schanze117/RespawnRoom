import { Router } from 'express';
import { User } from '../models/users.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

import dotenv from 'dotenv';
dotenv.config();

export const login = async (req, res) => {
    try {
        const { userName, password } = req.body;
        const user = await User.findOne({
            where: { userName },
        });
        if (!user) {
            return res.status(401).json({ message: 'Authentication failed' });
        }
        
        // Check if this is a Google-authenticated user without a password
        if (!user.password && user.googleId) {
            return res.status(401).json({ message: 'Please use Google login for this account' });
        }
        
        const passwordIsValid = await bcrypt.compare(password, user.password);
        if (!passwordIsValid) {
            return res.status(401).json({ message: 'Authentication failed' });
        }
        
        const secretKey = process.env.JWT_SECRET_KEY || '';
        const token = jwt.sign({ 
            id: user.id,
            userName: user.userName,
            email: user.email,
            googleId: user.googleId 
        }, secretKey, { expiresIn: '7d' });
        
        return res.json({ token });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Server error during authentication' });
    }
};
// Register a new user
export const register = async (req, res) => {
    try {
        const { userName, email, password } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({
            where: { 
                userName 
            }
        });
        
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }
        
        // Check if email is already registered
        if (email) {
            const emailUser = await User.findOne({
                where: { email }
            });
            
            if (emailUser) {
                return res.status(400).json({ message: 'Email already registered' });
            }
        }
        
        // Create new user
        const newUser = await User.create({
            userName,
            email,
            password
        });
        
        // Generate JWT token
        const secretKey = process.env.JWT_SECRET_KEY || '';
        const token = jwt.sign({ 
            id: newUser.id,
            userName: newUser.userName,
            email: newUser.email
        }, secretKey, { expiresIn: '7d' });
        
        return res.status(201).json({ token });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ message: 'Server error during registration' });
    }
};

const router = Router();

// POST /login - Login a user
router.post('/login', login);

// POST /register - Register a new user
router.post('/register', register);

export default router;