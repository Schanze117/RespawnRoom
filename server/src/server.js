// Add this at the VERY TOP of src/server.js
console.log('EXPRESS_APP_LOG: SM00 - src/server.js execution started');

import express from 'express';

import dotenv from 'dotenv';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs, resolvers } from './schemas/index.js';
import { authenticateToken, getUserFromToken } from './middleware/auth.js';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import './config/connection.js';
import routes from './routes/index.js';
import fetch from 'node-fetch';
import cors from 'cors';

import User from './models/users.js';

// Setup __dirname for ES modules first - moved outside of try/catch
let __dirname;
try {
  __dirname = dirname(fileURLToPath(import.meta.url));
  
  // Configure dotenv to load from root directory - EARLY
  console.log('EXPRESS_APP_LOG: SM01 - Configuring dotenv');
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
  console.log('EXPRESS_APP_LOG: SM02 - Environment loaded, MONGODB_URI available:', !!process.env.MONGODB_URI);
} catch (error) {
  console.error('EXPRESS_APP_LOG: CRITICAL ENV ERROR:', error);
  // Don't exit process, let Lambda handle it
}

// Create Express app
const app = express();

// Define allowed origins for CORS strictly from environment
// Provide a comma-separated list via CORS_ALLOWED_ORIGINS
const allowedOrigins = Array.from(new Set([
  ...(process.env.CORS_ALLOWED_ORIGINS ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean) : []),
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : [])
]));

// Log CORS options for debugging
console.log("CORS OPTIONS:", JSON.stringify({
  allowedOrigins,
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'apollo-require-preflight', 'cache-control'],
  optionsSuccessStatus: 204
}, null, 2));

