import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import User from '../../models/users.js';
import { igdbAPI } from '../../config/igdb.js';

const router = Router();

// GET /api/games/personalized
// Get personalized game recommendations based on user tokens
router.get('/personalized', authenticateToken, async (req, res) => {
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
    
    // Get user category tokens and convert to array of entries
    const categoryTokens = [];
    user.categoryTokens.forEach((value, key) => {
      // Only include tokens with a significant value
      if (value >= 0.5) {
        categoryTokens.push({ category: key, value });
      }
    });
    
    if (categoryTokens.length === 0) {
      // Check if user has saved games but no tokens
      if (user.savedGames && user.savedGames.length > 0) {
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
        
        // If we still have no tokens, return empty array
        if (refreshedCategoryTokens.length === 0) {
          return res.json([]);
        }
        
        // Use the newly generated tokens
        categoryTokens.push(...refreshedCategoryTokens);
      } else {
        return res.json([]);
      }
    }
    
    // Local fallback mechanism - use these predefined games when IGDB API is unavailable
    const fallbackGames = [];
    
    // Sort by token weight (highest first)
    categoryTokens.sort((a, b) => b.value - a.value);
    
    // Take top 5 categories
    const topCategories = categoryTokens.slice(0, 5).map(entry => entry.category);
    
    // Try to query IGDB first, but handle rate limiting
    try {
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
      
      // Query IGDB for games matching these categories
      const igdbResponse = await igdbAPI.post('', `
        fields name, cover.url, summary, genres.name, player_perspectives.name, rating, rating_count;
        where ${whereClause};
        limit 100;
      `);
      
      if (igdbResponse.data && igdbResponse.data.length > 0) {
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
        
        // Get trending games to mix in
        try {
          // Get trending games with higher popularity/rating
          const trendingResponse = await igdbAPI.post('', `
            fields name, cover.url, summary, genres.name, player_perspectives.name;
            sort popularity desc;
            where rating > 75;
            limit 25;
          `);
          
          // Add 1-2 trending games if we have them
          if (trendingResponse.data && trendingResponse.data.length > 0) {
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
            }
          }
        } catch (trendingError) {
          // Continue without trending games if there's an error
        }
        
        // Shuffle the final result
        const shuffledGames = selectedGames.sort(() => 0.5 - Math.random());
        
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
        return useLocalFallbackGames(fallbackGames, user, topCategories, res);
      }
    } catch (igdbError) {
      // Check if it's a rate limiting error
      if (igdbError.response && igdbError.response.status === 429) {
        return useLocalFallbackGames(fallbackGames, user, topCategories, res);
      }
      
      return useLocalFallbackGames(fallbackGames, user, topCategories, res);
    }
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to generate recommendations from local fallback games
function useLocalFallbackGames(fallbackGames, user, topCategories, res) {
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
    return res.status(500).json({ message: 'Server error' });
  }
}

// Other game routes will go here

export default router; 