import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import mongoose from 'mongoose';

console.log('DB_CONNECTION_LOG: CM00 - connection.js execution started');

// Setup __dirname for ES modules
const __dirname = dirname(fileURLToPath(import.meta.url));

// Configure dotenv to load from root directory
try {
  dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
  console.log('DB_CONNECTION_LOG: CM01 - dotenv configured');
} catch (error) {
  console.error('DB_CONNECTION_LOG: Error configuring dotenv:', error);
  // Don't exit process - continue with possibly undefined env vars
}

// MongoDB connection string
const connectionString = process.env.MONGODB_URI;

// Log connection string availability (not the actual string for security)
console.log('DB_CONNECTION_LOG: CM02 - MONGODB_URI available:', !!connectionString);

if (!connectionString) {
  console.error('DB_CONNECTION_LOG: CRITICAL - MONGODB_URI is not defined');
  // Don't exit process - let Lambda handler handle the error gracefully
} else {
  // Validate connection string format
  if (!connectionString.startsWith('mongodb://') && !connectionString.startsWith('mongodb+srv://')) {
    console.error('DB_CONNECTION_LOG: CRITICAL - Invalid MongoDB connection string format');
    // Don't exit process
  } else {
    // Setup connection with proper error handling
    console.log('DB_CONNECTION_LOG: CM03 - Connecting to MongoDB...');
    mongoose.connect(connectionString, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }).catch(err => {
      console.error('DB_CONNECTION_LOG: CRITICAL - Failed to connect to MongoDB:', err.message);
      // Don't exit process
    });

    const db = mongoose.connection;

    db.on('error', (err) => {
      console.error('DB_CONNECTION_LOG: MongoDB connection error:', err.message);
      // Don't exit process
    });

    db.once('open', () => {
      console.log('DB_CONNECTION_LOG: CM04 - MongoDB connection successful');
    });
  }
}

// Export the mongoose connection
const db = mongoose.connection;
export default db;
