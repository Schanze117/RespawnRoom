// Add this at the VERY TOP of index.js
//

// Global error handlers (ensure these are at the absolute top)
process.on('uncaughtException', (error) => {
  //
});

process.on('unhandledRejection', (reason) => {
  //
});

import serverless from 'serverless-http';

// Import the Express app and Apollo initialization function
import app, { initializeApolloServer } from './src/server.js';

// Create serverless handler immediately with the Express app
let serverlessHandler;
try {
  serverlessHandler = serverless(app);
} catch (error) {
  // Don't throw error here, continue execution
}

// Try to initialize Apollo Server in the background
// This won't block Lambda handler execution
let apolloServerReady = false;

// Initiate Apollo Server initialization once at module level
// The initializeApolloServer function is now memoized to prevent duplicate starts
initializeApolloServer()
  .then(result => {
    apolloServerReady = result;
  })
  .catch(error => {
    //
  });

export const handler = async (event, context) => {
  try {
    // Check if this is a GraphQL request and Apollo isn't initialized yet
    if (event.path === '/graphql' && !apolloServerReady) {
      return {
        statusCode: 503,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: 'GraphQL service is starting up, please try again in a moment' 
        })
      };
    }
    
    // Handle the request with serverless-http
    if (!serverlessHandler) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Internal Server Error' })
      };
    }
    
    const result = await serverlessHandler(event, context);
    return result;
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'production' ? 'Unknown error' : error.message
      })
    };
  }
};