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
    console.log('Starting token regeneration for all users...');
    
    // Find all users who have saved games
    const users = await User.find({ 'savedGames.0': { $exists: true } });
    console.log(`Found ${users.length} users with saved games`);
    
    let totalTokensGenerated = 0;
    
    // Process each user
    for (const user of users) {
      console.log(`\nProcessing user: ${user.userName} (${user._id})`);
      console.log(`User has ${user.savedGames.length} saved games`);
      
      // Clear existing tokens
      user.categoryTokens = new Map();
      console.log('Cleared existing tokens');
      
      // Generate new tokens for each saved game
      for (const game of user.savedGames) {
        console.log(`Processing game: ${game.name}`);
        
        try {
          // Extract categories from the game
          let categories = [];
          
          // Add genres if they exist
          if (game.genres && Array.isArray(game.genres)) {
            const genreNames = game.genres.filter(Boolean);
            categories = categories.concat(genreNames);
            console.log(`Found ${genreNames.length} genres`);
          }
          
          // Add player perspectives if they exist
          if (game.playerPerspectives && Array.isArray(game.playerPerspectives)) {
            const perspectiveNames = game.playerPerspectives.filter(Boolean);
            categories = categories.concat(perspectiveNames);
            console.log(`Found ${perspectiveNames.length} perspectives`);
          }
          
          // Update token counts
          categories.forEach(category => {
            if (category) {
              const currentCount = user.categoryTokens.get(category) || 0;
              user.categoryTokens.set(category, currentCount + 1);
              totalTokensGenerated++;
            }
          });
          
          console.log(`Updated tokens for ${categories.length} categories`);
        } catch (gameError) {
          console.error(`Error processing game ${game.name}:`, gameError);
        }
      }
      
      // Display generated tokens
      console.log('Generated tokens:');
      user.categoryTokens.forEach((value, key) => {
        console.log(`  ${key}: ${value}`);
      });
      
      // Save the user with new tokens
      await user.save();
      console.log('Saved user with updated tokens');
    }
    
    console.log(`\nToken regeneration complete. Generated ${totalTokensGenerated} tokens across ${users.length} users.`);
  } catch (error) {
    console.error('Error regenerating tokens:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the token regeneration if this file is executed directly
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
  regenerateTokensForAllUsers()
    .then(() => {
      console.log('Token regeneration script completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Token regeneration script failed:', error);
      process.exit(1);
    });
}

// Export for use in other files
export default regenerateTokensForAllUsers; 