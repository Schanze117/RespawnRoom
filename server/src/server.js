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
  const token = process.env.VITE_ACCESS_TOKEN;
  const clientId = process.env.VITE_CLIENT_ID;

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
});

// Add trending games endpoint
app.get('/api/games/trending', async (req, res) => {
  try {
    const API_BASE_URL = 'https://api.igdb.com/v4';
    const token = process.env.VITE_ACCESS_TOKEN;
    const clientId = process.env.VITE_CLIENT_ID;
    
    // Fetch first batch of 500 games
    const firstQuery = `
      fields name,cover.url,genres.name,player_perspectives.name,summary,rating,first_release_date,id;
      where rating > 70 & first_release_date > ${Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 365}; 
      sort rating desc;
      limit 500;
      offset 0;
    `;
    
    // Fetch second batch of 500 games
    const secondQuery = `
      fields name,cover.url,genres.name,player_perspectives.name,summary,rating,first_release_date,id;
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
    const token = process.env.VITE_ACCESS_TOKEN;
    const clientId = process.env.VITE_CLIENT_ID;
    
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
    const token = process.env.VITE_ACCESS_TOKEN;
    const clientId = process.env.VITE_CLIENT_ID;
    
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
    const token = process.env.VITE_ACCESS_TOKEN;
    const clientId = process.env.VITE_CLIENT_ID;
    
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

// Add endpoint to fetch game by ID
app.get('/api/games/:id', async (req, res) => {
  try {
    const gameId = req.params.id;
    const API_BASE_URL = 'https://api.igdb.com/v4';
    const token = process.env.VITE_ACCESS_TOKEN;
    const clientId = process.env.VITE_CLIENT_ID;
    
    // Query for the specific game by ID
    const query = `
      fields name,cover.url,genres.name,player_perspectives.name,summary,rating,first_release_date,id,screenshots.url,artworks.url,videos.*;
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
      console.error('IGDB API error:', response.status, response.statusText);
      return res.status(500).json({ error: 'Failed to fetch game details from IGDB API' });
    }
    
    const data = await response.json();
    res.json(data.length > 0 ? data[0] : null);
  } catch (error) {
    console.error('Server error in get game by ID endpoint:', error);
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