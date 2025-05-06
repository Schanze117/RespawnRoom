import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import User from '../../models/users.js';

const router = Router();

// GET /api/user/tokens
// Get user category tokens
router.get('/tokens', authenticateToken, async (req, res) => {
  try {
    console.log('Token retrieval request received');
    
    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      console.error('Token endpoint: No authenticated user found');
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const userId = req.user._id;
    console.log(`Retrieving tokens for user: ${userId}`);
    
    // Find the user
    const user = await User.findById(userId);
    
    if (!user) {
      console.error(`Token endpoint: User not found with ID: ${userId}`);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log(`Found user: ${user.userName}`);
    
    // Apply token decay if needed
    await user.decayTokens();
    
    // Check if user has any saved games but no tokens
    if (user.savedGames && user.savedGames.length > 0 && (!user.categoryTokens || user.categoryTokens.size === 0)) {
      console.log(`User has ${user.savedGames.length} saved games but no tokens, generating tokens now`);
      
      // Generate tokens from saved games
      for (const game of user.savedGames) {
        await user.updateCategoryTokens(game);
      }
      
      // Save the user
      await user.save();
      console.log('Generated and saved tokens from existing games');
    }
    
    // Convert Map to Object for response
    const categoryTokens = {
      _source: 'server' // Add marker to indicate these are from the server
    };
    
    user.categoryTokens.forEach((value, key) => {
      categoryTokens[key] = value;
    });
    
    console.log(`Returning ${Object.keys(categoryTokens).length - 1} category tokens`); // -1 for _source
    if (Object.keys(categoryTokens).length > 1) { // > 1 because of _source
      console.log('Token sample:', Object.keys(categoryTokens).filter(k => k !== '_source').slice(0, 3));
    }
    
    return res.json({ categoryTokens });
  } catch (error) {
    console.error('Error fetching user tokens:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/user/tokens
// Update user category tokens
router.put('/tokens', authenticateToken, async (req, res) => {
  try {
    console.log('Token update request received');
    
    if (!req.user || !req.user._id) {
      console.error('Token update endpoint: No authenticated user found');
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const userId = req.user._id;
    const { categoryTokens } = req.body;
    
    if (!categoryTokens || typeof categoryTokens !== 'object') {
      console.error('Invalid category tokens format:', categoryTokens);
      return res.status(400).json({ message: 'Invalid category tokens' });
    }
    
    console.log(`Updating tokens for user: ${userId}`);
    console.log(`Received ${Object.keys(categoryTokens).length} category tokens`);
    
    // Find the user
    const user = await User.findById(userId);
    
    if (!user) {
      console.error(`Token update endpoint: User not found with ID: ${userId}`);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log(`Found user: ${user.userName}`);
    
    // Update category tokens
    Object.entries(categoryTokens).forEach(([category, value]) => {
      user.categoryTokens.set(category, value);
    });
    
    // Save the updated user
    await user.save();
    console.log('Successfully updated and saved user tokens');
    
    return res.json({ message: 'Category tokens updated successfully' });
  } catch (error) {
    console.error('Error updating user tokens:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router; 