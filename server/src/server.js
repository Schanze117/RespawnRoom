import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs, resolvers } from './schemas/index.js';
import { authenticateToken } from './middleware/auth.js';
import cors from 'cors';

import './config/connection.js';
import routes from './routes/index.js';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { handleGoogleAuth } from './controllers/googleAuthController.js';

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
      const user = authenticateToken(req);
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
    
    // Query for trending games (adjust fields as needed)
    const query = `
      fields name,cover.url,genres.name,player_perspectives.name,summary,rating,first_release_date;
      where rating > 75 & first_release_date > ${Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 365}; 
      sort rating desc;
      limit 15;
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
      return res.status(500).json({ error: 'Failed to fetch trending games from IGDB API' });
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Server error in trending games endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
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