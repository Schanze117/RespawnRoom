// Add this at the VERY TOP of src/server.js
//

import express from 'express';

import dotenv from 'dotenv';

// Hardcode environment variables for production Lambda deployment
process.env.API_BASE_URL = 'https://api.igdb.com/v4';
// All environment variables must be set via .env file or deployment environment
// No hardcoded values allowed for production deployment
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
	dotenv.config({ path: path.resolve(__dirname, '../../.env') });
	
} catch (error) {
	
	// Don't exit process, let Lambda handle it
}

// Create Express app
const app = express();

// Add comprehensive logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`🚀 [${new Date().toISOString()}] ${req.method} ${req.path} - Request started`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`✅ [${new Date().toISOString()}] ${req.method} ${req.path} - Completed in ${duration}ms (Status: ${res.statusCode})`);
  });
  
  next();
});

// Define allowed origins for CORS strictly from environment
// Provide a comma-separated list via CORS_ALLOWED_ORIGINS
const allowedOrigins = Array.from(new Set([
	...(process.env.CORS_ALLOWED_ORIGINS ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean) : []),
	...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : [])
]));

// *** IMPORTANT: Apply CORS as the VERY FIRST middleware ***
const corsOptions = {
	origin: function (origin, callback) {
		// Allow requests with no origin (like Insomnia, curl)
		if (!origin || allowedOrigins.indexOf(origin) !== -1) {
			callback(null, true);
		} else {
			
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
		return true;
	}
	
	if (apolloInitializationPromise) {
		return apolloInitializationPromise;
	}
	
	// Create a new promise for initialization and store it
	apolloInitializationPromise = (async () => {
		try {
			await apolloServer.start();
			
			// 5. FIFTH: Apply Apollo middleware AFTER server is started
			// Express will use the CORS headers from the global middleware for this route
			app.use('/graphql', 
				expressMiddleware(apolloServer, {
					context: async ({ req }) => {
						const requestId = Date.now().toString();
						console.log(`🔍 [${new Date().toISOString()}] [${requestId}] GRAPHQL: Request started - Path: ${req.path}, Method: ${req.method}`);
						
						const user = getUserFromToken(req);
						console.log(`🔍 [${new Date().toISOString()}] [${requestId}] GRAPHQL: User authentication - User found: ${user ? 'YES' : 'NO'}`);
						
						return { user, requestId };
					},
					// Explicitly disable Apollo's built-in CORS handling to avoid conflicts
					// Let the global Express CORS middleware handle all CORS concerns
					cors: false
				})
			);
			
			// Mark as initialized only after everything succeeds
			apolloInitialized = true;
			return true;
		} catch (error) {
			// Reset the promise on error so initialization can be retried
			apolloInitializationPromise = null;
			return false;
		}
	})();
	
	return apolloInitializationPromise;
};

// DO NOT call initializeApolloServer() at module level



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
	// For Lambda deployment, just return a 404 for unmatched routes
	return res.status(404).json({ message: 'Not found. This is an API server only.' });
});

// Add global error handler
app.use((err, req, res, next) => {
	res.status(500).json({ error: 'Internal server error' });
});

// Initialize Apollo GraphQL and then start the server
console.log(`🚀 [${new Date().toISOString()}] SERVER: Starting server initialization...`);
console.log(`🚀 [${new Date().toISOString()}] SERVER: Environment variables - PORT: ${process.env.PORT}, NODE_ENV: ${process.env.NODE_ENV}`);

try {
	const init = initializeApolloServer();
	if (init && typeof init.then === 'function') {
		init.then(() => {
			console.log(`✅ [${new Date().toISOString()}] SERVER: Apollo GraphQL server initialized successfully`);
		}).catch((e) => {
			console.error(`❌ [${new Date().toISOString()}] SERVER: Apollo GraphQL initialization failed:`, e.message);
		});
	}
} catch (e) {
	console.error(`❌ [${new Date().toISOString()}] SERVER: Error during Apollo initialization:`, e.message);
}

app.listen(process.env.PORT, () => {
	console.log(`✅ [${new Date().toISOString()}] SERVER: Express server started on port ${process.env.PORT}`);
	console.log(`✅ [${new Date().toISOString()}] SERVER: Server ready to handle requests`);
});

// Add this right BEFORE export default app;
//