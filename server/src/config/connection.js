import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import mongoose from 'mongoose';

//

// Setup __dirname for ES modules
const __dirname = dirname(fileURLToPath(import.meta.url));

// Configure dotenv to load from root directory
try {
  dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
  
} catch (error) {
  console.error('DB_CONNECTION_LOG: Error configuring dotenv:', error);
  // Don't exit process - continue with possibly undefined env vars
}

// MongoDB connection string
const connectionString = process.env.MONGODB_URI;

// Log connection string availability (not the actual string for security)
 

if (!connectionString) {
  
  // Don't exit process - let Lambda handler handle the error gracefully
} else {
  // Validate connection string format
  if (!connectionString.startsWith('mongodb://') && !connectionString.startsWith('mongodb+srv://')) {
    
    // Don't exit process
  } else {
    // Setup connection with proper error handling
    
    mongoose.connect(connectionString, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }).catch(err => {
      
      // Don't exit process
    });

    const db = mongoose.connection;

    db.on('error', (err) => {
      
      // Don't exit process
    });

    db.once('open', () => {
      
    });
  }
}

// Export the mongoose connection
const db = mongoose.connection;
export default db;
