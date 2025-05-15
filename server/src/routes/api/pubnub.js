import express from 'express';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Configuration for PubNub
const PUBNUB_SUBSCRIBE_KEY = process.env.PUBNUB_SUBSCRIBE_KEY;
const PUBNUB_PUBLISH_KEY = process.env.PUBNUB_PUBLISH_KEY;

// Get PubNub configuration
router.get('/config', (req, res) => {
  try {
    // Return the PubNub configuration to the client
    return res.json({
      success: true,
      subscribeKey: PUBNUB_SUBSCRIBE_KEY,
      publishKey: PUBNUB_PUBLISH_KEY
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to get PubNub configuration' });
  }
});

// This endpoint could be used in the future for user authorization
// Currently, PubNub is being used without additional authorization since
// the keys themselves provide the access
router.get('/user-info', async (req, res) => {
  const { userId } = req.query;
  
  // Check if required parameters are provided
  if (!userId) {
    return res.status(400).json({ success: false, message: 'User ID is required' });
  }
  
  try {
    // Generate a request identifier for tracking
    const requestId = randomUUID();
    
    return res.json({
      success: true,
      userId,
      requestId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to process request' });
  }
});

export default router; 