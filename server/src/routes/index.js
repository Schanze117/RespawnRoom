import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Create router
const router = express.Router();

// If there are API route files, they would be imported here
// For example:
// import apiRoutes from './api/index.js';
// router.use('/api', apiRoutes);

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