import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

import sequelize from './config/connection.js';
import routes from './routes/index.js';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { handleGoogleAuth } from './controllers/googleAuthController.js';

dotenv.config();
const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

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
