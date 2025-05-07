import User from '../models/users.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { signToken } from '../middleware/auth.js';

dotenv.config();

/**
 * Handle Google OAuth user creation or login
 * This controller is responsible for processing Google authentication data
 * and either creating a new user or logging in an existing one
 */
export const handleGoogleAuth = async (profile) => {
  try {
    // Always treat googleId as a string to avoid type errors
    let user = await User.findOne({ googleId: profile.id.toString() });
    
    if (!user) {
      // If no user with this Google ID exists, check if there's a user with the same email
      if (profile.emails && profile.emails.length > 0) {
        const email = profile.emails[0].value;
        user = await User.findOne({ email });
        
        if (user) {
          // If a user with this email exists but doesn't have a Google ID, update their record
          user.googleId = profile.id.toString();
          await user.save();
        } else {
          // Check if username already exists
          const displayName = profile.displayName || `user_${profile.id.substring(0, 8)}`;
          const existingUserName = await User.findOne({ userName: displayName });
          
          // If username exists, add a random suffix
          const finalUserName = existingUserName 
            ? `${displayName}_${Math.floor(Math.random() * 10000)}`
            : displayName;
            
          // Create a new user with Google profile data
          user = await User.create({
            userName: finalUserName,
            email: profile.emails[0].value,
            googleId: profile.id.toString(),
            // No password needed for Google auth
          });
        }
      } else {
        // No email in Google profile
        throw new Error('Google account does not provide an email address.');
      }
    }
    
    // If user is still null, something went wrong
    if (!user) {
      throw new Error('Failed to create or find user from Google profile.');
    }
    
    // Generate JWT token using the signToken function from auth.js for consistency
    const token = signToken(user.userName, user.email, user._id);
    
    return { user, token };
  } catch (error) {
    console.error('Error in Google authentication:', error);
    throw error;
  }
};