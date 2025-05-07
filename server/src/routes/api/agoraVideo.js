import express from 'express';
import pkg from 'agora-access-token';
const { RtcTokenBuilder, RtcRole } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Configuration for Agora Video
const APP_ID = process.env.AGORA_APP_ID;
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

// Generate a token for Agora RTC (voice/video)
router.get('/token', (req, res) => {
  const { channel, uid } = req.query;
  
  // Check if required parameters are provided
  if (!channel) {
    return res.status(400).json({ success: false, message: 'Channel name is required' });
  }
  
  // Check if Agora credentials are configured
  if (!APP_ID || !APP_CERTIFICATE) {
    console.error('Agora credentials missing:', { 
      hasAppId: !!APP_ID, 
      hasAppCertificate: !!APP_CERTIFICATE,
      envKeys: Object.keys(process.env)
    });
    return res.status(500).json({ success: false, message: 'Agora video credentials not configured on server' });
  }
  
  try {
    // Set expiration time (in seconds)
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    
    // Use the provided UID or generate a random one
    const tokenUid = parseInt(uid) || Math.floor(Math.random() * 100000);
    
    // Build the token with RTC publisher privileges
    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channel,
      tokenUid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs
    );
    
    console.log('Token generated successfully:', {
      channel,
      uid: tokenUid,
      hasToken: !!token,
      appIdLength: APP_ID?.length
    });
    
    // Return the token to the client
    return res.json({
      success: true,
      token,
      appId: APP_ID,
      channel,
      uid: tokenUid,
      expiresIn: expirationTimeInSeconds
    });
  } catch (error) {
    console.error('Error generating Agora video token:', error, {
      channel,
      uid,
      appIdPresent: !!APP_ID,
      certificatePresent: !!APP_CERTIFICATE
    });
    return res.status(500).json({ success: false, message: 'Failed to generate token' });
  }
});

export default router; 