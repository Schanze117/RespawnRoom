import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import gameRoutes from './api/gameRoutes.js';
import userRoutes from './api/userRoutes.js';
import agoraRoutes from './api/agora.js';

// Create router
const router = express.Router();

// API routes
router.use('/api/games', gameRoutes);
router.use('/api/user', userRoutes);
router.use('/api/agora', agoraRoutes);

// Check if api directory has files
try {
  // This is a placeholder for future API routes
  // You can add more route imports as your application grows
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  
  // Log for debugging
  console.log('Routes initialized successfully');
} catch (error) {
  console.error('Error setting up routes:', error);
}

export default router; 