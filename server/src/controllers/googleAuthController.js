import { User } from '../models/users.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Handle Google OAuth user creation or login
 * This controller is responsible for processing Google authentication data
 * and either creating a new user or logging in an existing one
 */
export const handleGoogleAuth = async (profile) => {
  try {
    // Always treat googleId as a string to avoid Postgres type errors
    let user = await User.findOne({ where: { googleId: profile.id.toString() } });
    
    if (!user) {
      // If no user with this Google ID exists, check if there's a user with the same email
      if (profile.emails && profile.emails.length > 0) {
        const email = profile.emails[0].value;
        user = await User.findOne({ where: { email } });
        
        if (user) {
          // If a user with this email exists but doesn't have a Google ID, update their record
          user.googleId = profile.id.toString();
          await user.save();
        } else {
          // Create a new user with Google profile data
          user = await User.create({
            userName: profile.displayName || `user_${profile.id.substring(0, 8)}`,
            email: profile.emails[0].value,
            googleId: profile.id.toString(),
            // No password needed for Google auth
          });
        }
      } else {
        // No email in Google profile
        console.error('Google profile missing email:', profile);
        throw new Error('Google account does not provide an email address.');
      }
    }
    
    // If user is still null, something went wrong
    if (!user) {
      console.error('Failed to create or find user from Google profile:', profile);
      throw new Error('Failed to create or find user from Google profile.');
    }
    
    // Generate JWT token for the user
    const secretKey = process.env.JWT_SECRET_KEY || '';
    const token = jwt.sign(
      { 
        id: user.id,
        userName: user.userName,
        email: user.email,
        googleId: user.googleId 
      }, 
      secretKey, 
      { expiresIn: '7d' }
    );
    
    return { user, token };
  } catch (error) {
    console.error('Error in Google authentication:', error);
    throw error;
  }
};