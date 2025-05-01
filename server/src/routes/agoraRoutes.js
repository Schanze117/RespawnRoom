import express from 'express';
import pkg from 'agora-token';
const { RtcTokenBuilder, RtcRole } = pkg;
import dotenv from 'dotenv';

// Load environment variables with simpler path
dotenv.config();

// Hard-coded values as fallback - these will be overridden by environment variables
const APP_ID_FALLBACK = '411338675';
const APP_CERTIFICATE_FALLBACK = 'cdc5bb9fde2e491d95fd6eb5d6a51941';

// For debugging - log to make sure we have the values
console.log("Agora credentials check:");
const APP_ID = process.env.AGORA_APP_ID || APP_ID_FALLBACK;
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || APP_CERTIFICATE_FALLBACK;
console.log("APP_ID:", APP_ID);
console.log("APP_CERTIFICATE:", APP_CERTIFICATE ? `Length: ${APP_CERTIFICATE.length}` : 'MISSING');

const router = express.Router();

/**
 * @route GET /api/agora/token
 * @desc Generate Agora RTC token for voice/video calling
 * @access Public
 */
router.get('/token', (req, res) => {
  try {
    // Get channel name from query parameters
    const { channel } = req.query;
    
    console.log(`Token request received for channel: ${channel}`);
    
    // Ensure channel name is provided
    if (!channel) {
      console.error("Channel name is missing");
      return res.status(400).json({ 
        success: false,
        message: 'Channel name is required'
      });
    }
    
    // Generate a random uid for this user
    const uid = Math.floor(Math.random() * 100000);
    
    // Token will expire in 1 hour
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    
    // Build the token with publisher role
    try {
      // Using the hardcoded fallback if needed
      const token = RtcTokenBuilder.buildTokenWithUid(
        APP_ID,
        APP_CERTIFICATE,
        channel,
        uid,
        RtcRole.PUBLISHER,
        privilegeExpiredTs
      );
      
      if (!token || token.length === 0) {
        throw new Error('Generated token is empty');
      }
      
      console.log(`Token successfully generated for channel: ${channel}, uid: ${uid}`);
      console.log(`Token: ${token.substring(0, 10)}...`);
      
      // Return the token and uid
      return res.status(200).json({
        success: true,
        token,
        uid,
        appId: APP_ID
      });
    } catch (tokenError) {
      console.error("Token generation failed:", tokenError);
      
      // Try again with hardcoded values if environment variables might be the issue
      if (process.env.AGORA_APP_ID && APP_ID !== APP_ID_FALLBACK) {
        console.log("Trying with fallback credentials...");
        
        try {
          const fallbackToken = RtcTokenBuilder.buildTokenWithUid(
            APP_ID_FALLBACK,
            APP_CERTIFICATE_FALLBACK,
            channel,
            uid,
            RtcRole.PUBLISHER,
            privilegeExpiredTs
          );
          
          return res.status(200).json({
            success: true,
            token: fallbackToken,
            uid,
            appId: APP_ID_FALLBACK,
            note: "Used fallback credentials"
          });
        } catch (fallbackError) {
          console.error("Fallback token generation also failed:", fallbackError);
        }
      }
      
      return res.status(500).json({
        success: false,
        message: `Token generation failed: ${tokenError.message}`
      });
    }
  } catch (error) {
    console.error('Error in token endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process token request',
      error: error.message
    });
  }
});

export default router; 