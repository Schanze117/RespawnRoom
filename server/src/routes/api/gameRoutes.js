import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import User from '../../models/users.js';
import { igdbAPI } from '../../config/igdb.js';

const router = Router();

// GET /api/games/personalized
// Get personalized game recommendations based on user tokens
router.get('/personalized', authenticateToken, async (req, res) => {
  try {
    console.log('Received request for personalized games');
    
    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      console.error('No authenticated user found in request');
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const userId = req.user._id;
    console.log(`Processing personalized games for user: ${userId}`);
    
    // Find the user
    const user = await User.findById(userId);
    
    if (!user) {
      console.error(`User not found with ID: ${userId}`);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log(`Found user: ${user.userName}`);
    
    // Apply token decay if needed
    await user.decayTokens();
    
    // Get user category tokens and convert to array of entries
    const categoryTokens = [];
    user.categoryTokens.forEach((value, key) => {
      // Only include tokens with a significant value
      if (value >= 0.5) {
        categoryTokens.push({ category: key, value });
      }
    });
    
    console.log(`User has ${categoryTokens.length} significant category tokens`);
    
    if (categoryTokens.length === 0) {
      console.log('No significant tokens found, checking if user has saved games');
      
      // Check if user has saved games but no tokens
      if (user.savedGames && user.savedGames.length > 0) {
        console.log(`User has ${user.savedGames.length} saved games but no tokens, generating tokens now`);
        
        // Generate tokens from saved games
        for (const game of user.savedGames) {
          await user.updateCategoryTokens(game);
        }
        
        // Check tokens again after generation
        const refreshedCategoryTokens = [];
        user.categoryTokens.forEach((value, key) => {
          if (value >= 0.5) {
            refreshedCategoryTokens.push({ category: key, value });
          }
        });
        
        console.log(`Generated ${refreshedCategoryTokens.length} tokens from saved games`);
        
        // If we still have no tokens, return empty array
        if (refreshedCategoryTokens.length === 0) {
          console.log('Still no significant tokens after generation, returning empty array');
          return res.json([]);
        }
        
        // Use the newly generated tokens
        categoryTokens.push(...refreshedCategoryTokens);
      } else {
        console.log('User has no saved games, returning empty array');
        return res.json([]);
      }
    }
    
    // Local fallback mechanism - use these predefined games when IGDB API is unavailable
    const fallbackGames = [
      { 
        id: 1, 
        name: "The Witcher 3", 
        cover: { url: "/placeholder-cover.jpg" },
        genres: [{ name: "RPG" }, { name: "Open World" }, { name: "Adventure" }],
        player_perspectives: [{ name: "Third Person" }],
        summary: "The Witcher 3: Wild Hunt is a story-driven, next-generation open world role-playing game set in a visually stunning fantasy universe full of meaningful choices and impactful consequences."
      },
      { 
        id: 2, 
        name: "God of War", 
        cover: { url: "/placeholder-cover.jpg" },
        genres: [{ name: "Action" }, { name: "Adventure" }],
        player_perspectives: [{ name: "Third Person" }],
        summary: "His vengeance against the Gods of Olympus years behind him, Kratos now lives as a man in the realm of Norse Gods and monsters. It is in this harsh, unforgiving world that he must fight to survive... and teach his son to do the same."
      },
      { 
        id: 3, 
        name: "Hollow Knight", 
        cover: { url: "/placeholder-cover.jpg" },
        genres: [{ name: "Metroidvania" }, { name: "Platformer" }, { name: "Action" }],
        player_perspectives: [{ name: "Side View" }],
        summary: "Forge your own path in Hollow Knight! An epic action adventure through a vast ruined kingdom of insects and heroes. Explore twisting caverns, battle tainted creatures and befriend bizarre bugs."
      },
      { 
        id: 4, 
        name: "Stardew Valley", 
        cover: { url: "/placeholder-cover.jpg" },
        genres: [{ name: "Simulation" }, { name: "RPG" }, { name: "Indie" }],
        player_perspectives: [{ name: "Top-Down" }],
        summary: "You've inherited your grandfather's old farm plot in Stardew Valley. Armed with hand-me-down tools and a few coins, you set out to begin your new life. Can you learn to live off the land and turn these overgrown fields into a thriving home?"
      },
      { 
        id: 5, 
        name: "Doom Eternal", 
        cover: { url: "/placeholder-cover.jpg" },
        genres: [{ name: "FPS" }, { name: "Action" }, { name: "Shooter" }],
        player_perspectives: [{ name: "First Person" }],
        summary: "Hell's armies have invaded Earth. Become the Slayer in an epic single-player campaign to conquer demons across dimensions and stop the final destruction of humanity."
      },
      {
        id: 6,
        name: "Minecraft",
        cover: { url: "/placeholder-cover.jpg" },
        genres: [{ name: "Sandbox" }, { name: "Adventure" }, { name: "Survival" }],
        player_perspectives: [{ name: "First Person" }],
        summary: "Minecraft is a game about placing blocks and going on adventures. Explore randomly generated worlds and build amazing things from the simplest of homes to the grandest of castles."
      },
      {
        id: 7,
        name: "Civilization VI",
        cover: { url: "/placeholder-cover.jpg" },
        genres: [{ name: "Strategy" }, { name: "Turn-based" }, { name: "4X" }],
        player_perspectives: [{ name: "Top-Down" }],
        summary: "Civilization VI offers new ways to interact with your world, expand your empire across the map, advance your culture, and compete against history's greatest leaders to build a civilization that will stand the test of time."
      },
      {
        id: 8,
        name: "Portal 2",
        cover: { url: "/placeholder-cover.jpg" },
        genres: [{ name: "Puzzle" }, { name: "First-Person" }],
        player_perspectives: [{ name: "First Person" }],
        summary: "The highly anticipated sequel to the award-winning Portal features new puzzles, characters, and challenges. Players must use the portal gun to create dimensional doors to traverse through space and solve challenging puzzles."
      },
      {
        id: 9,
        name: "Hades",
        cover: { url: "/placeholder-cover.jpg" },
        genres: [{ name: "Roguelike" }, { name: "Action" }, { name: "Indie" }],
        player_perspectives: [{ name: "Isometric" }],
        summary: "Defy the god of the dead as you hack and slash out of the Underworld in this rogue-like dungeon crawler from the creators of Bastion, Transistor, and Pyre."
      },
      {
        id: 10,
        name: "Red Dead Redemption 2",
        cover: { url: "/placeholder-cover.jpg" },
        genres: [{ name: "Action" }, { name: "Adventure" }, { name: "Open World" }],
        player_perspectives: [{ name: "Third Person" }],
        summary: "America, 1899. The end of the Wild West era has begun. After a robbery goes badly wrong, Arthur Morgan and the Van der Linde gang are forced to flee. With federal agents and the best bounty hunters in the nation massing on their heels, the gang must rob, steal and fight their way across the rugged heartland of America in order to survive."
      }
    ];
    
    // Sort by token weight (highest first)
    categoryTokens.sort((a, b) => b.value - a.value);
    
    // Take top 5 categories
    const topCategories = categoryTokens.slice(0, 5).map(entry => entry.category);
    console.log('Top categories:', topCategories);
    
    // Try to query IGDB first, but handle rate limiting
    try {
      console.log('Attempting to query IGDB API for personalized recommendations');
      
      // Build IGDB query based on top categories
      const categoryQueries = topCategories.map(category => {
        // Check if it's a genre or perspective
        if (['First person', 'Third person', 'Bird view', 'Side view', 'Text', 'Auditory', 'Virtual Reality'].includes(category)) {
          return `player_perspectives.name = "${category}"`;
        } else {
          return `genres.name = "${category}"`;
        }
      });
      
      // Join with OR operator
      const whereClause = categoryQueries.join(' | ');
      console.log('IGDB query where clause:', whereClause);
      
      // Query IGDB for games matching these categories
      const igdbResponse = await igdbAPI.post('', `
        fields name, cover.url, summary, genres.name, player_perspectives.name, rating, rating_count;
        where ${whereClause};
        limit 100;
      `);
      
      if (igdbResponse.data && igdbResponse.data.length > 0) {
        console.log(`Found ${igdbResponse.data.length} matching games from IGDB`);
        
        // Calculate similarity score for each game
        const games = igdbResponse.data.map(game => {
          // Extract game categories
          const gameCategories = [
            ...(game.genres || []).map(genre => genre.name),
            ...(game.player_perspectives || []).map(perspective => perspective.name)
          ];
          
          // Calculate dot product similarity
          let similarityScore = 0;
          gameCategories.forEach(category => {
            const tokenValue = user.categoryTokens.get(category) || 0;
            similarityScore += tokenValue;
          });
          
          return {
            ...game,
            similarityScore
          };
        });
        
        // Sort by similarity score
        const sortedGames = games.sort((a, b) => b.similarityScore - a.similarityScore);
        
        // Take top 20 games
        const topGames = sortedGames.slice(0, 20);
        console.log(`Selected top ${topGames.length} games by similarity score`);
        
        // Apply weighting with exponent alpha = 2
        const alpha = 2;
        const weightedGames = topGames.map(game => {
          const weight = Math.pow(Math.max(game.similarityScore, 0.1), alpha);
          return {
            ...game,
            weight
          };
        });
        
        // Compute total weight
        const totalWeight = weightedGames.reduce((sum, game) => sum + game.weight, 0);
        
        // Sample 8 games based on weights
        const selectedGames = [];
        const selectedGameIds = new Set(); // Track selected game IDs
        const numToSelect = Math.min(8, weightedGames.length);
        
        // Select games based on weighted probability
        for (let i = 0; i < numToSelect; i++) {
          let randomValue = Math.random() * totalWeight;
          let cumulativeWeight = 0;
          
          for (const game of weightedGames) {
            if (selectedGameIds.has(game.id)) continue; // Skip if already selected
            
            cumulativeWeight += game.weight;
            
            if (cumulativeWeight >= randomValue) {
              // Remove weight property before returning
              const { weight, similarityScore, ...gameWithoutWeight } = game;
              selectedGames.push(gameWithoutWeight);
              selectedGameIds.add(game.id); // Add to tracking set
              break;
            }
          }
        }
        
        // If we selected fewer than expected, add more games from the pool
        if (selectedGames.length < numToSelect && topGames.length > selectedGames.length) {
          const remainingGames = topGames.filter(game => !selectedGames.some(selected => selected.id === game.id));
          
          // Add more games until we reach the desired number
          for (let i = 0; i < (numToSelect - selectedGames.length) && i < remainingGames.length; i++) {
            const { similarityScore, ...gameWithoutScore } = remainingGames[i];
            selectedGames.push(gameWithoutScore);
          }
        }
        
        console.log(`Selected ${selectedGames.length} games based on weighted sampling`);
        
        // Get trending games to mix in
        try {
          console.log('Getting trending games to mix in');
          // Get trending games with higher popularity/rating
          const trendingResponse = await igdbAPI.post('', `
            fields name, cover.url, summary, genres.name, player_perspectives.name;
            sort popularity desc;
            where rating > 75;
            limit 25;
          `);
          
          // Add 1-2 trending games if we have them
          if (trendingResponse.data && trendingResponse.data.length > 0) {
            console.log(`Found ${trendingResponse.data.length} trending games to potentially mix in`);
            
            // Randomly select 1-2 trending games not already in selectedGames
            const trendingGames = trendingResponse.data.filter(
              trendingGame => !selectedGames.some(
                selectedGame => selectedGame.id === trendingGame.id
              )
            );
            
            if (trendingGames.length > 0) {
              // Add 1-2 trending games
              const numTrendingToAdd = Math.min(2, trendingGames.length);
              const numToAdd = Math.floor(Math.random() * numTrendingToAdd) + 1; // Either 1 or 2
              
              for (let i = 0; i < numToAdd; i++) {
                const randomIndex = Math.floor(Math.random() * trendingGames.length);
                const randomTrending = trendingGames.splice(randomIndex, 1)[0];
                selectedGames.push(randomTrending);
              }
              
              console.log(`Mixed in ${numToAdd} trending games`);
            }
          }
        } catch (trendingError) {
          console.error('Error fetching trending games to mix in:', trendingError);
          // Continue without trending games if there's an error
        }
        
        // Shuffle the final result
        const shuffledGames = selectedGames.sort(() => 0.5 - Math.random());
        console.log(`Returning ${shuffledGames.length} personalized games`);
        
        // Add match percentages for display
        const gamesWithScores = shuffledGames.map(game => {
          // Normalize score to percentage from 0-100, capping at 95%
          const matchScore = Math.min(Math.round((game.similarityScore / 3) * 100), 95);
          
          // Remove similarityScore from returned data
          const { similarityScore, ...gameWithoutScore } = game;
          
          return {
            ...gameWithoutScore,
            matchPercentage: matchScore,
            rating_count: game.rating_count || 0
          };
        });
        
        // Shuffle slightly to introduce some variability
        const shuffledGamesWithScores = gamesWithScores.sort((a, b) => {
          // Add a small random element to the sort, but still prioritize higher scores
          return (b.matchPercentage + (Math.random() * 5)) - 
                 (a.matchPercentage + (Math.random() * 5));
        });
        
        return res.json(shuffledGamesWithScores);
      } else {
        console.log('No matching games found in IGDB, using fallback data');
        return useLocalFallbackGames(fallbackGames, user, topCategories, res);
      }
    } catch (igdbError) {
      // Check if it's a rate limiting error
      if (igdbError.response && igdbError.response.status === 429) {
        console.error('IGDB API rate limit reached (429), using fallback data');
        return useLocalFallbackGames(fallbackGames, user, topCategories, res);
      }
      
      console.error('IGDB API error:', igdbError);
      console.log('Using fallback data due to IGDB API error');
      return useLocalFallbackGames(fallbackGames, user, topCategories, res);
    }
  } catch (error) {
    console.error('Error getting personalized game recommendations:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to generate recommendations from local fallback games
function useLocalFallbackGames(fallbackGames, user, topCategories, res) {
  console.log('Using local fallback games for recommendations');
  
  // Calculate similarity score for each fallback game
  const scoredGames = fallbackGames.map(game => {
    // Extract game categories
    const gameCategories = [
      ...(game.genres || []).map(genre => genre.name),
      ...(game.player_perspectives || []).map(perspective => perspective.name)
    ];
    
    // Calculate dot product similarity
    let similarityScore = 0;
    gameCategories.forEach(category => {
      const tokenValue = user.categoryTokens.get(category) || 0;
      similarityScore += tokenValue;
    });
    
    // Ensure there's at least some minimal score
    similarityScore = Math.max(similarityScore, 0.1);
    
    return {
      ...game,
      similarityScore
    };
  });
  
  // Sort by similarity score
  const sortedGames = scoredGames.sort((a, b) => b.similarityScore - a.similarityScore);
  
  // Take top games
  const selectedGames = sortedGames.slice(0, 8);
  console.log(`Selected ${selectedGames.length} games based on similarity to user preferences`);
  
  // Add match percentages for display
  const gamesWithScores = selectedGames.map(game => {
    // Normalize score to percentage from 0-100, capping at 95%
    const matchScore = Math.min(Math.round((game.similarityScore / 3) * 100), 95);
    
    // Remove similarityScore from returned data
    const { similarityScore, ...gameWithoutScore } = game;
    
    return {
      ...gameWithoutScore,
      matchPercentage: matchScore,
      rating_count: game.rating_count || 0
    };
  });
  
  // Shuffle slightly to introduce some variability
  const shuffledGames = gamesWithScores.sort((a, b) => {
    // Add a small random element to the sort, but still prioritize higher scores
    return (b.matchPercentage + (Math.random() * 5)) - 
           (a.matchPercentage + (Math.random() * 5));
  });
  
  console.log('Returning personalized recommendations from local data');
  return res.json(shuffledGames);
}

// Helper function to get trending games when no personalized recommendations are available
async function getTrendingGamesForResponse(res) {
  try {
    const trendingResponse = await igdbAPI.post('', `
      fields name, cover.url, summary, genres.name, player_perspectives.name;
      sort popularity desc;
      where rating > 80;
      limit 12;
    `);
    
    if (!trendingResponse.data || trendingResponse.data.length === 0) {
      return res.status(404).json({ message: 'No games found' });
    }
    
    // Shuffle and return a subset of trending games
    const shuffled = trendingResponse.data.sort(() => 0.5 - Math.random());
    return res.json(shuffled.slice(0, 8));
  } catch (error) {
    console.error('Error getting trending games fallback:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Other game routes will go here

export default router; 