// *** IMPORTANT: Apply CORS as the VERY FIRST middleware ***
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like Insomnia, curl)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      console.log(`EXPRESS_APP_LOG: CORS allowed for origin: ${origin || 'No Origin'}`);
      callback(null, true);
    } else {
      console.error(`EXPRESS_APP_LOG: CORS rejected for origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'apollo-require-preflight', 'cache-control'],
  credentials: true,
  optionsSuccessStatus: 204
};

// 1. FIRST: Handle all OPTIONS requests (preflight)
app.options('*', cors(corsOptions));

// 2. SECOND: Apply CORS to all routes
app.use(cors(corsOptions));

// 3. THIRD: Other middleware AFTER CORS
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add request logging middleware
app.use((req, res, next) => {
  console.log("EXPRESS REQ:", req.method, req.path, {
    origin: req.headers.origin,
    contentType: req.headers['content-type'],
    authorization: req.headers.authorization ? 'Bearer [REDACTED]' : 'none',
    body: req.method !== 'GET' ? JSON.stringify(req.body).substring(0, 200) : 'none'
  });
  
  // Track response for logging
  const originalSend = res.send;
  res.send = function(data) {
    console.log("EXPRESS RES:", req.method, req.path, {
      statusCode: res.statusCode,
      hasData: !!data,
      corsExposed: res.getHeader('Access-Control-Allow-Origin'),
      contentType: res.getHeader('Content-Type')
    });
    return originalSend.apply(res, arguments);
  };
  
  next();
});

// Add a simple rate limiter
const rateLimit = (maxRequests, windowMs) => {
  const requestCounts = new Map();
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of requestCounts.entries()) {
      if (now - data.timestamp > windowMs) {
        requestCounts.delete(ip);
      }
    }
  }, windowMs);

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!requestCounts.has(ip)) {
      requestCounts.set(ip, { count: 1, timestamp: now });
      return next();
    }
    
    const data = requestCounts.get(ip);
    if (now - data.timestamp > windowMs) {
      // Reset if window expired
      requestCounts.set(ip, { count: 1, timestamp: now });
      return next();
    }
    
    // Increment count
    data.count++;
    requestCounts.set(ip, data);
    
    if (data.count > maxRequests) {
      return res.status(429).json({ 
        error: 'Too many requests, please try again later'
      });
    }
    
    next();
  };
};

// 4. FOURTH: Mount API routes AFTER CORS and basic middleware
app.use(routes);



// Create Apollo Server instance but DON'T start it yet
const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: process.env.NODE_ENV !== 'production',
  formatError: (formattedError) => {
    // Log the error for debugging
    console.error("APOLLO_ERROR:", formattedError);
    // Return sanitized errors in production
    if (process.env.NODE_ENV === 'production') {
      return { message: 'Internal server error' };
    }
    return formattedError;
  },
});

// Track initialization state with module-level variables
let apolloInitialized = false;
let apolloInitializationPromise = null;

// Export the app directly for sync usage
export default app;

// Also export an initialization function that can be awaited if needed
export const initializeApolloServer = async () => {
  // If already initialized or in the process of initializing, return the existing promise
  if (apolloInitialized) {
    console.log('EXPRESS_APP_LOG: Apollo Server already initialized, skipping start()');
    return true;
  }
  
  if (apolloInitializationPromise) {
    console.log('EXPRESS_APP_LOG: Apollo Server initialization already in progress, returning existing promise');
    return apolloInitializationPromise;
  }
  
  console.log('EXPRESS_APP_LOG: Starting Apollo Server...');
  
  // Create a new promise for initialization and store it
  apolloInitializationPromise = (async () => {
    try {
      await apolloServer.start();
      console.log('EXPRESS_APP_LOG: Apollo Server started successfully');
      
      // 5. FIFTH: Apply Apollo middleware AFTER server is started
      // Express will use the CORS headers from the global middleware for this route
      app.use('/graphql', 
        expressMiddleware(apolloServer, {
          context: async ({ req }) => {
            const user = getUserFromToken(req);
            return { user };
          },
          // Explicitly disable Apollo's built-in CORS handling to avoid conflicts
          // Let the global Express CORS middleware handle all CORS concerns
          cors: false
        })
      );
      console.log('EXPRESS_APP_LOG: Apollo middleware applied');
      
      // Mark as initialized only after everything succeeds
      apolloInitialized = true;
      return true;
    } catch (error) {
      console.error('EXPRESS_APP_LOG: Failed to start Apollo Server', error);
      // Reset the promise on error so initialization can be retried
      apolloInitializationPromise = null;
      return false;
    }
  })();
  
  return apolloInitializationPromise;
};

// DO NOT call initializeApolloServer() at module level

// Add trending games endpoint
app.get('/api/games/trending', async (req, res) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    console.log('🔧 TRENDING GAMES DEBUG: Endpoint called');
    console.log('🔧 TRENDING GAMES DEBUG: IGDB_CLIENT_ID available =', !!process.env.IGDB_CLIENT_ID);
    console.log('🔧 TRENDING GAMES DEBUG: IGDB_ACCESS_TOKEN available =', !!process.env.IGDB_ACCESS_TOKEN);
  }
  
  try {
    const API_BASE_URL = process.env.API_BASE_URL;
    if (!API_BASE_URL) {
      return res.status(500).json({ error: 'API_BASE_URL not configured' });
    }
    const token = process.env.IGDB_ACCESS_TOKEN;
    const clientId = process.env.IGDB_CLIENT_ID;
    
    if (isDevelopment) {
      console.log('🔧 TRENDING GAMES DEBUG: Using API_BASE_URL =', API_BASE_URL);
      console.log('🔧 TRENDING GAMES DEBUG: Token length =', token ? token.length : 'MISSING');
      console.log('🔧 TRENDING GAMES DEBUG: Client ID length =', clientId ? clientId.length : 'MISSING');
    }
    
    if (!token || !clientId) {
      if (isDevelopment) {
        console.error('🔧 TRENDING GAMES ERROR: Missing IGDB credentials');
        console.error('🔧 TRENDING GAMES ERROR: Token =', !!token);
        console.error('🔧 TRENDING GAMES ERROR: Client ID =', !!clientId);
      }
      return res.status(500).json({ error: 'IGDB API credentials not configured' });
    }
    
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
    
    if (isDevelopment) {
      console.log('🔧 TRENDING GAMES DEBUG: Sending first request...');
    }
    
    const firstResponse = await fetch(`${API_BASE_URL}/games`, {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/plain'
      },
      body: firstQuery
    });
    
    if (isDevelopment) {
      console.log('🔧 TRENDING GAMES DEBUG: First response status =', firstResponse.status);
      console.log('🔧 TRENDING GAMES DEBUG: First response ok =', firstResponse.ok);
    }
    
    if (isDevelopment) {
      console.log('🔧 TRENDING GAMES DEBUG: Sending second request...');
    }
    
    const secondResponse = await fetch(`${API_BASE_URL}/games`, {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/plain'
      },
      body: secondQuery
    });
    
    if (isDevelopment) {
      console.log('🔧 TRENDING GAMES DEBUG: Second response status =', secondResponse.status);
      console.log('🔧 TRENDING GAMES DEBUG: Second response ok =', secondResponse.ok);
    }
    
    if (!firstResponse.ok || !secondResponse.ok) {
      if (isDevelopment) {
        console.error('🔧 TRENDING GAMES ERROR: API responses not ok');
        console.error('🔧 TRENDING GAMES ERROR: First response status =', firstResponse.status);
        console.error('🔧 TRENDING GAMES ERROR: Second response status =', secondResponse.status);
      }
      return res.status(500).json({ error: 'Failed to fetch trending games from IGDB API' });
    }
    
    const firstData = await firstResponse.json();
    const secondData = await secondResponse.json();
    
    if (isDevelopment) {
      console.log('🔧 TRENDING GAMES DEBUG: First batch games count =', firstData?.length || 0);
      console.log('🔧 TRENDING GAMES DEBUG: Second batch games count =', secondData?.length || 0);
    }
    
    // Combine results and remove any duplicates by ID
    const combinedGames = [...firstData, ...secondData];
    const uniqueGames = Array.from(new Map(combinedGames.map(game => [game.id, game])).values());
    
    if (isDevelopment) {
      console.log('🔧 TRENDING GAMES DEBUG: Combined unique games count =', uniqueGames.length);
      console.log('🔧 TRENDING GAMES DEBUG: Sending response...');
    }
    
    res.json(uniqueGames);
  } catch (error) {
    if (isDevelopment) {
      console.error('🔧 TRENDING GAMES ERROR: Exception caught:', error.message);
      console.error('🔧 TRENDING GAMES ERROR: Stack trace:', error.stack);
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add latest releases endpoint
app.get('/api/games/latest', async (req, res) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    console.log('🔧 LATEST RELEASES DEBUG: Endpoint called');
    console.log('🔧 LATEST RELEASES DEBUG: IGDB_CLIENT_ID available =', !!process.env.IGDB_CLIENT_ID);
    console.log('🔧 LATEST RELEASES DEBUG: IGDB_ACCESS_TOKEN available =', !!process.env.IGDB_ACCESS_TOKEN);
  }
  
  try {
    const API_BASE_URL = process.env.API_BASE_URL;
    if (!API_BASE_URL) {
      return res.status(500).json({ error: 'API_BASE_URL not configured' });
    }
    const token = process.env.IGDB_ACCESS_TOKEN;
    const clientId = process.env.IGDB_CLIENT_ID;
    
    if (isDevelopment) {
      console.log('🔧 LATEST RELEASES DEBUG: Using API_BASE_URL =', API_BASE_URL);
      console.log('🔧 LATEST RELEASES DEBUG: Token length =', token ? token.length : 'MISSING');
      console.log('🔧 LATEST RELEASES DEBUG: Client ID length =', clientId ? clientId.length : 'MISSING');
    }
    
    if (!token || !clientId) {
      if (isDevelopment) {
        console.error('🔧 LATEST RELEASES ERROR: Missing IGDB credentials');
        console.error('🔧 LATEST RELEASES ERROR: Token =', !!token);
        console.error('🔧 LATEST RELEASES ERROR: Client ID =', !!clientId);
      }
      return res.status(500).json({ error: 'IGDB API credentials not configured' });
    }
    
    // Current timestamp in seconds
    const now = Math.floor(Date.now() / 1000);
    // 6 months ago (increased from 3 months to get more games)
    const sixMonthsAgo = now - (60 * 60 * 24 * 180);
    
    if (isDevelopment) {
      console.log('🔧 LATEST RELEASES DEBUG: Time range =', { now, sixMonthsAgo });
    }
    
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
    
    if (isDevelopment) {
      console.log('🔧 LATEST RELEASES DEBUG: Sending first request...');
    }
    
    const firstResponse = await fetch(`${API_BASE_URL}/games`, {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/plain'
      },
      body: firstQuery
    });
    
    if (isDevelopment) {
      console.log('🔧 LATEST RELEASES DEBUG: First response status =', firstResponse.status);
      console.log('🔧 LATEST RELEASES DEBUG: First response ok =', firstResponse.ok);
    }
    
    if (isDevelopment) {
      console.log('🔧 LATEST RELEASES DEBUG: Sending second request...');
    }
    
    const secondResponse = await fetch(`${API_BASE_URL}/games`, {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/plain'
      },
      body: secondQuery
    });
    
    if (isDevelopment) {
      console.log('🔧 LATEST RELEASES DEBUG: Second response status =', secondResponse.status);
      console.log('🔧 LATEST RELEASES DEBUG: Second response ok =', secondResponse.ok);
    }
    
    if (!firstResponse.ok || !secondResponse.ok) {
      if (isDevelopment) {
        console.error('🔧 LATEST RELEASES ERROR: API responses not ok');
        console.error('🔧 LATEST RELEASES ERROR: First response status =', firstResponse.status);
        console.error('🔧 LATEST RELEASES ERROR: Second response status =', secondResponse.status);
      }
      return res.status(500).json({ error: 'Failed to fetch latest releases from IGDB API' });
    }
    
    const firstData = await firstResponse.json();
    const secondData = await secondResponse.json();
    
    if (isDevelopment) {
      console.log('🔧 LATEST RELEASES DEBUG: First batch games count =', firstData?.length || 0);
      console.log('🔧 LATEST RELEASES DEBUG: Second batch games count =', secondData?.length || 0);
    }
    
    // Combine results and remove any duplicates by ID
    const combinedGames = [...firstData, ...secondData];
    const uniqueGames = Array.from(new Map(combinedGames.map(game => [game.id, game])).values());
    
    if (isDevelopment) {
      console.log('🔧 LATEST RELEASES DEBUG: Combined unique games count =', uniqueGames.length);
      console.log('🔧 LATEST RELEASES DEBUG: Sending response...');
    }
    
    res.json(uniqueGames);
  } catch (error) {
    if (isDevelopment) {
      console.error('🔧 LATEST RELEASES ERROR: Exception caught:', error.message);
      console.error('🔧 LATEST RELEASES ERROR: Stack trace:', error.stack);
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add top rated games endpoint
app.get('/api/games/top-rated', async (req, res) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    console.log('🔧 TOP-RATED GAMES DEBUG: Endpoint called');
    console.log('🔧 TOP-RATED GAMES DEBUG: IGDB_CLIENT_ID available =', !!process.env.IGDB_CLIENT_ID);
    console.log('🔧 TOP-RATED GAMES DEBUG: IGDB_ACCESS_TOKEN available =', !!process.env.IGDB_ACCESS_TOKEN);
  }
  
  try {
    const API_BASE_URL = process.env.API_BASE_URL;
    if (!API_BASE_URL) {
      return res.status(500).json({ error: 'API_BASE_URL not configured' });
    }
    const token = process.env.IGDB_ACCESS_TOKEN;
    const clientId = process.env.IGDB_CLIENT_ID;
    
    if (isDevelopment) {
      console.log('🔧 TOP-RATED GAMES DEBUG: Using API_BASE_URL =', API_BASE_URL);
      console.log('🔧 TOP-RATED GAMES DEBUG: Token length =', token ? token.length : 'MISSING');
      console.log('🔧 TOP-RATED GAMES DEBUG: Client ID length =', clientId ? clientId.length : 'MISSING');
    }
    
    if (!token || !clientId) {
      if (isDevelopment) {
        console.error('🔧 TOP-RATED GAMES ERROR: Missing IGDB credentials');
        console.error('🔧 TOP-RATED GAMES ERROR: Token =', !!token);
        console.error('🔧 TOP-RATED GAMES ERROR: Client ID =', !!clientId);
      }
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
    
    if (isDevelopment) {
      console.log('🔧 TOP-RATED GAMES DEBUG: Sending first request...');
    }
    
    const firstResponse = await fetch(`${API_BASE_URL}/games`, {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/plain'
      },
      body: firstQuery
    });
    
    if (isDevelopment) {
      console.log('🔧 TOP-RATED GAMES DEBUG: First response status =', firstResponse.status);
      console.log('🔧 TOP-RATED GAMES DEBUG: First response ok =', firstResponse.ok);
    }
    
    if (isDevelopment) {
      console.log('🔧 TOP-RATED GAMES DEBUG: Sending second request...');
    }
    
    const secondResponse = await fetch(`${API_BASE_URL}/games`, {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/plain'
      },
      body: secondQuery
    });
    
    if (isDevelopment) {
      console.log('🔧 TOP-RATED GAMES DEBUG: Second response status =', secondResponse.status);
      console.log('🔧 TOP-RATED GAMES DEBUG: Second response ok =', secondResponse.ok);
    }
    
    if (!firstResponse.ok || !secondResponse.ok) {
      if (isDevelopment) {
        console.error('🔧 TOP-RATED GAMES ERROR: API responses not ok');
        console.error('🔧 TOP-RATED GAMES ERROR: First response status =', firstResponse.status);
        console.error('🔧 TOP-RATED GAMES ERROR: Second response status =', secondResponse.status);
      }
      return res.status(500).json({ error: 'Failed to fetch top-rated games from IGDB API' });
    }
    
    const firstData = await firstResponse.json();
    const secondData = await secondResponse.json();
    
    if (isDevelopment) {
      console.log('🔧 TOP-RATED GAMES DEBUG: First batch games count =', firstData?.length || 0);
      console.log('🔧 TOP-RATED GAMES DEBUG: Second batch games count =', secondData?.length || 0);
    }
    
    // Combine results and remove any duplicates by ID
    const combinedGames = [...firstData, ...secondData];
    const uniqueGames = Array.from(new Map(combinedGames.map(game => [game.id, game])).values());
    
    if (isDevelopment) {
      console.log('🔧 TOP-RATED GAMES DEBUG: Combined unique games count =', uniqueGames.length);
      console.log('🔧 TOP-RATED GAMES DEBUG: Sending response...');
    }
    
    res.json(uniqueGames);
  } catch (error) {
    if (isDevelopment) {
      console.error('🔧 TOP-RATED GAMES ERROR: Exception caught:', error.message);
      console.error('🔧 TOP-RATED GAMES ERROR: Stack trace:', error.stack);
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add upcoming games endpoint
app.get('/api/games/upcoming', async (req, res) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    console.log('🔧 UPCOMING GAMES DEBUG: Endpoint called');
    console.log('🔧 UPCOMING GAMES DEBUG: IGDB_CLIENT_ID available =', !!process.env.IGDB_CLIENT_ID);
    console.log('🔧 UPCOMING GAMES DEBUG: IGDB_ACCESS_TOKEN available =', !!process.env.IGDB_ACCESS_TOKEN);
  }
  
  try {
    const API_BASE_URL = process.env.API_BASE_URL;
    if (!API_BASE_URL) {
      return res.status(500).json({ error: 'API_BASE_URL not configured' });
    }
    const token = process.env.IGDB_ACCESS_TOKEN;
    const clientId = process.env.IGDB_CLIENT_ID;
    
    if (isDevelopment) {
      console.log('🔧 UPCOMING GAMES DEBUG: Using API_BASE_URL =', API_BASE_URL);
      console.log('🔧 UPCOMING GAMES DEBUG: Token length =', token ? token.length : 'MISSING');
      console.log('🔧 UPCOMING GAMES DEBUG: Client ID length =', clientId ? clientId.length : 'MISSING');
    }
    
    if (!token || !clientId) {
      if (isDevelopment) {
        console.error('🔧 UPCOMING GAMES ERROR: Missing IGDB credentials');
        console.error('🔧 UPCOMING GAMES ERROR: Token =', !!token);
        console.error('🔧 UPCOMING GAMES ERROR: Client ID =', !!clientId);
      }
      return res.status(500).json({ error: 'IGDB API credentials not configured' });
    }
    
    // Current timestamp in seconds
    const now = Math.floor(Date.now() / 1000);
    // 1 year in the future
    const oneYearLater = now + (60 * 60 * 24 * 365);
    
    if (isDevelopment) {
      console.log('🔧 UPCOMING GAMES DEBUG: Time range =', { now, oneYearLater });
    }
    
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
    
    if (isDevelopment) {
      console.log('🔧 UPCOMING GAMES DEBUG: Sending first request...');
    }
    
    const firstResponse = await fetch(`${API_BASE_URL}/games`, {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/plain'
      },
      body: firstQuery
    });
    
    if (isDevelopment) {
      console.log('🔧 UPCOMING GAMES DEBUG: First response status =', firstResponse.status);
      console.log('🔧 UPCOMING GAMES DEBUG: First response ok =', firstResponse.ok);
    }
    
    if (isDevelopment) {
      console.log('🔧 UPCOMING GAMES DEBUG: Sending second request...');
    }
    
    const secondResponse = await fetch(`${API_BASE_URL}/games`, {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/plain'
      },
      body: secondQuery
    });
    
    if (isDevelopment) {
      console.log('🔧 UPCOMING GAMES DEBUG: Second response status =', secondResponse.status);
      console.log('🔧 UPCOMING GAMES DEBUG: Second response ok =', secondResponse.ok);
    }
    
    if (!firstResponse.ok || !secondResponse.ok) {
      if (isDevelopment) {
        console.error('🔧 UPCOMING GAMES ERROR: API responses not ok');
        console.error('🔧 UPCOMING GAMES ERROR: First response status =', firstResponse.status);
        console.error('🔧 UPCOMING GAMES ERROR: Second response status =', secondResponse.status);
      }
      return res.status(500).json({ error: 'Failed to fetch upcoming games from IGDB API' });
    }
    
    const firstData = await firstResponse.json();
    const secondData = await secondResponse.json();
    
    if (isDevelopment) {
      console.log('🔧 UPCOMING GAMES DEBUG: First batch games count =', firstData?.length || 0);
      console.log('🔧 UPCOMING GAMES DEBUG: Second batch games count =', secondData?.length || 0);
    }
    
    // Combine results and remove any duplicates by ID
    const combinedGames = [...firstData, ...secondData];
    const uniqueGames = Array.from(new Map(combinedGames.map(game => [game.id, game])).values());
    
    if (isDevelopment) {
      console.log('🔧 UPCOMING GAMES DEBUG: Combined unique games count =', uniqueGames.length);
      console.log('🔧 UPCOMING GAMES DEBUG: Sending response...');
    }
    
    res.json(uniqueGames);
  } catch (error) {
    if (isDevelopment) {
      console.error('🔧 UPCOMING GAMES ERROR: Exception caught:', error.message);
      console.error('🔧 UPCOMING GAMES ERROR: Stack trace:', error.stack);
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add all-categories endpoint
app.get('/api/games/all-categories', async (req, res) => {
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
app.get('/api/games/:id', async (req, res) => {
  try {
    const gameId = req.params.id;
    const API_BASE_URL = process.env.API_BASE_URL || 'https://api.igdb.com/v4';
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

  const API_BASE_URL = process.env.API_BASE_URL; 
  if (!API_BASE_URL) {
    return res.status(500).json({ error: 'API_BASE_URL not configured' });
  }
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

// Add a catch-all route handler for any requests that don't match the above routes
// This must be the last route
app.get('*', (req, res) => {
  // Prevent direct access to sensitive endpoints like GraphQL or API
  if (req.path.includes('/graphql') || req.path.startsWith('/api/')) {
    return res.status(401).json({ message: 'Unauthorized access. Please log in.' });
  }
  
  // For Lambda deployment, just return a 404 for non-API routes instead of serving static files
  return res.status(404).json({ message: 'Not found. This is an API server only.' });
});

// Add global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize Apollo GraphQL and then start the server
try {
  const init = initializeApolloServer();
  if (init && typeof init.then === 'function') {
    init.then(() => {
      console.log('EXPRESS_APP_LOG: Apollo initialized, starting HTTP server');
    }).catch((e) => {
      console.error('EXPRESS_APP_LOG: Apollo initialization failed, continuing without GraphQL', e);
    });
  }
} catch (e) {
  console.error('EXPRESS_APP_LOG: Error initializing Apollo (non-fatal)', e);
}

app.listen(process.env.PORT, () => {
  console.log(`EXPRESS_APP_LOG: Server listening on port ${process.env.PORT}`);
});

// Add this right BEFORE export default app;
console.log('EXPRESS_APP_LOG: SM_LAST - src/server.js fully initialized, exporting app.');