import User from '../models/users.js';

export const seedVideoGames = async () => {
  try {
    // Get user IDs from the database for associations
    const users = await User.find({});
    const userIds = users.map(user => user._id);
    
    if (userIds.length === 0) {
      return;
    }
    
    // Clear any existing savedGames array from users
    await User.updateMany({}, { $set: { savedGames: [] } });
    
    // Sample video game data
    const sampleGames = [];
    
    // Add games to users if there are any sample games
    if (sampleGames.length > 0) {
      for (let i = 0; i < users.length; i++) {
        // Assign 1-3 random games to each user
        const numGames = Math.floor(Math.random() * 3) + 1;
        const userGames = [];
        
        for (let j = 0; j < numGames; j++) {
          // Pick a random game
          const randomIndex = Math.floor(Math.random() * sampleGames.length);
          const game = { ...sampleGames[randomIndex], userId: userIds[i] };
          userGames.push(game);
        }
        
        // Update the user with the games
        await User.findByIdAndUpdate(
          userIds[i],
          { $push: { savedGames: { $each: userGames } } },
          { new: true }
        );
      }
    }
  } catch (err) {
  }
};