import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import gameRoutes from './api/gameRoutes.js';
import userRoutes from './api/userRoutes.js';
import pubnubRoutes from './api/pubnub.js';
import googleAuthRoutes from './api/googleAuthRoutes.js';

// Create router
const router = express.Router();

// API routes
router.use('/api/games', gameRoutes);
router.use('/api/user', userRoutes);
router.use('/api/pubnub', pubnubRoutes);
router.use('/auth/google', googleAuthRoutes);

try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  
} catch (error) {
}

export default router; 