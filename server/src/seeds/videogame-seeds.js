import User from '../models/users.js';

export const seedVideoGames = async () => {
  try {
    // Get user IDs from the database for associations
    const users = await User.find({});
    const userIds = users.map(user => user._id);
    
    if (userIds.length === 0) {
      console.log('No users found to associate with video games.');
      return;
    }
    
    // Clear any existing savedGames array from users
    await User.updateMany({}, { $set: { savedGames: [] } });
    
    // Sample video game data
    const sampleGames = [
      {
        cover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1wyy.jpg',
        name: 'The Witcher 3: Wild Hunt',
        genres: ['RPG', 'Adventure'],
        playerPerspectives: ['Third person'],
        summary: 'The Witcher 3: Wild Hunt is an action role-playing game set in an open world environment.'
      },
      {
        cover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1r7h.jpg',
        name: 'Red Dead Redemption 2',
        genres: ['Action', 'Adventure'],
        playerPerspectives: ['First person', 'Third person'],
        summary: 'Red Dead Redemption 2 is a western action-adventure game set in an open world environment.'
      },
      {
        cover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1rgi.jpg',
        name: 'God of War',
        genres: ['Action', 'Adventure'],
        playerPerspectives: ['Third person'],
        summary: 'God of War is an action-adventure game developed by Santa Monica Studio.'
      }
    ];
    
    // Add games to random users
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
    
    console.log('Video games have been seeded successfully.');
  } catch (err) {
    console.error('Error seeding video games:', err);
  }
};