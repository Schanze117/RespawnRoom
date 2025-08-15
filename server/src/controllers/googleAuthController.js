import User from '../models/users.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { signToken } from '../middleware/auth.js';
import fetch from 'node-fetch';

dotenv.config();

/**
 * Exchange authorization code for Google access token
 */
const exchangeCodeForToken = async (code) => {
  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Failed to exchange code for token: ${tokenResponse.statusText}`);
    }

    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
  } catch (error) {
    console.error('🔍 GOOGLE AUTH ERROR: Token exchange failed:', error);
    throw error;
  }
};

/**
 * Get user profile from Google using access token
 */
const getGoogleProfile = async (accessToken) => {
  try {
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!profileResponse.ok) {
      throw new Error(`Failed to get profile: ${profileResponse.statusText}`);
    }

    const profile = await profileResponse.json();
    return profile;
  } catch (error) {
    console.error('🔍 GOOGLE AUTH ERROR: Profile fetch failed:', error);
    throw error;
  }
};

/**
 * Handle Google OAuth user creation or login
 * This controller is responsible for processing Google authentication data
 * and either creating a new user or logging in an existing one
 */
export const handleGoogleAuth = async (profileOrCode) => {
  try {
    let profile;
    
    // Check if we received a code (new flow) or profile (legacy flow)
    if (profileOrCode.code) {
      console.log('🔍 GOOGLE AUTH DEBUG: Processing authorization code flow');
      
      // Exchange code for access token
      const accessToken = await exchangeCodeForToken(profileOrCode.code);
      console.log('🔍 GOOGLE AUTH DEBUG: Access token obtained');
      
      // Get user profile from Google
      profile = await getGoogleProfile(accessToken);
      console.log('🔍 GOOGLE AUTH DEBUG: Profile obtained:', { id: profile.id, email: profile.email });
    } else {
      // Legacy flow - profile data passed directly
      console.log('🔍 GOOGLE AUTH DEBUG: Processing legacy profile flow');
      profile = profileOrCode;
    }

    // Always treat googleId as a string to avoid type errors
    let user = await User.findOne({ googleId: profile.id.toString() });
    
    if (!user) {
      // If no user with this Google ID exists, check if there's a user with the same email
      if (profile.email) {
        user = await User.findOne({ email: profile.email });
        
        if (user) {
          // If a user with this email exists but doesn't have a Google ID, update their record
          user.googleId = profile.id.toString();
          await user.save();
          console.log('🔍 GOOGLE AUTH DEBUG: Updated existing user with Google ID');
        } else {
          // Check if username already exists
          const displayName = profile.name || `user_${profile.id.substring(0, 8)}`;
          const existingUserName = await User.findOne({ userName: displayName });
          
          // If username exists, add a random suffix
          const finalUserName = existingUserName 
            ? `${displayName}_${Math.floor(Math.random() * 10000)}`
            : displayName;
            
          // Create a new user with Google profile data
          user = await User.create({
            userName: finalUserName,
            email: profile.email,
            googleId: profile.id.toString(),
            // No password needed for Google auth
          });
          console.log('🔍 GOOGLE AUTH DEBUG: Created new user:', finalUserName);
        }
      } else {
        // No email in Google profile
        throw new Error('Google account does not provide an email address.');
      }
    } else {
      console.log('🔍 GOOGLE AUTH DEBUG: Found existing user with Google ID');
    }
    
    // If user is still null, something went wrong
    if (!user) {
      throw new Error('Failed to create or find user from Google profile.');
    }
    
    // Generate JWT token using the signToken function from auth.js for consistency
    const token = signToken(user.userName, user.email, user._id);
    console.log('🔍 GOOGLE AUTH DEBUG: JWT token generated for user:', user.userName);
    
    return { user, token };
  } catch (error) {
    console.error('🔍 GOOGLE AUTH ERROR: handleGoogleAuth failed:', error);
    throw error;
  }
};