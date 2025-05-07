import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { User, Message, VideoGame } from '../models/index.js';

// Setup __dirname for ES modules
const __dirname = dirname(fileURLToPath(import.meta.url));
// Configure dotenv to load from root directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// MongoDB connection string (using same as in connection.js)
const connectionString = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/respawnroom';

// Database connection
async function connectToDatabase() {
  try {
    await mongoose.connect(connectionString);
    return true;
  } catch (error) {
    return false;
  }
}

// Function to get database statistics
async function getDatabaseStats() {
  try {
    const userCount = await User.countDocuments();
    const messageCount = await Message.countDocuments();
    
    const userWithFriendsCount = await User.countDocuments({ friends: { $exists: true, $ne: [] } });
    const userWithRequestsCount = await User.countDocuments({ friendRequests: { $exists: true, $ne: [] } });
    const userWithGamesCount = await User.countDocuments({ savedGames: { $exists: true, $ne: [] } });
    
    return { userCount, messageCount, userWithFriendsCount, userWithRequestsCount, userWithGamesCount };
  } catch (error) {
    return null;
  }
}

// Clean database function
async function cleanDatabase() {
  try {
    // Clear all messages
    const messagesResult = await Message.deleteMany({});

    // Clean user data (approach 2 - keep users but clear their data)
    const usersUpdateResult = await User.updateMany(
      {}, // Match all users
      { 
        $set: { 
          friends: [],
          friendRequests: [],
          savedGames: [],
          categoryTokens: {},
          status: 'Offline',
          lastSeen: new Date(),
        }
      }
    );

    return true;
  } catch (error) {
    return false;
  }
}

// Main function
async function main() {
  try {
    // Connect to the database
    const connected = await connectToDatabase();
    if (!connected) {
      process.exit(1);
    }

    // Get initial database stats
    const beforeStats = await getDatabaseStats();
    
    // Clean the database
    const cleanupSuccessful = await cleanDatabase();
    if (!cleanupSuccessful) {
      process.exit(1);
    }
    
    // Get stats after cleanup
    const afterStats = await getDatabaseStats();
    
  } catch (error) {
    // Error occurred
  } finally {
    // Close connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(0);
  }
}

// Run the script
main(); 