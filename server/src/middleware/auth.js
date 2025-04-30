import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

// Get the JWT secret key from environment variables
const JWT_SECRET = process.env.JWT_SECRET_KEY || 'fallbacksecretkey';

/**
 * Authenticates the user by verifying their JWT token
 * @param {object} req - The request object
 * @returns {object|null} - The decoded user data or null if authentication fails
 */
export function authenticateToken(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.split(' ')[1];
  
  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.error('Invalid token:', err);
    return null;
  }
}

/**
 * Signs a new JWT token for a user
 * @param {string} userName - The user's username
 * @param {string} email - The user's email
 * @param {string} _id - The user's ID
 * @returns {string} - A signed JWT token
 */
export const signToken = (userName, email, _id) => {
  const payload = { userName, email, _id };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};
