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

console.log('Environment:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
// MongoDB connection string (using same as in connection.js)
const connectionString = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/respawnroom';
const maskedUri = connectionString.replace(/(mongodb:\/\/[^:]+:)([^@]+)(@.+)/, '$1****$3');
console.log('- Database URI:', maskedUri);

// Database connection
async function connectToDatabase() {
  try {
    console.log('\nAttempting to connect to MongoDB...');
    await mongoose.connect(connectionString);
    console.log('✅ Connected to MongoDB successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
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
    
    console.log('\nDatabase Statistics:');
    console.log(`- Total Users: ${userCount}`);
    console.log(`- Total Messages: ${messageCount}`);
    console.log(`- Users with Friends: ${userWithFriendsCount}`);
    console.log(`- Users with Friend Requests: ${userWithRequestsCount}`);
    console.log(`- Users with Saved Games: ${userWithGamesCount}`);
    
    return { userCount, messageCount, userWithFriendsCount, userWithRequestsCount, userWithGamesCount };
  } catch (error) {
    console.error('Error getting database stats:', error);
    return null;
  }
}

// Clean database function
async function cleanDatabase() {
  try {
    console.log('\n🧹 Starting database cleanup...');

    // Clear all messages
    const messagesResult = await Message.deleteMany({});
    console.log(`✅ Deleted ${messagesResult.deletedCount} messages`);

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
    console.log(`✅ Updated ${usersUpdateResult.modifiedCount} users, clearing their friends, requests, and saved games`);

    console.log('✅ Database cleanup completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    return false;
  }
}

// Main function
async function main() {
  try {
    // Connect to the database
    const connected = await connectToDatabase();
    if (!connected) {
      console.error('Failed to connect to the database. Exiting.');
      process.exit(1);
    }

    // Get initial database stats
    console.log('\n📊 BEFORE CLEANUP:');
    const beforeStats = await getDatabaseStats();
    
    // Clean the database
    const cleanupSuccessful = await cleanDatabase();
    if (!cleanupSuccessful) {
      console.error('Database cleanup failed. Exiting.');
      process.exit(1);
    }
    
    // Get stats after cleanup
    console.log('\n📊 AFTER CLEANUP:');
    const afterStats = await getDatabaseStats();
    
    // Summary
    console.log('\n📝 CLEANUP SUMMARY:');
    console.log(`- Messages Deleted: ${beforeStats?.messageCount || 0}`);
    console.log(`- Users Modified: ${afterStats?.userCount || 0}`);
    console.log(`- Friendships Removed: ${beforeStats?.userWithFriendsCount || 0}`);
    console.log(`- Friend Requests Cleared: ${beforeStats?.userWithRequestsCount || 0}`);
    console.log(`- Saved Games Removed: ${beforeStats?.userWithGamesCount || 0}`);
    
    console.log('\n✅ All tasks completed successfully.');
  } catch (error) {
    console.error('❌ An error occurred:', error);
  } finally {
    // Close connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('Database connection closed');
    }
    process.exit(0);
  }
}

// Run the script
main(); 