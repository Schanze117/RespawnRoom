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
  // Look for token in headers
  const authHeader = req.headers.authorization || '';
  let token = '';
  
  // Extract token from Authorization header if it exists
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }
  
  // If no token found, return null (unauthenticated)
  if (!token) {
    return null;
  }

  try {
    // Verify the token and return the decoded user data
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (err) {
    console.error('Invalid token:', err.message);
    // Return null if token verification fails
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
  // Create the payload with user data
  const payload = { userName, email, _id };
  
  // Sign the token with an expiration time of 7 days
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};
