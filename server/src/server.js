import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs, resolvers } from './schemas/index.js';
import { authenticateToken, getUserFromToken } from './middleware/auth.js';

import './config/connection.js';
import routes from './routes/index.js';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fetch from 'node-fetch';
import cors from 'cors';
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
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'cache-control', 'x-requested-with', 'apollo-require-preflight'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
}));

// Ensure preflight requests are handled for all routes
app.options('*', cors());

// Add CORS headers to all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, cache-control, x-requested-with, apollo-require-preflight');
  next();
});

app.use(express.json());
// Serve static files from the React app build directory in production
app.use(express.static(path.join(__dirname, '../../client/dist')));
app.use(routes); // Mount API routes from routes/index.js

passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  process.env.GOOGLE_CALLBACK_URL 
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
    const redirectUrl = process.env.CLIENT_URL ;
    res.redirect(`${redirectUrl}?token=${token}`);
  } catch (error) {
    res.redirect(`${process.env.CLIENT_URL}`);
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
    plugins: [],
    // Add explicit CORS options for Apollo
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'cache-control', 'x-requested-with', 'apollo-require-preflight'],
    }
  })
);

// Route for fetching IGDB API data
app.post('/api/games', async (req, res) => {
  const { content } = req.body;

  const API_BASE_URL = 'https://api.igdb.com/v4';
  const token = process.env.IGDB_ACCESS_TOKEN;
  const clientId = process.env.IGDB_CLIENT_ID;

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
      return res.status(response.status).json({ error: response.statusText });
    }
    
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add trending games endpoint
app.get('/api/games/trending', async (req, res) => {
  try {
    const API_BASE_URL = 'https://api.igdb.com/v4';
    const token = process.env.IGDB_ACCESS_TOKEN;
    const clientId = process.env.IGDB_CLIENT_ID;
    
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
      return res.status(500).json({ error: 'Failed to fetch trending games from IGDB API' });
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

// Add latest releases endpoint
app.get('/api/games/latest', async (req, res) => {
  try {
    const API_BASE_URL = 'https://api.igdb.com/v4';
    const token = process.env.IGDB_ACCESS_TOKEN;
    const clientId = process.env.IGDB_CLIENT_ID;
    
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
app.get('/api/games/top-rated', async (req, res) => {
  try {
    const API_BASE_URL = 'https://api.igdb.com/v4';
    const token = process.env.IGDB_ACCESS_TOKEN;
    const clientId = process.env.IGDB_CLIENT_ID;
    
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
      return res.status(500).json({ error: 'Failed to fetch top rated games from IGDB API' });
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
app.get('/api/games/upcoming', async (req, res) => {
  try {
    const API_BASE_URL = 'https://api.igdb.com/v4';
    const token = process.env.IGDB_ACCESS_TOKEN;
    const clientId = process.env.IGDB_CLIENT_ID;
    
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
app.get('/api/games/all-categories', async (req, res) => {
  try {
    const API_BASE_URL = 'https://api.igdb.com/v4';
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
      // Handle both playerPerspectives and player_perspectives (from API)
      playerPerspectives: Array.isArray(game.playerPerspectives)
        ? game.playerPerspectives.map(perspective => typeof perspective === 'string' ? perspective : perspective.name)
        : Array.isArray(game.player_perspectives)
          ? game.player_perspectives.map(perspective => typeof perspective === 'string' ? perspective : perspective.name)
          : []
    };
    
    // Save the game
    user.savedGames.push(formattedGame);
    
    // Update category tokens
    await user.updateCategoryTokens(formattedGame);
    
    // Return the updated user
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Add endpoint for game videos
app.post("/api/game_videos", async (req, res) => {
  const { content } = req.body;

  const API_BASE_URL = "https://api.igdb.com/v4"; 
  const token = process.env.IGDB_ACCESS_TOKEN;
  const clientId = process.env.IGDB_CLIENT_ID;

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

    if (!response.ok) {
      return res.status(response.status).json({ error: response.statusText });
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// For any request that doesn't match an API route, serve the React app
// This should be at the end of all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

// Start the server
app.listen(PORT, () => {
  // Server started successfully
});