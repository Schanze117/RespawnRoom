import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import User from '../../models/users.js';

const router = Router();

// GET /api/user/tokens
// Get user category tokens
router.get('/tokens', authenticateToken, async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const userId = req.user._id;
    
    // Find the user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Apply token decay if needed
    await user.decayTokens();
    
    // Check if user has any saved games but no tokens
    if (user.savedGames && user.savedGames.length > 0 && (!user.categoryTokens || user.categoryTokens.size === 0)) {
      // Generate tokens from saved games
      for (const game of user.savedGames) {
        await user.updateCategoryTokens(game);
      }
      
      // Save the user
      await user.save();
    }
    
    // Convert Map to Object for response
    const categoryTokens = {
      _source: 'server' // Add marker to indicate these are from the server
    };
    
    user.categoryTokens.forEach((value, key) => {
      categoryTokens[key] = value;
    });
    
    return res.json({ categoryTokens });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/user/tokens
// Update user category tokens
router.put('/tokens', authenticateToken, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const userId = req.user._id;
    const { categoryTokens } = req.body;
    
    if (!categoryTokens || typeof categoryTokens !== 'object') {
      return res.status(400).json({ message: 'Invalid category tokens' });
    }
    
    // Find the user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update category tokens
    Object.entries(categoryTokens).forEach(([category, value]) => {
      user.categoryTokens.set(category, value);
    });
    
    // Save the updated user
    await user.save();
    
    return res.json({ message: 'Category tokens updated successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router; 