// Simple script to regenerate tokens for all users
import regenerateTokensForAllUsers from './src/utils/tokenGenerator.js';


regenerateTokensForAllUsers()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('Token regeneration failed:', error);
    process.exit(1);
  }); 