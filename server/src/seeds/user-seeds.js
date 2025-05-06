import User from '../models/users.js';

export const seedUsers = async () => {
  try {
    // Delete all existing users to avoid duplicates
    await User.deleteMany({});
    console.log('Existing users have been cleared.');

    // Create 25 seed users with names matching the placeholder data in friends.jsx
    const users = [
      { userName: 'GamerX', email: 'gamerx@example.com', password: 'password123', status: 'Online' },
      { userName: 'NightWolf', email: 'nightwolf@example.com', password: 'password123', status: 'Away' },
      { userName: 'PixelQueen', email: 'pixelqueen@example.com', password: 'password123', status: 'Online' },
      { userName: 'DarkKnight', email: 'darkknight@example.com', password: 'password123', status: 'Offline' },
      { userName: 'CyberPunk2077', email: 'cyberpunk@example.com', password: 'password123', status: 'Online' },
      { userName: 'ShadowBlade', email: 'shadowblade@example.com', password: 'password123', status: 'Online' },
      { userName: 'FrostMage', email: 'frostmage@example.com', password: 'password123', status: 'Online' },
      { userName: 'TitanSlayer', email: 'titanslayer@example.com', password: 'password123', status: 'Away' },
      { userName: 'DragonBorn', email: 'dragonborn@example.com', password: 'password123', status: 'Online' },
      { userName: 'StealthArcher', email: 'stealtharcher@example.com', password: 'password123', status: 'Offline' },
      { userName: 'MechWarrior', email: 'mechwarrior@example.com', password: 'password123', status: 'Online' },
      { userName: 'SpellCaster', email: 'spellcaster@example.com', password: 'password123', status: 'Online' },
      { userName: 'LootHunter', email: 'loothunter@example.com', password: 'password123', status: 'Online' },
      { userName: 'BattleMage', email: 'battlemage@example.com', password: 'password123', status: 'Away' },
      { userName: 'SniperElite', email: 'sniperelite@example.com', password: 'password123', status: 'Online' },
      { userName: 'StrategyMaster', email: 'strategymaster@example.com', password: 'password123', status: 'Online' },
      { userName: 'RPGFanatic', email: 'rpgfanatic@example.com', password: 'password123', status: 'Offline' },
      { userName: 'SpeedRunner', email: 'speedrunner@example.com', password: 'password123', status: 'Online' },
      { userName: 'SandboxPlayer', email: 'sandboxplayer@example.com', password: 'password123', status: 'Online' },
      { userName: 'PuzzleSolver', email: 'puzzlesolver@example.com', password: 'password123', status: 'Away' },
      { userName: 'AdventureTime', email: 'adventuretime@example.com', password: 'password123', status: 'Offline' },
      { userName: 'CraftingGuru', email: 'craftingguru@example.com', password: 'password123', status: 'Online' },
      { userName: 'TacticalOps', email: 'tacticalops@example.com', password: 'password123', status: 'Online' },
      { userName: 'RetroGaming', email: 'retrogaming@example.com', password: 'password123', status: 'Online' },
      { userName: 'SimRacer', email: 'simracer@example.com', password: 'password123', status: 'Online' },
      // Add two more users for friend request demo
      { userName: 'ShadowHunter', email: 'shadowhunter@example.com', password: 'password123', status: 'Online' },
      { userName: 'ElderScroll', email: 'elderscroll@example.com', password: 'password123', status: 'Offline' }
    ];

    // Insert the users
    await User.insertMany(users);
    
    // Record the seeded users' IDs for reference
    const seededUsers = await User.find({});
    console.log(`${seededUsers.length} users have been seeded successfully.`);
    
    // Create a few friend connections between users to demonstrate the feature
    // Get the first user to add some friends
    const user1 = seededUsers[0]; // GamerX
    
    // Add friends to the first user
    user1.friends = [
      seededUsers[1]._id, // NightWolf
      seededUsers[2]._id, // PixelQueen
      seededUsers[3]._id  // DarkKnight
    ];
    
    await user1.save();
    console.log(`Added friends for ${user1.userName}`);
    
    // Add pending friend requests to the first user
    // Find the first user again after saving
    const updatedUser1 = await User.findById(user1._id);
    updatedUser1.friendRequests = [
      seededUsers[25]._id, // ShadowHunter
      seededUsers[26]._id  // ElderScroll
    ];
    
    await updatedUser1.save();
    console.log(`Added friend requests for ${updatedUser1.userName}`);
    
    // Add some search-ready data - make users ready for search demonstration
    // These will be the ones shown when searching in "Find Players" mode
    const searchUsers = [
      { userName: 'DragonSlayer', email: 'dragonslayer@example.com', password: 'password123', status: 'Online' },
      { userName: 'SteamPunk', email: 'steampunk@example.com', password: 'password123', status: 'Offline' },
      { userName: 'RetroGamer', email: 'retrogamer@example.com', password: 'password123', status: 'Online' },
      { userName: 'MMORPGFan', email: 'mmorpgfan@example.com', password: 'password123', status: 'Online' }
    ];
    
    await User.insertMany(searchUsers);
    console.log(`Added ${searchUsers.length} searchable users for player search demonstration`);
  } catch (err) {
    console.error('Error seeding users:', err);
  }
};