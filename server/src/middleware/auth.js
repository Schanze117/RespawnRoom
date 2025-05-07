import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

// Get the JWT secret key from environment variables
const JWT_SECRET = process.env.JWT_SECRET_KEY || 'fallbacksecretkey';

/**
 * Authenticates the user by verifying their JWT token for Express middleware use
 * @param {object} req - The request object
 * @param {object} res - The response object
 * @param {function} next - The next middleware function
 */
export function authenticateToken(req, res, next) {
  try {
    // Get the user from token
    const user = getUserFromToken(req);
    
    // If no user found, return unauthorized
    if (!user) {
      console.warn('No valid token found in request');
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Set user on request object
    req.user = user;
    
    // Continue to next middleware
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

/**
 * Utility function to extract user from token (for Apollo context or non-middleware use)
 * @param {object} req - The request object
 * @returns {object|null} - The decoded user data or null if authentication fails
 */
export function getUserFromToken(req) {
  // Look for token in headers
  const authHeader = req.headers.authorization || '';
  let token = '';
  
  // Extract token from Authorization header if it exists
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }
  
  // If no token found, return null
  if (!token) {
    return null;
  }

  try {
    // Verify the token and return the decoded user data
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (err) {
    console.error('Invalid token:', err.message);
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
