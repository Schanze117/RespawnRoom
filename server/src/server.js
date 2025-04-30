import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import sequelize from './config/connection.js';
import routes from './routes/index.js';
import { handleGoogleAuth } from './controllers/googleAuthController.js';

// Setup __dirname for ES modules
const __dirname = dirname(fileURLToPath(import.meta.url));
// Configure dotenv to load from root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Debug environment variables
console.log('Environment variables check:');
console.log('GOOGLE_CLIENT_ID exists:', !!process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_CLIENT_SECRET exists:', !!process.env.GOOGLE_CLIENT_SECRET);
console.log('VITE_CLIENT_ID exists:', !!process.env.VITE_CLIENT_ID);
console.log('VITE_ACCESS_TOKEN exists:', !!process.env.VITE_ACCESS_TOKEN);

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

app.use(express.static('../client/dist'));
app.use(express.json());

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

app.post("/api/games", async (req, res) => {
  const { content } = req.body;
  const API_BASE_URL = "https://api.igdb.com/v4"; 
  const token = process.env.VITE_ACCESS_TOKEN;
  const clientId = process.env.VITE_CLIENT_ID;

  if (!token || !clientId) {
    console.error('Missing IGDB API credentials');
    return res.status(500).json({ error: 'Missing API credentials' });
  }

  console.log('IGDB API Request:');
  console.log('Endpoint:', `${API_BASE_URL}/games`);
  console.log('Request content:', content);

  try {
    const response = await fetch(`${API_BASE_URL}/games`, {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/plain',
        'Accept': 'application/json'
      },
      body: content,
    });
  
    if (!response.ok) {
      const errorText = await response.text();
      console.error('IGDB API Error:', response.status, response.statusText);
      console.error('Error details:', errorText);
      return res.status(response.status).json({ 
        error: response.statusText,
        details: errorText
      });
    }
    
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error proxying to IGDB API:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Add a new endpoint for trending games
app.get("/api/games/trending", async (req, res) => {
  try {
    const API_BASE_URL = "https://api.igdb.com/v4"; 
    const token = process.env.VITE_ACCESS_TOKEN;
    const clientId = process.env.VITE_CLIENT_ID;

    if (!token || !clientId) {
      console.error('Missing IGDB API credentials');
      return res.status(500).json({ error: 'Missing API credentials' });
    }

    console.log('IGDB API Request:');
    console.log('Endpoint:', `${API_BASE_URL}/games`);
    console.log('Client-ID exists:', !!clientId);
    console.log('Access Token exists:', !!token);

    // Query for popular games - using rating instead of popularity (which is invalid)
    // Using fields that are valid in IGDB API
    const response = await fetch(`${API_BASE_URL}/games`, {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/plain',
        'Accept': 'application/json'
      },
      body: 'fields id,name,cover.url,rating,rating_count; sort rating desc; where rating_count > 100; limit 50;'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('IGDB API Error:', response.status, response.statusText);
      console.error('Error details:', errorText);
      return res.status(response.status).json({ 
        error: response.statusText,
        details: errorText
      });
    }
    
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching trending games:', error);
    res.status(500).json({ error: 'Failed to fetch trending games', message: error.message });
  }
});

app.use(routes);

// Simple fix to redirect api2 requests to api
app.use('/api2', (req, res, next) => {
  req.url = req.url; // Keep the original path after /api2
  routes(req, res, next); // Use the same routes handler
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

sequelize.sync({ force: false }).then(() => {
  app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
});
