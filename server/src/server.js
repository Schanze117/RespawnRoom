import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs, resolvers } from './schemas/index.js';
import { authenticateToken, getUserFromToken } from './middleware/auth.js';
import cors from 'cors';

import './config/connection.js';
import routes from './routes/index.js';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { handleGoogleAuth } from './controllers/googleAuthController.js';
import User from './models/users.js';

// Setup __dirname for ES modules
const __dirname = dirname(fileURLToPath(import.meta.url));
// Configure dotenv to load from root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Apply CORS middleware globally
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.static('../client/dist'));
app.use(routes); // Mount API routes from routes/index.js

passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  process.env.GOOGLE_CALLBACK_URL || `http://localhost:${PORT}/auth/google/callback`
},
async (accessToken, refreshToken, profile, done) => {
  try {
    // Use the controller to handle Google authentication
    const { user, token } = await handleGoogleAuth(profile);
    done(null, { user, token });
  } catch (error) {
    done(error, null);
  }
}
));

app.use(passport.initialize());

// Create Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// Start Apollo Server before applying middleware
await server.start();

app.get(
'/auth/google',
passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get(
'/auth/google/callback',
passport.authenticate('google', { session: false, failureRedirect: '/login' }),
async (req, res) => {
  try {
    // req.user is now { user, token }
    const { token } = req.user;
    const redirectUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(`${redirectUrl}?token=${token}`);
  } catch (error) {
    console.error('Error in Google callback:', error);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=auth_failed`);
  }
}
);

// Apply Apollo Server middleware with correct CORS handling
app.use('/graphql', 
  expressMiddleware(server, {
    context: async ({ req }) => {
      // Get the user token from the headers
      const user = getUserFromToken(req);
      // Add the user to the context
      return { user };
    },
  })
);

// Route for fetching IGDB API data
app.post('/api/games', async (req, res) => {
  const { content } = req.body;

  const API_BASE_URL = 'https://api.igdb.com/v4';
  const token = process.env.IGDB_ACCESS_TOKEN;
  const clientId = process.env.IGDB_CLIENT_ID;

  console.log('IGDB API request initiated with:', { 
    tokenAvailable: !!token, 
    clientIdAvailable: !!clientId 
  });

  try {
    const response = await fetch(`${API_BASE_URL}/games`, {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${token}`,
      },
      body: content,
    });

    if (!response.ok) {
      console.error(`IGDB API error: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ error: response.statusText });
    }
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error in /api/games endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add trending games endpoint
app.get('/api/games/trending', async (req, res) => {
  try {
    const API_BASE_URL = 'https://api.igdb.com/v4';
    const token = process.env.IGDB_ACCESS_TOKEN;
    const clientId = process.env.IGDB_CLIENT_ID;
    
    console.log('Trending games request initiated with:', { 
      tokenAvailable: !!token, 
      clientIdAvailable: !!clientId 
    });
    
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
      console.error('IGDB API error:', 
        firstResponse.ok ? '' : `First batch: ${firstResponse.status}`,
        secondResponse.ok ? '' : `Second batch: ${secondResponse.status}`);
      return res.status(500).json({ error: 'Failed to fetch trending games from IGDB API' });
    }
    
    const firstData = await firstResponse.json();
    const secondData = await secondResponse.json();
    
    // Combine results and remove any duplicates by ID
    const combinedGames = [...firstData, ...secondData];
    const uniqueGames = Array.from(new Map(combinedGames.map(game => [game.id, game])).values());
    
    res.json(uniqueGames);
  } catch (error) {
    console.error('Server error in trending games endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add latest releases endpoint
app.get('/api/games/latest', async (req, res) => {
  try {
    const API_BASE_URL = 'https://api.igdb.com/v4';
    const token = process.env.IGDB_ACCESS_TOKEN;
    const clientId = process.env.IGDB_CLIENT_ID;
    
    console.log('Latest games request initiated with:', { 
      tokenAvailable: !!token, 
      clientIdAvailable: !!clientId 
    });
    
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
      console.error('IGDB API error:', 
        firstResponse.ok ? '' : `First batch: ${firstResponse.status}`,
        secondResponse.ok ? '' : `Second batch: ${secondResponse.status}`);
      return res.status(500).json({ error: 'Failed to fetch latest releases from IGDB API' });
    }
    
    const firstData = await firstResponse.json();
    const secondData = await secondResponse.json();
    
    // Combine results and remove any duplicates by ID
    const combinedGames = [...firstData, ...secondData];
    const uniqueGames = Array.from(new Map(combinedGames.map(game => [game.id, game])).values());
    
    res.json(uniqueGames);
  } catch (error) {
    console.error('Server error in latest releases endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add top rated games endpoint
app.get('/api/games/top-rated', async (req, res) => {
  try {
    const API_BASE_URL = 'https://api.igdb.com/v4';
    const token = process.env.IGDB_ACCESS_TOKEN;
    const clientId = process.env.IGDB_CLIENT_ID;
    
    console.log('Top rated games request initiated with:', { 
      tokenAvailable: !!token, 
      clientIdAvailable: !!clientId 
    });
    
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
      console.error('IGDB API error:', 
        firstResponse.ok ? '' : `First batch: ${firstResponse.status}`,
        secondResponse.ok ? '' : `Second batch: ${secondResponse.status}`);
      return res.status(500).json({ error: 'Failed to fetch top rated games from IGDB API' });
    }
    
    const firstData = await firstResponse.json();
    const secondData = await secondResponse.json();
    
    // Combine results and remove any duplicates by ID
    const combinedGames = [...firstData, ...secondData];
    const uniqueGames = Array.from(new Map(combinedGames.map(game => [game.id, game])).values());
    
    res.json(uniqueGames);
  } catch (error) {
    console.error('Server error in top rated games endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add upcoming games endpoint
app.get('/api/games/upcoming', async (req, res) => {
  try {
    const API_BASE_URL = 'https://api.igdb.com/v4';
    const token = process.env.IGDB_ACCESS_TOKEN;
    const clientId = process.env.IGDB_CLIENT_ID;
    
    console.log('Upcoming games request initiated with:', { 
      tokenAvailable: !!token, 
      clientIdAvailable: !!clientId 
    });
    
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
      console.error('IGDB API error:', 
        firstResponse.ok ? '' : `First batch: ${firstResponse.status}`,
        secondResponse.ok ? '' : `Second batch: ${secondResponse.status}`);
      return res.status(500).json({ error: 'Failed to fetch upcoming games from IGDB API' });
    }
    
    const firstData = await firstResponse.json();
    const secondData = await secondResponse.json();
    
    // Combine results and remove any duplicates by ID
    const combinedGames = [...firstData, ...secondData];
    const uniqueGames = Array.from(new Map(combinedGames.map(game => [game.id, game])).values());
    
    res.json(uniqueGames);
  } catch (error) {
    console.error('Server error in upcoming games endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add all-categories endpoint
app.get('/api/games/all-categories', async (req, res) => {
  try {
    console.log('Received request for all game categories');
    const API_BASE_URL = 'https://api.igdb.com/v4';
    const token = process.env.IGDB_ACCESS_TOKEN;
    const clientId = process.env.IGDB_CLIENT_ID;
    
    if (!token || !clientId) {
      console.error('Missing API credentials:', { 
        hasToken: !!token, 
        hasClientId: !!clientId 
      });
      return res.status(500).json({ error: 'Missing API credentials' });
    }
    
    // Current timestamp in seconds
    const now = Math.floor(Date.now() / 1000);
    // Time references
    const oneYearAgo = now - (60 * 60 * 24 * 365);
    const sixMonthsAgo = now - (60 * 60 * 24 * 180);
    const oneYearLater = now + (60 * 60 * 24 * 365);
    
    console.log('Fetching all game categories in a single composite request');
    
    // Fetch 4 batches of 500 games with different criteria
    const batchQueries = [
      // Batch 1: Trending games (high rating, recent release)
      `
        fields name,cover.url,genres.name,player_perspectives.name,summary,rating,rating_count,first_release_date,id,hypes;
        where rating > 70 & first_release_date > ${oneYearAgo}; 
        sort rating desc;
        limit 500;
      `,
      
      // Batch 2: Latest releases (games released in the last 6 months)
      `
        fields name,cover.url,genres.name,player_perspectives.name,summary,rating,rating_count,first_release_date,id,hypes;
        where first_release_date > ${sixMonthsAgo} 
        & first_release_date < ${now} 
        & rating_count > 5;
        sort first_release_date desc;
        limit 500;
      `,
      
      // Batch 3: Top rated games (highest-rated games of all time)
      `
        fields name,cover.url,genres.name,player_perspectives.name,summary,rating,rating_count,first_release_date,id,hypes;
        where rating >= 90 & rating_count > 100;
        sort rating desc;
        limit 500;
      `,
      
      // Batch 4: Upcoming games (games releasing in the next year)
      `
        fields name,cover.url,genres.name,player_perspectives.name,summary,rating,rating_count,first_release_date,id,hypes;
        where first_release_date > ${now} 
        & first_release_date < ${oneYearLater}
        & hypes > 5;
        sort first_release_date asc;
        limit 500;
      `
    ];
    
    // Make all requests in parallel
    const batchPromises = batchQueries.map((query, index) => {
      console.log(`Sending batch ${index + 1} request to IGDB API`);
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
        console.error(`IGDB API error in batch ${i+1}: ${responses[i].status}`);
        const errorText = await responses[i].text();
        console.error(`Error response for batch ${i+1}:`, errorText);
        return res.status(500).json({ error: `Failed to fetch games from IGDB API in batch ${i+1}`, details: errorText });
      }
    }
    
    // Parse all JSON responses
    const allData = await Promise.all(responses.map(r => r.json()));
    
    // Log the count of games received from each batch
    allData.forEach((batch, index) => {
      console.log(`Received ${batch.length} games from batch ${index + 1}`);
    });
    
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
    console.log(`Total unique games fetched: ${allUniqueGames.length}`);
    
    // Categorize games into sections without duplicates
    // We'll use a Set to track which games have been assigned
    const assignedGameIds = new Set();
    
    // Helper function to get unassigned games from a batch
    const getUnassignedGames = (batchIndex, limit) => {
      const category = batchIndex === 0 ? 'trending' : 
                       batchIndex === 1 ? 'latest' : 
                       batchIndex === 2 ? 'topRated' : 'upcoming';
      
      return allUniqueGames
        .filter(game => 
          game.sourceCategory === category && 
          !assignedGameIds.has(game.id)
        )
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
    
    console.log(`Games categorized: Trending (${categorizedGames.trending.primary.length + categorizedGames.trending.secondary.length}), Latest (${categorizedGames.latest.primary.length + categorizedGames.latest.secondary.length}), Top Rated (${categorizedGames.topRated.primary.length + categorizedGames.topRated.secondary.length}), Upcoming (${categorizedGames.upcoming.primary.length + categorizedGames.upcoming.secondary.length})`);
    
    res.json(categorizedGames);
  } catch (error) {
    console.error('Server error in composite games endpoint:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message, stack: error.stack });
  }
});

// Add game by ID endpoint
app.get('/api/games/:id', async (req, res) => {
  try {
    const gameId = req.params.id;
    const API_BASE_URL = 'https://api.igdb.com/v4';
    const token = process.env.IGDB_ACCESS_TOKEN;
    const clientId = process.env.IGDB_CLIENT_ID;
    
    console.log(`Game by ID request for ${gameId} initiated with:`, { 
      tokenAvailable: !!token, 
      clientIdAvailable: !!clientId 
    });
    
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
      console.error(`IGDB API error for game ID ${gameId}: ${response.status} ${response.statusText}`);
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
    console.error(`Server error in game by ID endpoint for ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Handle saveGame mutation to update category tokens
app.post('/api/mutations/saveGame', authenticateToken, async (req, res) => {
  try {
    const { game } = req.body;
    const userId = req.user._id;
    
    // Find the user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prepare game data with proper format
    const formattedGame = {
      name: game.name || 'Unknown Game',
      cover: game.cover || (game.cover && game.cover.url) || '',
      summary: game.summary || 'No summary available',
      // Convert genres and perspectives to string arrays for consistent token handling
      genres: Array.isArray(game.genres) 
        ? game.genres.map(genre => typeof genre === 'string' ? genre : genre.name)
        : [],
      playerPerspectives: Array.isArray(game.playerPerspectives)
        ? game.playerPerspectives.map(perspective => typeof perspective === 'string' ? perspective : perspective.name)
        : []
    };
    
    // Save the game
    user.savedGames.push(formattedGame);
    
    // Update category tokens
    await user.updateCategoryTokens(formattedGame);
    
    // Return the updated user
    return res.json(user);
  } catch (error) {
    console.error('Error saving game:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Serve static files from the React app
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));

  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

// Start the server
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}!`);
  console.log(`Use GraphQL at http://localhost:${PORT}/graphql`);
});

app.post("/api/game_videos", async (req, res) => {
  const { content } = req.body;

  const API_BASE_URL = "https://api.igdb.com/v4"; 
  const token = process.env.IGDB_ACCESS_TOKEN;
  const clientId = process.env.IGDB_CLIENT_ID;

  console.log("Content:", content);
  console.log("Token:", token ? "Present" : "Missing");
  console.log("Client ID:", clientId ? "Present" : "Missing");

  try {
    const response = await fetch(`${API_BASE_URL}/game_videos`, {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${token}`,
      },
      body: content,
    });

    const data = await response.json();
    console.log("IGDB API Response:", data);

    if (!response.ok) {
      console.error("IGDB API Error:", response.status, response.statusText);
      return res.status(response.status).json({ error: response.statusText });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});