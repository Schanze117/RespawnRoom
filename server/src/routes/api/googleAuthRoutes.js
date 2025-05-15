import express from 'express';
import { handleGoogleAuth } from '../../controllers/googleAuthController.js';

const router = express.Router();

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