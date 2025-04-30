import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import mongoose from 'mongoose';

// Setup __dirname for ES modules
const __dirname = dirname(fileURLToPath(import.meta.url));
// Configure dotenv to load from root directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// MongoDB connection string
const connectionString = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/respawnroom';

mongoose.connect(connectionString, {
  // Connection options are managed automatically in newer versions of Mongoose
});

const db = mongoose.connection;

db.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

db.once('open', () => {
  console.log('Connected to MongoDB database');
});

export default db;
