// Add this at the VERY TOP of index.js
console.log('LAMBDA_HANDLER_LOG: IM00 - index.js execution started');

// Global error handlers (ensure these are at the absolute top)
process.on('uncaughtException', (error) => {
  console.error('GLOBAL_UNCAUGHT_EXCEPTION:', JSON.stringify({
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
  }, null, 2));
});

process.on('unhandledRejection', (reason) => {
  console.error('GLOBAL_UNHANDLED_REJECTION:', JSON.stringify({
    reason: reason instanceof Error ? {
      name: reason.name,
      message: reason.message,
      stack: reason.stack,
    } : reason,
  }, null, 2));
});

import serverless from 'serverless-http';
console.log('LAMBDA_HANDLER_LOG: IM01 - serverless-http imported successfully. Type:', typeof serverless);

// Import the Express app and Apollo initialization function
import app, { initializeApolloServer } from './src/server.js';
console.log('LAMBDA_HANDLER_LOG: IM02 - Express app imported successfully. Type:', typeof app);

// Create serverless handler immediately with the Express app
let serverlessHandler;
try {
  serverlessHandler = serverless(app);
  console.log('LAMBDA_HANDLER_LOG: IM03 - serverless(app) wrapper created successfully');
} catch (error) {
  console.error('LAMBDA_HANDLER_LOG: IM04_ERROR - Error creating serverless handler:', error);
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
    console.log('LAMBDA_HANDLER_LOG: IM05 - Apollo Server initialization completed:', result);
  })
  .catch(error => {
    console.error('LAMBDA_HANDLER_LOG: IM06_ERROR - Apollo Server initialization failed:', error);
  });

export const handler = async (event, context) => {
  console.log("LAMBDA_HANDLER_LOG: IM_VERY_EARLY - Handler invoked. Raw event path:", event.path);
  
  // Log complete event for debugging
  console.log("LAMBDA_EVENT:", JSON.stringify({
    path: event.path,
    httpMethod: event.httpMethod,
    headers: event.headers,
    queryStringParameters: event.queryStringParameters,
    multiValueQueryStringParameters: event.multiValueQueryStringParameters,
    requestContext: event.requestContext,
    // Don't log body for privacy/security
    hasBody: !!event.body
  }, null, 2));
  
  try {
    // Check if this is a GraphQL request and Apollo isn't initialized yet
    if (event.path === '/graphql' && !apolloServerReady) {
      console.log('LAMBDA_HANDLER_LOG: GraphQL request received but Apollo Server not ready');
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
      console.error('LAMBDA_HANDLER_LOG: serverlessHandler is not available');
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Internal Server Error' })
      };
    }
    
    const result = await serverlessHandler(event, context);
    console.log("LAMBDA_HANDLER_LOG: IM07 - serverlessHandler executed successfully");
    return result;
  } catch (error) {
    console.error("!!! LAMBDA_HANDLER_CRITICAL_ERROR !!! An error occurred in handlerInstance execution:");
    console.error("Error Name:", error.name);
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);
    console.error("!!! FAILED EVENT PATH (logged in handler catch) !!!", event.path);
    
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