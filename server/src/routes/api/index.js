import { Router } from 'express';
import { igdbAPI } from '../../config/igdb.js';

const router = Router();

// Proxy IGDB queries. Client sends plain-text IGDB query in { content }
router.post('/games', async (req, res) => {
  try {
    const { content } = req.body || {};
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Missing content body for IGDB query' });
    }

    const response = await igdbAPI.post('', content);

    if (!response || response.status >= 400) {
      return res.status(response?.status || 500).json({
        error: response?.statusText || 'IGDB request failed'
      });
    }

    return res.json(response.data || []);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


