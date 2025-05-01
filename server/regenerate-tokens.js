// Simple script to regenerate tokens for all users
import regenerateTokensForAllUsers from './src/utils/tokenGenerator.js';

console.log('Starting token regeneration process...');

regenerateTokensForAllUsers()
  .then(() => {
    console.log('Token regeneration completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Token regeneration failed:', error);
    process.exit(1);
  }); 