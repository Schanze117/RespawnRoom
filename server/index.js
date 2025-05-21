// Add this at the VERY TOP of index.js
console.log('LAMBDA_HANDLER_LOG: IM00 - index.js execution started');

import serverless from 'serverless-http';
console.log('LAMBDA_HANDLER_LOG: IM01 - serverless-http imported successfully. Type:', typeof serverless);

import app from './src/server.js'; // Ensure this path correctly points to your Express app
console.log('LAMBDA_HANDLER_LOG: IM02 - Express app imported successfully. Type:', typeof app);

let handlerInstance;
try {
  handlerInstance = serverless(app);
  console.log('LAMBDA_HANDLER_LOG: IM03 - serverless(app) wrapper created successfully.');
} catch (e) {
  console.error('LAMBDA_HANDLER_LOG: IM04_ERROR - CRITICAL ERROR during serverless(app) wrapping:', JSON.stringify(e, Object.getOwnPropertyNames(e), 2));
  throw e; // Re-throw to ensure Lambda knows about the critical failure
}

// THIS IS NOW YOUR ACTUAL APPLICATION HANDLER with robust logging
export const handler = async (event, context) => {
  // Log at the absolute beginning of the handler
  console.log("LAMBDA_HANDLER_LOG: IM_VERY_EARLY - Handler invoked. Raw event received:", JSON.stringify(event, null, 2));

  try {
    // Optional: Another log before calling the instance if needed for fine-grained timing
    // console.log("LAMBDA_HANDLER_LOG: IM05_PRE_INSTANCE - About to call handlerInstance.");

    const result = await handlerInstance(event, context); // This is your actual app logic

    console.log("LAMBDA_HANDLER_LOG: IM07 - handlerInstance executed successfully.");
    return result;
  } catch (error) {
    console.error("!!! LAMBDA_HANDLER_CRITICAL_ERROR !!! An error occurred in handlerInstance execution:");
    console.error(error); // Log the full error object (name, message, stack)
    // Event was already logged by IM_VERY_EARLY, but logging again associates it with this specific error
    console.error("!!! FAILED EVENT PAYLOAD (logged in handler catch) !!! Event being processed:", JSON.stringify(event, null, 2));
    throw error; // Re-throw so Lambda marks invocation as failed
  }
};