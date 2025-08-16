import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import gameRoutes from './api/gameRoutes.js';
import userRoutes from './api/userRoutes.js';
import pubnubRoutes from './api/pubnub.js';

import apiRoutes from './api/index.js';

// Create router
const router = express.Router();

// Add route logging middleware for all routes
router.use((req, res, next) => {
  console.log("ROUTE HANDLER ENTER:", req.method, req.path, {
    params: req.params,
    query: req.query,
  });
  
  // Capture response to log on exit
  const originalEnd = res.end;
  res.end = function() {
    console.log("ROUTE HANDLER EXIT:", req.method, req.path, {
      statusCode: res.statusCode,
      statusMessage: res.statusMessage
    });
    return originalEnd.apply(res, arguments);
  };
  
  next();
});

// API routes
router.use('/api/games', gameRoutes);
router.use('/api/user', userRoutes);
router.use('/api/pubnub', pubnubRoutes);

router.use('/api', apiRoutes);

try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  
} catch (error) {
}

export default router;