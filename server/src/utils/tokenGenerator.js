import User from '../models/users.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import '../config/connection.js';

// Setup __dirname for ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Configure dotenv to load from root directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

/**
 * Regenerates category tokens for all users with saved games
 */
async function regenerateTokensForAllUsers() {
  try {
    // Find all users who have saved games
    const users = await User.find({ 'savedGames.0': { $exists: true } });
    
    let totalTokensGenerated = 0;
    
    // Process each user
    for (const user of users) {
      // Clear existing tokens
      user.categoryTokens = new Map();
      
      // Generate new tokens for each saved game
      for (const game of user.savedGames) {
        try {
          // Extract categories from the game
          let categories = [];
          
          // Add genres if they exist
          if (game.genres && Array.isArray(game.genres)) {
            const genreNames = game.genres.filter(Boolean);
            categories = categories.concat(genreNames);
          }
          
          // Add player perspectives if they exist
          if (game.playerPerspectives && Array.isArray(game.playerPerspectives)) {
            const perspectiveNames = game.playerPerspectives.filter(Boolean);
            categories = categories.concat(perspectiveNames);
          }
          
          // Update token counts
          categories.forEach(category => {
            if (category) {
              const currentCount = user.categoryTokens.get(category) || 0;
              user.categoryTokens.set(category, currentCount + 1);
              totalTokensGenerated++;
            }
          });
        } catch (gameError) {
          // Error processing game
        }
      }
      
      // Save the user with new tokens
      await user.save();
    }
  } catch (error) {
    // Error regenerating tokens
  } finally {
    // Close database connection
    await mongoose.connection.close();
  }
}

// Run the token regeneration if this file is executed directly
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
  regenerateTokensForAllUsers()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      process.exit(1);
    });
}

// Export for use in other files
export default regenerateTokensForAllUsers; 