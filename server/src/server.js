import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import db from './config/connection.js';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs } from './schemas/typeDefs.js';
import { resolvers } from './schemas/resolvers.js';
import { authenticateToken } from './middleware/auth.js';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fetch from 'node-fetch';
import cors from 'cors';
import { handleGoogleAuth } from './controllers/googleAuthController.js';

dotenv.config();
const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// Start Apollo Server
await db;
await server.start();

// Middleware for parsing request bodies
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Enable CORS for all routes
const corsOptions = {
  origin: ['http://localhost:3000', 'https://studio.apollographql.com'],
  credentials: true
};
app.use(cors(corsOptions));

// Middleware for Apollo Server
app.use(
  '/graphql',
  expressMiddleware(server, {
    context: async ({ req }) => {
      const user = authenticateToken(req);
      return { user };
    },
  })
);

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
      Authorization: `Bearer ${token}`,
    },
    body: content,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  res.status(200).json(data);
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