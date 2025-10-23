import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import User from '../../models/users.js';
import { igdbAPI } from '../../config/igdb.js';
import fetch from 'node-fetch';

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

// Add trending games endpoint
router.get('/trending', async (req, res) => {
	const requestId = Date.now().toString();
	
	console.log(`🎮 [${new Date().toISOString()}] [${requestId}] TRENDING_GAMES: Request started`);
	console.log(`🎮 [${new Date().toISOString()}] [${requestId}] TRENDING_GAMES: Environment check - NODE_ENV: ${process.env.NODE_ENV}`);
	
	try {
		const API_BASE_URL = process.env.API_BASE_URL;
		console.log(`🎮 [${new Date().toISOString()}] [${requestId}] TRENDING_GAMES: API_BASE_URL available: ${API_BASE_URL ? 'YES' : 'NO'}`);
		
		if (!API_BASE_URL) {
			console.error(`❌ [${new Date().toISOString()}] [${requestId}] TRENDING_GAMES: API_BASE_URL not configured`);
			return res.status(500).json({ error: 'API_BASE_URL not configured' });
		}
		
		const token = process.env.IGDB_ACCESS_TOKEN;
		const clientId = process.env.IGDB_CLIENT_ID;
		
		console.log(`🎮 [${new Date().toISOString()}] [${requestId}] TRENDING_GAMES: IGDB credentials available - Token: ${token ? 'YES' : 'NO'}, ClientID: ${clientId ? 'YES' : 'NO'}`);
		
		if (!token || !clientId) {
			console.error(`❌ [${new Date().toISOString()}] [${requestId}] TRENDING_GAMES: IGDB API credentials not configured`);
			return res.status(500).json({ error: 'IGDB API credentials not configured' });
		}
		
		console.log(`🎮 [${new Date().toISOString()}] [${requestId}] TRENDING_GAMES: Building IGDB queries...`);
		
		// Fetch first batch of 500 games
		const firstQuery = `
			fields name,cover.url,genres.name,player_perspectives.name,summary,rating,rating_count,first_release_date,id;
			where rating > 70 & first_release_date > ${Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 365}; 
			sort rating desc;
			limit 500;
			offset 0;
		`;
		
		// Fetch second batch of 500 games
		const secondQuery = `
			fields name,cover.url,genres.name,player_perspectives.name,summary,rating,rating_count,first_release_date,id;
			where rating > 70 & first_release_date > ${Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 365}; 
			sort rating desc;
			limit 500;
			offset 500;
		`;
		
		console.log(`🎮 [${new Date().toISOString()}] [${requestId}] TRENDING_GAMES: Making first IGDB API call...`);
		const firstResponse = await fetch(`${API_BASE_URL}/games`, {
			method: 'POST',
			headers: {
				'Client-ID': clientId,
				'Authorization': `Bearer ${token}`,
				'Content-Type': 'text/plain'
			},
			body: firstQuery
		});
		console.log(`🎮 [${new Date().toISOString()}] [${requestId}] TRENDING_GAMES: First IGDB response status: ${firstResponse.status}`);
		
		console.log(`🎮 [${new Date().toISOString()}] [${requestId}] TRENDING_GAMES: Making second IGDB API call...`);
		const secondResponse = await fetch(`${API_BASE_URL}/games`, {
			method: 'POST',
			headers: {
				'Client-ID': clientId,
				'Authorization': `Bearer ${token}`,
				'Content-Type': 'text/plain'
			},
			body: secondQuery
		});
		console.log(`🎮 [${new Date().toISOString()}] [${requestId}] TRENDING_GAMES: Second IGDB response status: ${secondResponse.status}`);
		
		if (!firstResponse.ok || !secondResponse.ok) {
			console.error(`❌ [${new Date().toISOString()}] [${requestId}] TRENDING_GAMES: IGDB API call failed - First: ${firstResponse.status}, Second: ${secondResponse.status}`);
			return res.status(500).json({ error: 'Failed to fetch trending games from IGDB API' });
		}
		
		console.log(`🎮 [${new Date().toISOString()}] [${requestId}] TRENDING_GAMES: Parsing first response...`);
		const firstData = await firstResponse.json();
		console.log(`🎮 [${new Date().toISOString()}] [${requestId}] TRENDING_GAMES: First response parsed, games count: ${firstData?.length || 0}`);
		
		console.log(`🎮 [${new Date().toISOString()}] [${requestId}] TRENDING_GAMES: Parsing second response...`);
		const secondData = await secondResponse.json();
		console.log(`🎮 [${new Date().toISOString()}] [${requestId}] TRENDING_GAMES: Second response parsed, games count: ${secondData?.length || 0}`);
		
		console.log(`🎮 [${new Date().toISOString()}] [${requestId}] TRENDING_GAMES: Combining and deduplicating games...`);
		// Combine results and remove any duplicates by ID
		const combinedGames = [...firstData, ...secondData];
		const uniqueGames = Array.from(new Map(combinedGames.map(game => [game.id, game])).values());
		console.log(`🎮 [${new Date().toISOString()}] [${requestId}] TRENDING_GAMES: Final unique games count: ${uniqueGames.length}`);
		
		console.log(`🎮 [${new Date().toISOString()}] [${requestId}] TRENDING_GAMES: Sending response...`);
		res.json(uniqueGames);
		console.log(`✅ [${new Date().toISOString()}] [${requestId}] TRENDING_GAMES: Request completed successfully`);
	} catch (error) {
		console.error(`❌ [${new Date().toISOString()}] [${requestId}] TRENDING_GAMES: Error occurred:`, error.message);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// Add latest releases endpoint
router.get('/latest', async (req, res) => {
	try {
		const API_BASE_URL = process.env.API_BASE_URL;
		if (!API_BASE_URL) {
			return res.status(500).json({ error: 'API_BASE_URL not configured' });
		}
		const token = process.env.IGDB_ACCESS_TOKEN;
		const clientId = process.env.IGDB_CLIENT_ID;
		
		if (!token || !clientId) {
			return res.status(500).json({ error: 'IGDB API credentials not configured' });
		}
		
		// Current timestamp in seconds
		const now = Math.floor(Date.now() / 1000);
		// 6 months ago (increased from 3 months to get more games)
		const sixMonthsAgo = now - (60 * 60 * 24 * 180);
		
		// Fetch first batch of 500 games
		const firstQuery = `
			fields name,cover.url,genres.name,player_perspectives.name,summary,rating,rating_count,first_release_date,id;
			where first_release_date > ${sixMonthsAgo} 
			& first_release_date < ${now} 
			& rating_count > 5;
			sort first_release_date desc;
			limit 500;
			offset 0;
		`;
		
		// Fetch second batch of 500 games
		const secondQuery = `
			fields name,cover.url,genres.name,player_perspectives.name,summary,rating,rating_count,first_release_date,id;
			where first_release_date > ${sixMonthsAgo} 
			& first_release_date < ${now} 
			& rating_count > 5;
			sort first_release_date desc;
			limit 500;
			offset 500;
		`;
		
		const firstResponse = await fetch(`${API_BASE_URL}/games`, {
			method: 'POST',
			headers: {
				'Client-ID': clientId,
				'Authorization': `Bearer ${token}`,
				'Content-Type': 'text/plain'
			},
			body: firstQuery
		});
		
		const secondResponse = await fetch(`${API_BASE_URL}/games`, {
			method: 'POST',
			headers: {
				'Client-ID': clientId,
				'Authorization': `Bearer ${token}`,
				'Content-Type': 'text/plain'
			},
			body: secondQuery
		});
		
		if (!firstResponse.ok || !secondResponse.ok) {
			return res.status(500).json({ error: 'Failed to fetch latest releases from IGDB API' });
		}
		
		const firstData = await firstResponse.json();
		const secondData = await secondResponse.json();
		
		// Combine results and remove any duplicates by ID
		const combinedGames = [...firstData, ...secondData];
		const uniqueGames = Array.from(new Map(combinedGames.map(game => [game.id, game])).values());
		
		res.json(uniqueGames);
	} catch (error) {
		res.status(500).json({ error: 'Internal server error' });
	}
});

// Add top rated games endpoint
router.get('/top-rated', async (req, res) => {
	try {
		const API_BASE_URL = process.env.API_BASE_URL;
		if (!API_BASE_URL) {
			return res.status(500).json({ error: 'API_BASE_URL not configured' });
		}
		const token = process.env.IGDB_ACCESS_TOKEN;
		const clientId = process.env.IGDB_CLIENT_ID;
		
		if (!token || !clientId) {
			return res.status(500).json({ error: 'IGDB API credentials not configured' });
		}
		
		// Fetch first batch of 500 games
		const firstQuery = `
			fields name,cover.url,genres.name,player_perspectives.name,summary,rating,rating_count,first_release_date,id;
			where rating >= 90 & rating_count > 100;
			sort rating desc;
			limit 500;
			offset 0;
		`;
		
		// Fetch second batch of 500 games
		const secondQuery = `
			fields name,cover.url,genres.name,player_perspectives.name,summary,rating,rating_count,first_release_date,id;
			where rating >= 90 & rating_count > 100;
			sort rating desc;
			limit 500;
			offset 500;
		`;
		
		const firstResponse = await fetch(`${API_BASE_URL}/games`, {
			method: 'POST',
			headers: {
				'Client-ID': clientId,
				'Authorization': `Bearer ${token}`,
				'Content-Type': 'text/plain'
			},
			body: firstQuery
		});
		
		const secondResponse = await fetch(`${API_BASE_URL}/games`, {
			method: 'POST',
			headers: {
				'Client-ID': clientId,
				'Authorization': `Bearer ${token}`,
				'Content-Type': 'text/plain'
			},
			body: secondQuery
		});
		
		if (!firstResponse.ok || !secondResponse.ok) {
			return res.status(500).json({ error: 'Failed to fetch top-rated games from IGDB API' });
		}
		
		const firstData = await firstResponse.json();
		const secondData = await secondResponse.json();
		
		// Combine results and remove any duplicates by ID
		const combinedGames = [...firstData, ...secondData];
		const uniqueGames = Array.from(new Map(combinedGames.map(game => [game.id, game])).values());
		
		res.json(uniqueGames);
	} catch (error) {
		res.status(500).json({ error: 'Internal server error' });
	}
});

// Add upcoming games endpoint
router.get('/upcoming', async (req, res) => {
	try {
		const API_BASE_URL = process.env.API_BASE_URL;
		if (!API_BASE_URL) {
			return res.status(500).json({ error: 'API_BASE_URL not configured' });
		}
		const token = process.env.IGDB_ACCESS_TOKEN;
		const clientId = process.env.IGDB_CLIENT_ID;
		
		if (!token || !clientId) {
			return res.status(500).json({ error: 'IGDB API credentials not configured' });
		}
		
		// Current timestamp in seconds
		const now = Math.floor(Date.now() / 1000);
		// 1 year in the future
		const oneYearLater = now + (60 * 60 * 24 * 365);
		
		// Fetch first batch of 500 games
		const firstQuery = `
			fields name,cover.url,genres.name,player_perspectives.name,summary,hypes,first_release_date,id;
			where first_release_date > ${now} 
			& first_release_date < ${oneYearLater}
			& hypes > 5;
			sort first_release_date asc;
			limit 500;
			offset 0;
		`;
		
		// Fetch second batch of 500 games
		const secondQuery = `
			fields name,cover.url,genres.name,player_perspectives.name,summary,hypes,first_release_date,id;
			where first_release_date > ${now} 
			& first_release_date < ${oneYearLater}
			& hypes > 5;
			sort first_release_date asc;
			limit 500;
			offset 500;
		`;
		
		const firstResponse = await fetch(`${API_BASE_URL}/games`, {
			method: 'POST',
			headers: {
				'Client-ID': clientId,
				'Authorization': `Bearer ${token}`,
				'Content-Type': 'text/plain'
			},
			body: firstQuery
		});
		
		const secondResponse = await fetch(`${API_BASE_URL}/games`, {
			method: 'POST',
			headers: {
				'Client-ID': clientId,
				'Authorization': `Bearer ${token}`,
				'Content-Type': 'text/plain'
			},
			body: secondQuery
		});
		
		if (!firstResponse.ok || !secondResponse.ok) {
			return res.status(500).json({ error: 'Failed to fetch upcoming games from IGDB API' });
		}
		
		const firstData = await firstResponse.json();
		const secondData = await secondResponse.json();
		
		// Combine results and remove any duplicates by ID
		const combinedGames = [...firstData, ...secondData];
		const uniqueGames = Array.from(new Map(combinedGames.map(game => [game.id, game])).values());
		
		res.json(uniqueGames);
	} catch (error) {
		res.status(500).json({ error: 'Internal server error' });
	}
});

// Add all-categories endpoint
router.get('/all-categories', async (req, res) => {
	try {
		const API_BASE_URL = process.env.API_BASE_URL;
		if (!API_BASE_URL) {
			return res.status(500).json({ error: 'API_BASE_URL not configured' });
		}
		const token = process.env.IGDB_ACCESS_TOKEN;
		const clientId = process.env.IGDB_CLIENT_ID;
		
		if (!token || !clientId) {
			return res.status(500).json({ error: 'Missing API credentials' });
		}
		
		// Current timestamp in seconds
		const now = Math.floor(Date.now() / 1000);
		// Time references
		const oneYearAgo = now - (60 * 60 * 24 * 365);
		const sixMonthsAgo = now - (60 * 60 * 24 * 180);
		const oneYearLater = now + (60 * 60 * 24 * 365);
		
		// Fetch 4 batches of 500 games with different criteria
		const batchQueries = [
			// Batch 1: Trending games (high rating, recent release)
			`
				fields name,cover.url,genres.name,player_perspectives.name,summary,rating,rating_count,first_release_date,id,hypes;
				where rating > 70 & rating < 95 & first_release_date > ${oneYearAgo}; 
				sort popularity desc;
				limit 500;
			`,
			
			// Batch 2: Latest releases (games released in the last 6 months)
			`
				fields name,cover.url,genres.name,player_perspectives.name,summary,rating,rating_count,first_release_date,id,hypes;
				where first_release_date > ${sixMonthsAgo} 
				& first_release_date < ${now} 
				& rating_count > 3;
				sort first_release_date desc;
				limit 500;
			`,
			
			// Batch 3: Top rated games (highest-rated games of all time)
			`
				fields name,cover.url,genres.name,player_perspectives.name,summary,rating,rating_count,first_release_date,id,hypes;
				where rating >= 80 & rating_count > 50;
				sort rating desc;
				limit 500;
			`,
			
			// Batch 4: Upcoming games (games releasing in the next year)
			`
				fields name,cover.url,genres.name,player_perspectives.name,summary,rating,rating_count,first_release_date,id,hypes;
				where first_release_date > ${now} 
				& first_release_date < ${oneYearLater};
				sort hypes desc;
				limit 500;
			`
		];
		
		// Make all requests in parallel
		const batchPromises = batchQueries.map((query, index) => {
			return fetch(`${API_BASE_URL}/games`, {
				method: 'POST',
				headers: {
					'Client-ID': clientId,
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'text/plain'
				},
				body: query
			});
		});
		
		// Wait for all responses
		const responses = await Promise.all(batchPromises);
		
		// Check if any request failed
		for (let i = 0; i < responses.length; i++) {
			if (!responses[i].ok) {
				const errorText = await responses[i].text();
				return res.status(500).json({ error: `Failed to fetch games from IGDB API in batch ${i+1}`, details: errorText });
			}
		}
		
		// Parse all JSON responses
		const allData = await Promise.all(responses.map(r => r.json()));
		
		// Create a Map to track unique games by ID
		const uniqueGamesMap = new Map();
		
		// Process all games
		allData.forEach((batch, batchIndex) => {
			batch.forEach(game => {
				// Only add if not already in our map
				if (!uniqueGamesMap.has(game.id)) {
					uniqueGamesMap.set(game.id, {
						...game,
						// Add source category based on which batch it came from
						sourceCategory: batchIndex === 0 ? 'trending' : 
									batchIndex === 1 ? 'latest' : 
									batchIndex === 2 ? 'topRated' : 'upcoming'
					});
				}
			});
		});
		
		// Convert map values to array
		const allUniqueGames = Array.from(uniqueGamesMap.values());
		
		// Categorize games into sections without duplicates
		// We'll use a Set to track which games have been assigned
		const assignedGameIds = new Set();
		
		// Helper function to get unassigned games from a batch
		const getUnassignedGames = (batchIndex, limit) => {
			const category = batchIndex === 0 ? 'trending' : 
							 batchIndex === 1 ? 'latest' : 
							 batchIndex === 2 ? 'topRated' : 'upcoming';
			
			// Get all eligible games from this category
			const eligibleGames = allUniqueGames
				.filter(game => 
					game.sourceCategory === category && 
					!assignedGameIds.has(game.id)
				);
			
			// Shuffle the eligible games to increase randomness
			const shuffledGames = [...eligibleGames].sort(() => 0.5 - Math.random());
			
			// Take the requested number of games
			return shuffledGames
				.slice(0, limit)
				.map(game => {
					// Mark as assigned
					assignedGameIds.add(game.id);
					return game;
				});
		};
		
		// Create the categorized response
		const categorizedGames = {
			trending: {
				primary: getUnassignedGames(0, 5),
				secondary: getUnassignedGames(0, 5)
			},
			latest: {
				primary: getUnassignedGames(1, 5),
				secondary: getUnassignedGames(1, 10)
			},
			topRated: {
				primary: getUnassignedGames(2, 5),
				secondary: getUnassignedGames(2, 10)
			},
			upcoming: {
				primary: getUnassignedGames(3, 5),
				secondary: getUnassignedGames(3, 10)
			},
			// Also include all unique games for client-side filtering if needed
			allGames: allUniqueGames
		};
		
		res.json(categorizedGames);
	} catch (error) {
		res.status(500).json({ error: 'Internal server error' });
	}
});

// Add game by ID endpoint
router.get('/:id', async (req, res) => {
	try {
		const gameId = req.params.id;
		const API_BASE_URL = process.env.API_BASE_URL;
		const token = process.env.IGDB_ACCESS_TOKEN;
		const clientId = process.env.IGDB_CLIENT_ID;
		
		const query = `
			fields name,cover.url,genres.name,player_perspectives.name,summary,rating,rating_count,first_release_date,id,screenshots.url,videos.video_id,websites.url,websites.category;
			where id = ${gameId};
		`;
		
		const response = await fetch(`${API_BASE_URL}/games`, {
			method: 'POST',
			headers: {
				'Client-ID': clientId,
				'Authorization': `Bearer ${token}`,
				'Content-Type': 'text/plain'
			},
			body: query
		});
		
		if (!response.ok) {
			return res.status(response.status).json({ error: response.statusText });
		}
		
		const data = await response.json();
		
		// If no game found with that ID
		if (!data || data.length === 0) {
			return res.status(404).json({ error: 'Game not found' });
		}
		
		// Return the first (and should be only) game
		res.json(data[0]);
	} catch (error) {
		res.status(500).json({ error: 'Internal server error' });
	}
});

export default router; 