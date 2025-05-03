import express from 'express';
import pkg from 'agora-access-token';
const { RtcTokenBuilder, RtcRole } = pkg;
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Configuration for Agora
const APP_ID = process.env.AGORA_APP_ID || '';
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || '';
const CHAT_APP_KEY = process.env.AGORA_CHAT_APP_KEY || '';

// Generate a token for Agora RTC (voice/video)
router.get('/token', (req, res) => {
  const { channel, uid } = req.query;
  
  // Check if required parameters are provided
  if (!channel) {
    return res.status(400).json({ success: false, message: 'Channel name is required' });
  }
  
  // Check if Agora credentials are configured
  if (!APP_ID || !APP_CERTIFICATE) {
    return res.status(500).json({ success: false, message: 'Agora credentials not configured on server' });
  }
  
  try {
    // Set expiration time (in seconds)
    // Default to 3600 seconds (1 hour)
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    
    // Use the provided UID or generate a random one
    const tokenUid = uid || Math.floor(Math.random() * 100000);
    
    // Build the token with RTC publisher privileges
    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channel,
      tokenUid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs
    );
    
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
    console.error('Error generating Agora token:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate token' });
  }
});

// Generate a token for Agora Chat
router.get('/chat-token', async (req, res) => {
  const { userId } = req.query;
  
  // Check if required parameters are provided
  if (!userId) {
    return res.status(400).json({ success: false, message: 'User ID is required' });
  }
  
  // Check if Agora Chat credentials are configured
  if (!CHAT_APP_KEY) {
    return res.status(500).json({ success: false, message: 'Agora Chat credentials not configured on server' });
  }
  
  try {
    // In a real production environment, you would generate a proper token
    // using Agora's server SDK or REST API
    // This is just a placeholder - you would replace this with actual implementation
    const chatToken = `${randomUUID()}_${userId}`;
    
    return res.json({
      success: true,
      chatToken,
      appKey: CHAT_APP_KEY,
      userId,
    });
  } catch (error) {
    console.error('Error generating Agora Chat token:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate chat token' });
  }
});

export default router; 