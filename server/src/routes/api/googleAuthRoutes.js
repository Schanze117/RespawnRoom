import express from 'express';
import { handleGoogleAuth } from '../../controllers/googleAuthController.js';

const router = express.Router();

// Test endpoint to verify the route is working
router.get('/test', (req, res) => {
  console.log('🔍 GOOGLE AUTH DEBUG: Test endpoint called');
  res.json({ 
    message: 'Google OAuth route is working!',
    timestamp: new Date().toISOString(),
    environment: {
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CALLBACK_URL: !!process.env.GOOGLE_CALLBACK_URL
    }
  });
});

// Google OAuth initiation endpoint
router.get('/', (req, res) => {
  try {
    console.log('🔍 GOOGLE AUTH DEBUG: OAuth initiation requested');
    console.log('🔍 GOOGLE AUTH DEBUG: Request headers:', req.headers);
    console.log('🔍 GOOGLE AUTH DEBUG: Request origin:', req.headers.origin);
    console.log('🔍 GOOGLE AUTH DEBUG: Request user-agent:', req.headers['user-agent']);
    
    // Check if required environment variables are available
    console.log('🔍 GOOGLE AUTH DEBUG: GOOGLE_CLIENT_ID available:', !!process.env.GOOGLE_CLIENT_ID);
    console.log('🔍 GOOGLE AUTH DEBUG: GOOGLE_CALLBACK_URL available:', !!process.env.GOOGLE_CALLBACK_URL);
    
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CALLBACK_URL) {
      console.error('🔍 GOOGLE AUTH ERROR: Missing required environment variables');
      return res.status(500).json({ 
        message: 'Google OAuth not configured properly',
        error: 'Missing environment variables'
      });
    }
    
    // Redirect to Google OAuth
    const googleAuthUrl = `https://accounts.google.com/oauth/authorize?` +
      `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${process.env.GOOGLE_CALLBACK_URL}&` +
      `scope=email profile&` +
      `response_type=code&` +
      `access_type=offline`;
    
    console.log('🔍 GOOGLE AUTH DEBUG: Generated Google OAuth URL:', googleAuthUrl);
    console.log('🔍 GOOGLE AUTH DEBUG: Redirecting to Google OAuth URL');
    
    // Set proper headers for redirect
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    // Use 302 redirect with proper formatting
    res.redirect(302, googleAuthUrl);
  } catch (error) {
    console.error('🔍 GOOGLE AUTH ERROR:', error);
    res.status(500).json({ message: 'Failed to initiate Google OAuth', error: error.message });
  }
});

// Google OAuth callback endpoint
router.get('/callback', async (req, res) => {
  try {
    console.log('🔍 GOOGLE AUTH DEBUG: Callback received with code:', req.query.code ? 'YES' : 'NO');
    
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ message: 'Authorization code is required' });
    }
    
    // Exchange code for tokens and get user profile
    const { user, token } = await handleGoogleAuth({ code });
    
    console.log('🔍 GOOGLE AUTH DEBUG: Authentication successful for user:', user.userName);
    
    // Redirect to client with token
    const redirectUrl = `${process.env.CLIENT_URL}/login?token=${token}`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('🔍 GOOGLE AUTH ERROR:', error);
    res.status(500).json({ message: 'Authentication failed', error: error.message });
  }
});

// Legacy POST endpoint for backward compatibility
router.post('/callback', async (req, res) => {
  try {
    const { profile } = req.body;
    
    if (!profile) {
      return res.status(400).json({ message: 'Google profile data is required' });
    }
    
    const { user, token } = await handleGoogleAuth(profile);
    
    res.status(200).json({
      message: 'Google authentication successful',
      token,
      user: {
        id: user._id,
        userName: user.userName,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Authentication failed', error: error.message });
  }
});

export default router; 